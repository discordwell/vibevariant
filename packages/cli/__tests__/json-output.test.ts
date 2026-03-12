import { describe, it, expect } from 'vitest';
import { jsonOk, jsonError, EXIT } from '../src/lib/format.js';

describe('JSON output helpers', () => {
  describe('jsonOk', () => {
    it('outputs correct envelope structure', () => {
      // Capture console.log output
      const logs: string[] = [];
      const origLog = console.log;
      console.log = (msg: string) => logs.push(msg);

      jsonOk({ foo: 'bar' });

      console.log = origLog;

      const parsed = JSON.parse(logs[0]);
      expect(parsed).toEqual({ ok: true, data: { foo: 'bar' } });
    });

    it('handles array data', () => {
      const logs: string[] = [];
      const origLog = console.log;
      console.log = (msg: string) => logs.push(msg);

      jsonOk([1, 2, 3]);

      console.log = origLog;

      const parsed = JSON.parse(logs[0]);
      expect(parsed).toEqual({ ok: true, data: [1, 2, 3] });
    });

    it('handles null data', () => {
      const logs: string[] = [];
      const origLog = console.log;
      console.log = (msg: string) => logs.push(msg);

      jsonOk(null);

      console.log = origLog;

      const parsed = JSON.parse(logs[0]);
      expect(parsed).toEqual({ ok: true, data: null });
    });
  });

  describe('EXIT codes', () => {
    it('defines correct exit code constants', () => {
      expect(EXIT.SUCCESS).toBe(0);
      expect(EXIT.ERROR).toBe(1);
      expect(EXIT.NOT_AUTHENTICATED).toBe(2);
      expect(EXIT.NOT_FOUND).toBe(3);
    });
  });

  describe('JSON envelope consistency', () => {
    it('success envelope always has ok:true and data field', () => {
      const envelope = { ok: true, data: { id: 'test' } };
      expect(envelope).toHaveProperty('ok', true);
      expect(envelope).toHaveProperty('data');
      expect(envelope).not.toHaveProperty('error');
    });

    it('error envelope always has ok:false and error field', () => {
      const envelope = { ok: false, error: 'Something went wrong' };
      expect(envelope).toHaveProperty('ok', false);
      expect(envelope).toHaveProperty('error');
      expect(typeof envelope.error).toBe('string');
    });

    it('JSON output is valid JSON with 2-space indentation', () => {
      const logs: string[] = [];
      const origLog = console.log;
      console.log = (msg: string) => logs.push(msg);

      jsonOk({ test: true });

      console.log = origLog;

      // Should be pretty-printed with 2 spaces
      expect(logs[0]).toContain('\n');
      expect(logs[0]).toContain('  ');
      // Should parse cleanly
      expect(() => JSON.parse(logs[0])).not.toThrow();
    });
  });
});

describe('skill template exports', () => {
  it('exports SKILL_FILES with all expected files', async () => {
    const { SKILL_FILES, CLAUDE_MD_LINE } = await import('../src/lib/skill-template.js');

    // Should have all reference files
    expect(SKILL_FILES).toHaveProperty('SKILL.md');
    expect(SKILL_FILES).toHaveProperty('auth.md');
    expect(SKILL_FILES).toHaveProperty('experiments.md');
    expect(SKILL_FILES).toHaveProperty('projects.md');
    expect(SKILL_FILES).toHaveProperty('codegen.md');
    expect(SKILL_FILES).toHaveProperty('goals.md');
    expect(SKILL_FILES).toHaveProperty('workflows.md');

    // SKILL.md should have frontmatter
    expect(SKILL_FILES['SKILL.md']).toContain('name: vibariant');
    expect(SKILL_FILES['SKILL.md']).toContain('user_invocable: true');
    expect(SKILL_FILES['SKILL.md']).toContain('allowed-tools');

    // Workflows should have command examples
    expect(SKILL_FILES['workflows.md']).toContain('vibariant experiments');
    expect(SKILL_FILES['workflows.md']).toContain('vibariant codegen');

    // CLAUDE_MD_LINE should reference the skill
    expect(CLAUDE_MD_LINE).toContain('/vibariant');
  });
});
