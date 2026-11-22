// Une visite : empreinte d'un appareil sur une journée UTC.
export type SessionFacts = {
  // Pages distinctes, URL sans fragment.
  pages: number;
  // `null` si aucune page de la visite n'a de durée.
  durationSum: number | null;
  durationSamples: number;
  // Au moins un événement d'engagement (la durée n'y entre pas).
  engaged: boolean;
};

export type SessionSummary = {
  sessions: number;
  pageviews: number;
  bounces: number;
  realBounces: number;
  engagedSessions: number;
  totalDuration: number;
  durationSamples: number;
};

// Rebond réel : une seule page, sans événement d'engagement, sous `thresholdSeconds`. Une durée
// inconnue compte sous le seuil : le rebond réel majore, il ne minore jamais.
export function summarizeSessions(
  facts: readonly SessionFacts[],
  thresholdSeconds: number,
): SessionSummary {
  const isBounce = (f: SessionFacts) => f.pages === 1;
  const isRealBounce = (f: SessionFacts) =>
    isBounce(f) && !f.engaged && (f.durationSum ?? 0) < thresholdSeconds;
  const total = (pick: (f: SessionFacts) => number) =>
    facts.reduce((sum, f) => sum + pick(f), 0);

  const realBounces = facts.filter(isRealBounce).length;
  return {
    sessions: facts.length,
    pageviews: total((f) => f.pages),
    bounces: facts.filter(isBounce).length,
    realBounces,
    engagedSessions: facts.length - realBounces,
    totalDuration: total((f) => f.durationSum ?? 0),
    durationSamples: total((f) => f.durationSamples),
  };
}
