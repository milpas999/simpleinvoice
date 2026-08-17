import { ValueTransformer } from 'typeorm';

/** pg returns NUMERIC/DECIMAL columns as strings by default; convert to/from JS number. */
export const DecimalTransformer: ValueTransformer = {
  to: (value?: number) => value,
  from: (value?: string) =>
    value === null || value === undefined ? value : parseFloat(value),
};
