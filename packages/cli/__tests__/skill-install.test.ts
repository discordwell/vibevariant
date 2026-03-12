import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { installSkill, SKILL_FILES, CLAUDE_MD_LINE } from '../src/lib/skill-template.js';

const TEST_DIR = join(tmpdir(), 'vibariant-skill-install-test');

beforeEach(() => {
  rmSync(TEST_DIR, { recursive: true, force: true });
  mkdirSync(TEST_DIR, { recursive: true });
});

afterEach(() => {
  rmSync(TEST_DIR, { recursive: true, force: true });
});

describe('installSkill', () => {
  it('creates all skill files in .claude/skills/vibariant/', () => {
    installSkill(TEST_DIR);

    for (const [filename, content] of Object.entries(SKILL_FILES)) {
      const filePath = join(TEST_DIR, '.claude', 'skills', 'vibariant', filename);
      expect(existsSync(filePath)).toBe(true);
      expect(readFileSync(filePath, 'utf-8')).toBe(content);
    }
  });

  it('installs all expected reference files', () => {
    const expectedFiles = ['SKILL.md', 'auth.md', 'experiments.md', 'projects.md', 'codegen.md', 'goals.md', 'workflows.md'];
    installSkill(TEST_DIR);

    for (const filename of expectedFiles) {
      const filePath = join(TEST_DIR, '.claude', 'skills', 'vibariant', filename);
      expect(existsSync(filePath), `${filename} should exist`).toBe(true);
    }
  });

  it('SKILL.md is a lean router with links to reference files', () => {
    const skillContent = SKILL_FILES['SKILL.md'];
    // Should have frontmatter
    expect(skillContent).toContain('name: vibariant');
    expect(skillContent).toContain('allowed-tools: Bash, Read, Grep');
    // Should reference sub-files
    expect(skillContent).toContain('[auth.md](auth.md)');
    expect(skillContent).toContain('[experiments.md](experiments.md)');
    expect(skillContent).toContain('[codegen.md](codegen.md)');
    expect(skillContent).toContain('[goals.md](goals.md)');
    expect(skillContent).toContain('[workflows.md](workflows.md)');
    // Should be concise (under 50 lines)
    const lineCount = skillContent.split('\n').length;
    expect(lineCount).toBeLessThan(60);
  });

  it('creates CLAUDE.md if it does not exist', () => {
    installSkill(TEST_DIR);

    const claudeMdPath = join(TEST_DIR, 'CLAUDE.md');
    expect(existsSync(claudeMdPath)).toBe(true);

    const content = readFileSync(claudeMdPath, 'utf-8');
    expect(content).toContain(CLAUDE_MD_LINE);
    expect(content).toContain('# Project');
  });

  it('appends to existing CLAUDE.md without duplicating', () => {
    const claudeMdPath = join(TEST_DIR, 'CLAUDE.md');
    writeFileSync(claudeMdPath, '# My Project\n\nSome existing content.\n');

    installSkill(TEST_DIR);

    const content = readFileSync(claudeMdPath, 'utf-8');
    expect(content).toContain('Some existing content.');
    expect(content).toContain(CLAUDE_MD_LINE);

    // Install again — should not duplicate
    installSkill(TEST_DIR);
    const content2 = readFileSync(claudeMdPath, 'utf-8');
    const matches = content2.split(CLAUDE_MD_LINE).length - 1;
    expect(matches).toBe(1);
  });

  it('does not modify CLAUDE.md if it already references vibariant skill', () => {
    const claudeMdPath = join(TEST_DIR, 'CLAUDE.md');
    const original = '# My Project\n\n- Use the /vibariant skill for AB testing\n';
    writeFileSync(claudeMdPath, original);

    installSkill(TEST_DIR);

    const content = readFileSync(claudeMdPath, 'utf-8');
    expect(content).toBe(original);
  });
});
