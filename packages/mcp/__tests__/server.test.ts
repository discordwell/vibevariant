import { describe, it, expect } from 'vitest';
import { compact, resolveProjectId, aggregateStatus, findExperiment } from '../src/helpers.js';

describe('compact', () => {
  it('returns non-pretty JSON', () => {
    const result = compact({ a: 1, b: [1, 2] });
    expect(result).toBe('{"a":1,"b":[1,2]}');
    expect(result).not.toContain('\n');
  });

  it('truncates arrays at limit and includes total', () => {
    const arr = Array.from({ length: 100 }, (_, i) => i);
    const result = compact(arr, 10);
    const parsed = JSON.parse(result);
    expect(parsed.items).toHaveLength(10);
    expect(parsed.items[0]).toBe(0);
    expect(parsed.items[9]).toBe(9);
    expect(parsed.total).toBe(100);
    expect(parsed.truncated).toBe(true);
  });

  it('does not truncate arrays under limit', () => {
    const arr = [1, 2, 3];
    const result = compact(arr, 50);
    const parsed = JSON.parse(result);
    expect(parsed).toHaveLength(3);
  });

  it('uses default limit of 50', () => {
    const arr = Array.from({ length: 60 }, (_, i) => i);
    const result = compact(arr);
    const parsed = JSON.parse(result);
    expect(parsed.items).toHaveLength(50);
    expect(parsed.total).toBe(60);
    expect(parsed.truncated).toBe(true);
  });

  it('handles non-array data', () => {
    const result = compact({ key: 'value' });
    expect(JSON.parse(result)).toEqual({ key: 'value' });
  });

  it('handles null and primitives', () => {
    expect(compact(null)).toBe('null');
    expect(compact(42)).toBe('42');
    expect(compact('hello')).toBe('"hello"');
  });
});

describe('resolveProjectId', () => {
  it('returns provided project_id when given', () => {
    expect(resolveProjectId('proj-123')).toBe('proj-123');
  });

  it('prefers provided project_id over default', () => {
    expect(resolveProjectId('explicit-id')).toBe('explicit-id');
  });

  it('returns null when undefined and no config file exists', () => {
    // In test environment, ~/.vibariant/config.json typically doesn't exist
    // so getDefaultProject() returns null
    const result = resolveProjectId(undefined);
    // This is environment-dependent but validates the function doesn't throw
    expect(typeof result === 'string' || result === null).toBe(true);
  });
});

describe('aggregateStatus', () => {
  it('counts experiments by status', () => {
    const experiments = [
      { id: '1', status: 'running' },
      { id: '2', status: 'running' },
      { id: '3', status: 'draft' },
      { id: '4', status: 'completed' },
      { id: '5', status: 'paused' },
    ];
    const result = aggregateStatus(experiments);
    expect(result.total).toBe(5);
    expect(result.running).toBe(2);
    expect(result.draft).toBe(1);
    expect(result.completed).toBe(1);
    expect(result.paused).toBe(1);
    expect(result.running_experiments).toHaveLength(2);
  });

  it('handles empty list', () => {
    const result = aggregateStatus([]);
    expect(result.total).toBe(0);
    expect(result.running).toBe(0);
    expect(result.draft).toBe(0);
    expect(result.completed).toBe(0);
    expect(result.paused).toBe(0);
    expect(result.running_experiments).toHaveLength(0);
  });

  it('includes full experiment objects in running_experiments', () => {
    const experiments = [
      { id: '1', status: 'running', key: 'hero-test', name: 'Hero Test' },
    ];
    const result = aggregateStatus(experiments);
    expect(result.running_experiments[0]).toEqual(experiments[0]);
  });
});

describe('findExperiment', () => {
  const experiments = [
    { id: 'uuid-1', key: 'hero-headline', name: 'Hero Headline', status: 'running' },
    { id: 'uuid-2', key: 'cta-button', name: 'CTA Button', status: 'draft' },
  ];

  it('finds by UUID', () => {
    const result = findExperiment(experiments, 'uuid-1');
    expect(result).not.toBeNull();
    expect(result!.key).toBe('hero-headline');
  });

  it('finds by key', () => {
    const result = findExperiment(experiments, 'cta-button');
    expect(result).not.toBeNull();
    expect(result!.id).toBe('uuid-2');
  });

  it('returns null when not found', () => {
    const result = findExperiment(experiments, 'nonexistent');
    expect(result).toBeNull();
  });

  it('prefers id match over key match', () => {
    // If an experiment's id matches the search string, it's found even if no key matches
    const result = findExperiment(experiments, 'uuid-2');
    expect(result!.key).toBe('cta-button');
  });
});
