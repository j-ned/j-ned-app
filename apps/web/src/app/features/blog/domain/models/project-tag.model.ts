export type ProjectTag = { readonly tag: string; readonly projectSlug: string };

export const PROJECT_TAGS = [
  { tag: 'DashFlow', projectSlug: 'dashflow' },
  { tag: 'CandiDash', projectSlug: 'candidash' },
  { tag: 'Portfolio', projectSlug: 'portfolio' },
] as const satisfies readonly ProjectTag[];

type ProjectBlogTag = (typeof PROJECT_TAGS)[number]['tag'];

export function projectTagOf(projectSlug: string): ProjectBlogTag | null {
  return PROJECT_TAGS.find((entry) => entry.projectSlug === projectSlug)?.tag ?? null;
}
