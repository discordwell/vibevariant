import { getDefaultProject } from './api.js';

export function resolveProjectId(projectId?: string): string | null {
  return projectId ?? getDefaultProject()?.id ?? null;
}

export function compact(data: unknown, limit = 50): string {
  if (Array.isArray(data) && data.length > limit) {
    return JSON.stringify({ items: data.slice(0, limit), total: data.length, truncated: true });
  }
  return JSON.stringify(data);
}

export function aggregateStatus(experiments: Array<{ status: string; [k: string]: unknown }>) {
  const running = experiments.filter((e) => e.status === 'running');
  const draft = experiments.filter((e) => e.status === 'draft');
  const paused = experiments.filter((e) => e.status === 'paused');
  const completed = experiments.filter((e) => e.status === 'completed');
  return {
    total: experiments.length,
    running: running.length,
    draft: draft.length,
    paused: paused.length,
    completed: completed.length,
    running_experiments: running,
  };
}

export function findExperiment(
  experiments: Array<{ id: string; key: string; [k: string]: unknown }>,
  idOrKey: string,
) {
  return experiments.find((e) => e.id === idOrKey || e.key === idOrKey) ?? null;
}
