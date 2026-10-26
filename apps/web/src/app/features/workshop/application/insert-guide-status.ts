import { isoInsertCode } from '../domain/iso-insert-code';
import type { Operation, OperationFamily } from '../domain/models/operation.model';
import type { GuideState } from '../domain/models/recommendation.model';
import { INSERT_GUIDE_COPY } from './insert-guide-copy';

const spokenOperation = (operation: Operation, families: readonly OperationFamily[]): string => {
  const operations = families.flatMap((family) =>
    family.operations.map((candidate) => ({ family, candidate })),
  );
  const shared =
    operations.filter(({ candidate }) => candidate.label === operation.label).length > 1;
  const family = operations.find(({ candidate }) => candidate.id === operation.id)?.family;
  return shared && family ? `${operation.label} (${family.label})` : operation.label;
};

export function insertGuideStatus(state: GuideState, families: readonly OperationFamily[]): string {
  if (state.status === 'incomplete') return '';
  const named = `${state.material.designations[0].value}, ${spokenOperation(state.operation, families)}.`;
  if (state.status === 'unavailable') return `${named} ${INSERT_GUIDE_COPY.unavailable}`;
  const { insert } = state.entry;
  if (insert.kind !== 'iso-1832') return named;
  const { proposals } = insert;
  const intro =
    proposals.length > 1 ? INSERT_GUIDE_COPY.proposedInserts : INSERT_GUIDE_COPY.proposedInsert;
  const codes = proposals
    .map(
      (proposal) =>
        `${isoInsertCode(proposal)} (${INSERT_GUIDE_COPY.situations[proposal.situation].toLocaleLowerCase('fr-FR')})`,
    )
    .join(', ');
  return `${named} ${intro} ${codes}.`;
}
