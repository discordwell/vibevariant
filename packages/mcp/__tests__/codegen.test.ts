import { describe, it, expect } from 'vitest';
import { generateCode, generateCodeStructured } from '../src/codegen.js';

describe('generateCode', () => {
  it('generates Next.js integration code', () => {
    const code = generateCode('nextjs', 'vv_proj_test123');
    expect(code).toContain('vv_proj_test123');
    expect(code).toContain("'use client'");
    expect(code).toContain('VibariantProvider');
    expect(code).toContain('vibariant.config');
    expect(code).toContain('layout.tsx');
  });

  it('generates React integration code', () => {
    const code = generateCode('react', 'vv_proj_abc');
    expect(code).toContain('vv_proj_abc');
    expect(code).toContain('VibariantProvider');
    expect(code).not.toContain("'use client'");
  });

  it('generates vanilla JS integration code', () => {
    const code = generateCode('vanilla', 'vv_proj_xyz');
    expect(code).toContain('vv_proj_xyz');
    expect(code).toContain("from '@vibariant/sdk'");
    expect(code).toContain('await vibariant.init()');
  });

  it('includes experiment example when key provided', () => {
    const code = generateCode('nextjs', 'vv_proj_test', 'hero-headline');
    expect(code).toContain('hero-headline');
    expect(code).toContain('useVariant');
  });

  it('omits experiment example when no key', () => {
    const code = generateCode('nextjs', 'vv_proj_test');
    expect(code).not.toContain('useVariant');
  });
});

describe('generateCodeStructured', () => {
  it('returns correct file paths for nextjs', () => {
    const result = generateCodeStructured('nextjs', 'vv_proj_test');
    const paths = result.files.map((f) => f.path);
    expect(paths).toContain('vibariant.config.ts');
    expect(paths).toContain('components/vibariant-provider.tsx');
  });

  it('returns correct file paths for react', () => {
    const result = generateCodeStructured('react', 'vv_proj_test');
    const paths = result.files.map((f) => f.path);
    expect(paths).toContain('vibariant.config.ts');
    expect(paths).toContain('src/vibariant-provider.tsx');
  });

  it('returns correct file paths for vanilla', () => {
    const result = generateCodeStructured('vanilla', 'vv_proj_test');
    const paths = result.files.map((f) => f.path);
    expect(paths).toContain('vibariant.config.ts');
    expect(paths).toContain('vibariant.ts');
  });

  it('config file contains project token', () => {
    const result = generateCodeStructured('nextjs', 'vv_proj_abc123');
    const config = result.files.find((f) => f.path === 'vibariant.config.ts');
    expect(config).toBeDefined();
    expect(config!.content).toContain('vv_proj_abc123');
  });

  it('experiment key adds example file for nextjs', () => {
    const result = generateCodeStructured('nextjs', 'vv_proj_test', 'hero-cta');
    const paths = result.files.map((f) => f.path);
    expect(paths).toContain('components/experiment-example.tsx');
    const example = result.files.find((f) => f.path === 'components/experiment-example.tsx');
    expect(example!.content).toContain('hero-cta');
    expect(example!.content).toContain('useVariant');
  });

  it('experiment key adds example file for react', () => {
    const result = generateCodeStructured('react', 'vv_proj_test', 'hero-cta');
    const paths = result.files.map((f) => f.path);
    expect(paths).toContain('src/experiment-example.tsx');
  });

  it('no experiment file when key omitted', () => {
    const result = generateCodeStructured('nextjs', 'vv_proj_test');
    const paths = result.files.map((f) => f.path);
    expect(paths).not.toContain('components/experiment-example.tsx');
  });

  it('no experiment file for vanilla even with key', () => {
    const result = generateCodeStructured('vanilla', 'vv_proj_test', 'hero-cta');
    const paths = result.files.map((f) => f.path);
    expect(paths).not.toContain('components/experiment-example.tsx');
    expect(paths).not.toContain('src/experiment-example.tsx');
  });
});
