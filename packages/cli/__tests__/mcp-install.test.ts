import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { installMcpConfig } from '../src/commands/mcp-install.js';

const TEST_DIR = join(tmpdir(), 'vibariant-mcp-install-test');
const FAKE_HOME = join(tmpdir(), 'vibariant-mcp-install-test-home');

beforeEach(() => {
  rmSync(TEST_DIR, { recursive: true, force: true });
  mkdirSync(TEST_DIR, { recursive: true });
  rmSync(FAKE_HOME, { recursive: true, force: true });
  mkdirSync(FAKE_HOME, { recursive: true });
});

afterEach(() => {
  rmSync(TEST_DIR, { recursive: true, force: true });
  rmSync(FAKE_HOME, { recursive: true, force: true });
});

describe('installMcpConfig', () => {
  it('creates .claude/settings.json with MCP server config', () => {
    const result = installMcpConfig(TEST_DIR, 'project');

    const settingsPath = join(TEST_DIR, '.claude', 'settings.json');
    expect(result).toBe(settingsPath);
    expect(existsSync(settingsPath)).toBe(true);

    const settings = JSON.parse(readFileSync(settingsPath, 'utf-8'));
    expect(settings.mcpServers.vibariant).toEqual({
      command: 'npx',
      args: ['@vibariant/mcp'],
    });
  });

  it('creates .claude directory if it does not exist', () => {
    const claudeDir = join(TEST_DIR, '.claude');
    expect(existsSync(claudeDir)).toBe(false);

    installMcpConfig(TEST_DIR, 'project');

    expect(existsSync(claudeDir)).toBe(true);
  });

  it('preserves existing settings when adding MCP config', () => {
    const claudeDir = join(TEST_DIR, '.claude');
    mkdirSync(claudeDir, { recursive: true });
    const settingsPath = join(claudeDir, 'settings.json');
    writeFileSync(
      settingsPath,
      JSON.stringify({
        permissions: { allow: ['Bash'] },
        mcpServers: { other: { command: 'other-server' } },
      }),
    );

    installMcpConfig(TEST_DIR, 'project');

    const settings = JSON.parse(readFileSync(settingsPath, 'utf-8'));
    expect(settings.permissions).toEqual({ allow: ['Bash'] });
    expect(settings.mcpServers.other).toEqual({ command: 'other-server' });
    expect(settings.mcpServers.vibariant).toEqual({
      command: 'npx',
      args: ['@vibariant/mcp'],
    });
  });

  it('is idempotent — running twice does not duplicate', () => {
    installMcpConfig(TEST_DIR, 'project');
    installMcpConfig(TEST_DIR, 'project');

    const settingsPath = join(TEST_DIR, '.claude', 'settings.json');
    const settings = JSON.parse(readFileSync(settingsPath, 'utf-8'));

    // Should have exactly one vibariant entry
    const mcpKeys = Object.keys(settings.mcpServers);
    expect(mcpKeys.filter((k) => k === 'vibariant')).toHaveLength(1);
    expect(settings.mcpServers.vibariant).toEqual({
      command: 'npx',
      args: ['@vibariant/mcp'],
    });
  });

  it('global scope writes to ~/.claude.json', () => {
    const result = installMcpConfig(TEST_DIR, 'global', { homeDir: FAKE_HOME });

    const claudeJson = join(FAKE_HOME, '.claude.json');
    expect(result).toBe(claudeJson);
    expect(existsSync(claudeJson)).toBe(true);

    const settings = JSON.parse(readFileSync(claudeJson, 'utf-8'));
    expect(settings.mcpServers.vibariant).toEqual({
      command: 'npx',
      args: ['@vibariant/mcp'],
    });
  });

  it('global scope preserves existing config', () => {
    const claudeJson = join(FAKE_HOME, '.claude.json');
    writeFileSync(claudeJson, JSON.stringify({ existingKey: true }));

    installMcpConfig(TEST_DIR, 'global', { homeDir: FAKE_HOME });

    const settings = JSON.parse(readFileSync(claudeJson, 'utf-8'));
    expect(settings.existingKey).toBe(true);
    expect(settings.mcpServers.vibariant).toEqual({
      command: 'npx',
      args: ['@vibariant/mcp'],
    });
  });

  it('handles corrupt settings.json gracefully', () => {
    const claudeDir = join(TEST_DIR, '.claude');
    mkdirSync(claudeDir, { recursive: true });
    writeFileSync(join(claudeDir, 'settings.json'), 'not valid json{{{');

    installMcpConfig(TEST_DIR, 'project');

    const settings = JSON.parse(readFileSync(join(claudeDir, 'settings.json'), 'utf-8'));
    expect(settings.mcpServers.vibariant).toEqual({
      command: 'npx',
      args: ['@vibariant/mcp'],
    });
  });
});
