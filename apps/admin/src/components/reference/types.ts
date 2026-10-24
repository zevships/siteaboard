/** Browser-safe display contracts. Pages supply normalized, public or local data. */
export type Row = { label: string; visitors: number | null; country?: string; region?: string };
export type Goal = { event: string; name: string | null; visitors: number; events: number };
export type FunnelStep = {
  id: string;
  name: string;
  nameEn?: string;
  event: string;
  filter: string;
  definition: string;
  definitionEn?: string;
  visitors: number | null;
  prev: number | null;
  byPoint: (number | null)[];
};
export type SourceFunnel = {
  bucket: string;
  label: string;
  labelEn?: string;
  steps: number[];
  marked?: { label: string; labelEn?: string; steps: number[] };
};
