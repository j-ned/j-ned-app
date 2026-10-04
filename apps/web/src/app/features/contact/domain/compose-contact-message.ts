type ContactQualification = {
  readonly message: string;
  readonly projectType: string;
  readonly timeline: string;
};

const PROJECT_TYPE_LABEL = 'Type de projet\u00a0: ';
const TIMELINE_LABEL = 'Délai souhaité\u00a0: ';

export function composeContactMessage({
  message,
  projectType,
  timeline,
}: ContactQualification): string {
  const lines = [
    ...(projectType ? [PROJECT_TYPE_LABEL + projectType] : []),
    ...(timeline ? [TIMELINE_LABEL + timeline] : []),
  ];
  return lines.length ? `${lines.join('\n')}\n\n${message}` : message;
}
