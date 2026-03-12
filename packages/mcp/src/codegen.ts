export type Framework = 'nextjs' | 'react' | 'vanilla';

interface CodeFile {
  path: string;
  content: string;
}

export function generateCodeStructured(
  framework: Framework,
  projectToken: string,
  experimentKey?: string,
): { files: CodeFile[] } {
  const files: CodeFile[] = [];

  // Config file (all frameworks)
  files.push({
    path: 'vibariant.config.ts',
    content: [
      `export const vibariantConfig = {`,
      `  projectToken: '${projectToken}',`,
      `};`,
    ].join('\n'),
  });

  // Framework-specific provider/init
  switch (framework) {
    case 'nextjs':
      files.push({
        path: 'components/vibariant-provider.tsx',
        content: [
          `'use client';`,
          `import { VibariantProvider } from '@vibariant/sdk/react';`,
          `import { vibariantConfig } from '@/vibariant.config';`,
          ``,
          `export function VibariantWrapper({ children }: { children: React.ReactNode }) {`,
          `  return (`,
          `    <VibariantProvider config={vibariantConfig}>`,
          `      {children}`,
          `    </VibariantProvider>`,
          `  );`,
          `}`,
        ].join('\n'),
      });
      break;
    case 'react':
      files.push({
        path: 'src/vibariant-provider.tsx',
        content: [
          `import { VibariantProvider } from '@vibariant/sdk/react';`,
          `import { vibariantConfig } from './vibariant.config';`,
          ``,
          `export function VibariantWrapper({ children }: { children: React.ReactNode }) {`,
          `  return (`,
          `    <VibariantProvider config={vibariantConfig}>`,
          `      {children}`,
          `    </VibariantProvider>`,
          `  );`,
          `}`,
        ].join('\n'),
      });
      break;
    case 'vanilla':
      files.push({
        path: 'vibariant.ts',
        content: [
          `import { Vibariant } from '@vibariant/sdk';`,
          `import { vibariantConfig } from './vibariant.config';`,
          ``,
          `export const vibariant = new Vibariant(vibariantConfig);`,
          `await vibariant.init();`,
        ].join('\n'),
      });
      break;
  }

  // Example experiment (react/nextjs only, when key provided)
  if (experimentKey && framework !== 'vanilla') {
    files.push({
      path: framework === 'nextjs'
        ? 'components/experiment-example.tsx'
        : 'src/experiment-example.tsx',
      content: [
        `import { useVariant } from '@vibariant/sdk/react';`,
        ``,
        `function MyComponent() {`,
        `  const { variant } = useVariant('${experimentKey}', ['control', 'variant']);`,
        `  if (variant === 'control') return <div>Control</div>;`,
        `  return <div>Variant</div>;`,
        `}`,
      ].join('\n'),
    });
  }

  return { files };
}

export function generateCode(framework: Framework, projectToken: string, experimentKey?: string): string {
  const lines: string[] = [];

  lines.push(`## Vibariant Integration (${framework})\n`);

  // Config
  lines.push('### 1. Config file (`vibariant.config.ts`)\n');
  lines.push('```typescript');
  lines.push(`export const vibariantConfig = {`);
  lines.push(`  projectToken: '${projectToken}',`);
  lines.push(`};`);
  lines.push('```\n');

  // Framework-specific
  switch (framework) {
    case 'nextjs':
      lines.push('### 2. Provider (`components/vibariant-provider.tsx`)\n');
      lines.push('```tsx');
      lines.push("'use client';");
      lines.push("import { VibariantProvider } from '@vibariant/sdk/react';");
      lines.push("import { vibariantConfig } from '@/vibariant.config';");
      lines.push('');
      lines.push('export function VibariantWrapper({ children }: { children: React.ReactNode }) {');
      lines.push('  return (');
      lines.push('    <VibariantProvider config={vibariantConfig}>');
      lines.push('      {children}');
      lines.push('    </VibariantProvider>');
      lines.push('  );');
      lines.push('}');
      lines.push('```\n');
      lines.push('### 3. Add to `app/layout.tsx`\n');
      lines.push('```tsx');
      lines.push("import { VibariantWrapper } from '@/components/vibariant-provider';");
      lines.push('// Wrap {children} with: <VibariantWrapper>{children}</VibariantWrapper>');
      lines.push('```\n');
      break;

    case 'react':
      lines.push('### 2. Provider (`src/vibariant-provider.tsx`)\n');
      lines.push('```tsx');
      lines.push("import { VibariantProvider } from '@vibariant/sdk/react';");
      lines.push("import { vibariantConfig } from './vibariant.config';");
      lines.push('');
      lines.push('export function VibariantWrapper({ children }: { children: React.ReactNode }) {');
      lines.push('  return (');
      lines.push('    <VibariantProvider config={vibariantConfig}>');
      lines.push('      {children}');
      lines.push('    </VibariantProvider>');
      lines.push('  );');
      lines.push('}');
      lines.push('```\n');
      break;

    case 'vanilla':
      lines.push('### 2. Init script (`vibariant.ts`)\n');
      lines.push('```typescript');
      lines.push("import { Vibariant } from '@vibariant/sdk';");
      lines.push("import { vibariantConfig } from './vibariant.config';");
      lines.push('');
      lines.push('export const vibariant = new Vibariant(vibariantConfig);');
      lines.push('await vibariant.init();');
      lines.push('```\n');
      break;
  }

  // Experiment usage
  if (experimentKey && framework !== 'vanilla') {
    lines.push(`### Usage with experiment \`${experimentKey}\`\n`);
    lines.push('```tsx');
    lines.push("import { useVariant } from '@vibariant/sdk/react';");
    lines.push('');
    lines.push('function MyComponent() {');
    lines.push(`  const { variant } = useVariant('${experimentKey}', ['control', 'variant']);`);
    lines.push("  if (variant === 'control') return <div>Control</div>;");
    lines.push('  return <div>Variant</div>;');
    lines.push('}');
    lines.push('```');
  }

  return lines.join('\n');
}
