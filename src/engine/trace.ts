/**
 * Trace step types for algorithm explanations
 */

export interface TraceStep<D = unknown> {
  index: number;
  title: string;
  explanation: string;
  data: D;
  highlight?: {
    states?: string[];
    transitions?: Array<{ from: string; symbol: string; to: string }>;
    tableRows?: number[];
  };
}

export interface Trace<D = unknown> {
  steps: TraceStep<D>[];
}
