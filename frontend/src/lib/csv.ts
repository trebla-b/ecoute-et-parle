import Papa from "papaparse";

export interface CsvOptions {
  header?: boolean;
  delimiter?: string;
}

export function parseCsv<T>(text: string, options: CsvOptions = {}): T[] {
  const result = Papa.parse<T>(text, {
    header: options.header ?? true,
    delimiter: options.delimiter ?? ",",
    skipEmptyLines: true
  });
  if (result.errors.length > 0) {
    throw new Error(result.errors.map((err) => err.message).join("; "));
  }
  return result.data;
}

export function stringifyCsv<T extends Record<string, unknown>>(
  rows: T[],
  options: CsvOptions & { columns?: string[] } = {}
): string {
  const { columns, header = true } = options;
  return Papa.unparse(rows, {
    columns,
    header
  });
}
