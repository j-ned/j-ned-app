export const TECHNOLOGY_ICONS = [
  'angular',
  'docker',
  'nestjs',
  'postgresql',
  'tailwindcss',
  'typescript',
] as const;

export type TechnologyIcon = (typeof TECHNOLOGY_ICONS)[number];

export function isTechnologyIcon(icon: string): icon is TechnologyIcon {
  return (TECHNOLOGY_ICONS as readonly string[]).includes(icon);
}
