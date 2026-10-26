import type { IsoInsertProposal } from './models/recommendation.model';

export function isoInsertCode(proposal: IsoInsertProposal): string {
  return proposal.fields.map(({ value }) => value.code).join('');
}
