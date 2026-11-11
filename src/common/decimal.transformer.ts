import { ValueTransformer } from 'typeorm';

// Kolom decimal di PostgreSQL dikembalikan sebagai string; ubah menjadi number.
export const DecimalTransformer: ValueTransformer = {
  to: (value?: number) => value,
  from: (value?: string | null) =>
    value === null || value === undefined ? value : parseFloat(value),
};
