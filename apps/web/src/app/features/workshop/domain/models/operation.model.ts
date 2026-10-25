export type OperationFamilyId =
  'external-turning' | 'internal-turning' | 'grooving-parting' | 'threading' | 'drilling';

export type OperationId =
  | 'external-roughing'
  | 'external-semi-finishing'
  | 'external-finishing'
  | 'internal-roughing'
  | 'internal-finishing'
  | 'grooving'
  | 'parting-off'
  | 'threading'
  | 'insert-drilling';

export type Operation = {
  readonly id: OperationId;
  readonly slug: string;
  readonly label: string;
};

export type OperationFamily = {
  readonly id: OperationFamilyId;
  readonly label: string;
  readonly operations: readonly [Operation, ...Operation[]];
};
