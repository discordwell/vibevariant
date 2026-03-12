import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { VibariantAPI, getCredentials } from './api.js';
import { generateCodeStructured } from './codegen.js';
import { resolveProjectId, compact, aggregateStatus, findExperiment } from './helpers.js';

const server = new McpServer({
  name: 'vibariant',
  version: '0.2.0',
});

function getApi(): VibariantAPI {
  const creds = getCredentials();
  if (!creds) {
    throw new Error(
      'Not authenticated with Vibariant. Run `npx @vibariant/cli auth login` first.',
    );
  }
  return new VibariantAPI(creds.apiUrl, creds.token);
}

function text(msg: string) {
  return { content: [{ type: 'text' as const, text: msg }] };
}

function noProject() {
  return text('No project_id provided and no default project configured. Run `npx @vibariant/cli init` or pass project_id.');
}

// ─────────────────────────────────────────────────────────────
// Auth
// ─────────────────────────────────────────────────────────────

server.registerTool('vibariant_auth', {
  description: 'Check Vibariant authentication status. If not authenticated, instructs how to log in.',
  annotations: { readOnlyHint: true, openWorldHint: false },
}, async () => {
  const creds = getCredentials();
  if (!creds) {
    return text('Not authenticated. Run `npx @vibariant/cli auth login` to sign in.');
  }

  try {
    const api = new VibariantAPI(creds.apiUrl, creds.token);
    const me = await api.me();
    return text(`Authenticated as ${me.email} (${me.user_id}). API: ${creds.apiUrl}`);
  } catch {
    return text('Token expired. Run `npx @vibariant/cli auth login` to re-authenticate.');
  }
});

// ─────────────────────────────────────────────────────────────
// Projects
// ─────────────────────────────────────────────────────────────

server.registerTool('vibariant_list_projects', {
  description: 'List all Vibariant projects for the authenticated user.',
  annotations: { readOnlyHint: true, openWorldHint: false },
}, async () => {
  const api = getApi();
  const projects = await api.listProjects();
  return text(compact(projects));
});

server.registerTool('vibariant_create_project', {
  description: 'Create a new Vibariant project. Returns project ID, token, and API key.',
  inputSchema: { name: z.string().describe('Project name') },
  annotations: { destructiveHint: false, idempotentHint: false, openWorldHint: false },
}, async ({ name }) => {
  const api = getApi();
  const project = await api.createProject(name);
  return text(compact(project));
});

// ─────────────────────────────────────────────────────────────
// Experiments
// ─────────────────────────────────────────────────────────────

server.registerTool('vibariant_list_experiments', {
  description: 'List all experiments for a Vibariant project.',
  inputSchema: {
    project_id: z.string().describe('Project UUID. If omitted, uses the default project from CLI config.').optional(),
  },
  annotations: { readOnlyHint: true, openWorldHint: false },
}, async ({ project_id }) => {
  const pid = resolveProjectId(project_id);
  if (!pid) return noProject();
  const api = getApi();
  const experiments = await api.listExperiments(pid);
  return text(compact(experiments));
});

server.registerTool('vibariant_create_experiment', {
  description: 'Create a new AB test experiment in draft status.',
  inputSchema: {
    project_id: z.string().describe('Project UUID. If omitted, uses the default project.').optional(),
    key: z.string().describe('Experiment key, e.g. "hero-headline"'),
    name: z.string().describe('Human-readable experiment name'),
    variants: z
      .string()
      .describe('Comma-separated variant keys (default: "control,variant")')
      .optional(),
  },
  annotations: { destructiveHint: false, idempotentHint: false, openWorldHint: false },
}, async ({ project_id, key, name, variants }) => {
  const pid = resolveProjectId(project_id);
  if (!pid) return noProject();
  const api = getApi();
  const variantKeys = variants?.split(',').map((v) => v.trim()) ?? ['control', 'variant'];
  const experiment = await api.createExperiment({
    project_id: pid,
    key,
    name,
    variant_keys: variantKeys,
  });
  return text(`Created experiment:\n${compact(experiment)}`);
});

server.registerTool('vibariant_update_experiment', {
  description: 'Update an experiment status or configuration.',
  inputSchema: {
    experiment_id: z.string().describe('Experiment UUID'),
    status: z.enum(['draft', 'running', 'paused', 'completed']).describe('New status').optional(),
    name: z.string().describe('New display name').optional(),
  },
  annotations: { destructiveHint: false, idempotentHint: true, openWorldHint: false },
}, async ({ experiment_id, status, name }) => {
  const api = getApi();
  const updates: Record<string, string> = {};
  if (status !== undefined) updates.status = status;
  if (name !== undefined) updates.name = name;
  if (Object.keys(updates).length === 0) {
    return text('No updates provided. Specify status or name to update.');
  }
  const experiment = await api.updateExperiment(experiment_id, updates);
  return text(compact(experiment));
});

