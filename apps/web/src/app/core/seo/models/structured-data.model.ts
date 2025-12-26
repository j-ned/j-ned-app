export interface StructuredData {
  readonly '@context': string;
  readonly '@type': string;
  readonly [key: string]: unknown;
}
