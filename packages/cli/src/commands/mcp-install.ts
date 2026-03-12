import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { Command } from 'commander';
import chalk from 'chalk';

const MCP_SERVER_CONFIG = {
  command: 'npx',
  args: ['@vibariant/mcp'],
};

/**
 * Install the Vibariant MCP server config into Claude settings.
 * Shared by both `vibariant mcp-install` and `vibariant init --mcp`.
 */
export function installMcpConfig(
  dir: string,
  scope: 'project' | 'global',
  options?: { homeDir?: string },
): string {
  if (scope === 'global') {
    const claudeConfig = join(options?.homeDir ?? homedir(), '.claude.json');

    let settings: Record<string, any> = {};
    if (existsSync(claudeConfig)) {
      try {
        settings = JSON.parse(readFileSync(claudeConfig, 'utf-8'));
      } catch {}
    }

    settings.mcpServers = settings.mcpServers ?? {};
    settings.mcpServers.vibariant = MCP_SERVER_CONFIG;

    writeFileSync(claudeConfig, JSON.stringify(settings, null, 2) + '\n');
    return claudeConfig;
  }

  // Project scope
  const settingsDir = join(dir, '.claude');
  const settingsFile = join(settingsDir, 'settings.json');

  if (!existsSync(settingsDir)) {
    mkdirSync(settingsDir, { recursive: true });
  }

  let settings: Record<string, any> = {};
  if (existsSync(settingsFile)) {
    try {
      settings = JSON.parse(readFileSync(settingsFile, 'utf-8'));
    } catch {}
  }

  settings.mcpServers = settings.mcpServers ?? {};
  settings.mcpServers.vibariant = MCP_SERVER_CONFIG;

  writeFileSync(settingsFile, JSON.stringify(settings, null, 2) + '\n');
  return settingsFile;
}

export function registerMcpInstallCommand(program: Command): void {
  const cmd = new Command('mcp-install')
    .description('Install Vibariant MCP server for Claude Code')
    .option('--global', 'Install globally in ~/.claude.json')
    .option('--project', 'Install in .claude/settings.json (default)')
    .action((opts) => {
      const scope = opts.global ? 'global' : 'project';
      const path = installMcpConfig(process.cwd(), scope as 'project' | 'global');

      console.log(chalk.green(`MCP server configured in ${path}`));
      console.log(
        chalk.dim(
          'Note: CLI + /vibariant skill is recommended for frontier models (Claude Opus/Sonnet, GPT-5).\n' +
            'MCP is best for models with weaker tool-use.',
        ),
      );
      console.log(chalk.dim('Restart Claude Code to pick up the new MCP server.'));
    });

  program.addCommand(cmd, { hidden: true });
}