server.registerTool('vibariant_delete_experiment', {
  description: 'Permanently delete an experiment. This action cannot be undone.',
  inputSchema: {
    experiment_id: z.string().describe('Experiment UUID'),
  },
  annotations: { destructiveHint: true, openWorldHint: false },
}, async ({ experiment_id }) => {
  const api = getApi();
  await api.deleteExperiment(experiment_id);
  return text(`Deleted experiment ${experiment_id}.`);
});

server.registerTool('vibariant_experiment_show', {
  description: 'Show experiment details with current stats. Accepts experiment UUID or key.',
  inputSchema: {
    experiment_id: z.string().describe('Experiment UUID').optional(),
    experiment_key: z.string().describe('Experiment key (alternative to UUID)').optional(),
    project_id: z.string().describe('Project UUID. Required when looking up by key.').optional(),
  },
  annotations: { readOnlyHint: true, openWorldHint: false },
}, async ({ experiment_id, experiment_key, project_id }) => {
  const api = getApi();
  const idOrKey = experiment_id ?? experiment_key;
  if (!idOrKey) {
    return text('Provide either experiment_id or experiment_key.');
  }

  const pid = resolveProjectId(project_id);
  if (!pid) return noProject();

  const experiments = await api.listExperiments(pid);
  const exp = findExperiment(experiments, idOrKey);
  if (!exp) {
    return text(`Experiment "${idOrKey}" not found.`);
  }

  let results: Record<string, unknown> | null = null;
  if (exp.status === 'running' || exp.status === 'completed') {
    try {
      results = await api.getResults(exp.id);
    } catch {}
  }

  return text(compact({ experiment: exp, results }));
});

// ─────────────────────────────────────────────────────────────
// Results
// ─────────────────────────────────────────────────────────────

server.registerTool('vibariant_get_results', {
  description: 'Get statistical results and recommendation for an experiment. Includes decision status, variant metrics, and ROPE analysis.',
  inputSchema: {
    experiment_id: z.string().describe('Experiment UUID'),
  },
  annotations: { readOnlyHint: true, openWorldHint: false },
}, async ({ experiment_id }) => {
  const api = getApi();
  const results = await api.getResults(experiment_id);
  return text(compact(results));
});

// ─────────────────────────────────────────────────────────────
// Goals
// ─────────────────────────────────────────────────────────────

server.registerTool('vibariant_goals_list', {
  description: 'List all goals (conversion metrics) for a project.',
  inputSchema: {
    project_id: z.string().describe('Project UUID. If omitted, uses the default project.').optional(),
  },
  annotations: { readOnlyHint: true, openWorldHint: false },
}, async ({ project_id }) => {
  const pid = resolveProjectId(project_id);
  if (!pid) return noProject();
  const api = getApi();
  const goals = await api.listGoals(pid);
  return text(compact(goals));
});

server.registerTool('vibariant_goals_confirm', {
  description: 'Confirm a goal as a conversion metric for experiment analysis.',
  inputSchema: {
    goal_id: z.string().describe('Goal UUID'),
  },
  annotations: { destructiveHint: false, idempotentHint: true, openWorldHint: false },
}, async ({ goal_id }) => {
  const api = getApi();
  const goal = await api.confirmGoal(goal_id);
  return text(compact(goal));
});

// ─────────────────────────────────────────────────────────────
// Code Generation
// ─────────────────────────────────────────────────────────────

server.registerTool('vibariant_generate_code', {
  description: 'Generate SDK integration code for a specific framework. Returns structured file objects with paths and content.',
  inputSchema: {
    framework: z.enum(['nextjs', 'react', 'vanilla']).describe('Target framework'),
    project_token: z.string().describe('Project token (vv_proj_xxx)'),
    experiment_key: z.string().describe('Experiment key to include in example code').optional(),
  },
  annotations: { readOnlyHint: true, openWorldHint: false },
}, async ({ framework, project_token, experiment_key }) => {
  const result = generateCodeStructured(framework, project_token, experiment_key);
  return text(compact(result));
});

// ─────────────────────────────────────────────────────────────
// Status
// ─────────────────────────────────────────────────────────────

server.registerTool('vibariant_status', {
  description: 'Get project overview with experiment counts by status and list of running experiments.',
  inputSchema: {
    project_id: z.string().describe('Project UUID. If omitted, uses the default project.').optional(),
  },
  annotations: { readOnlyHint: true, openWorldHint: false },
}, async ({ project_id }) => {
  const pid = resolveProjectId(project_id);
  if (!pid) return noProject();
  const api = getApi();
  const experiments = await api.listExperiments(pid);
  return text(compact(aggregateStatus(experiments)));
});

// ─────────────────────────────────────────────────────────────
// Start server
// ─────────────────────────────────────────────────────────────

const transport = new StdioServerTransport();
await server.connect(transport);
