import Papa from "papaparse";

/* Generate CSV string from data and trigger download */
export function downloadCSV<T extends Record<string, unknown>>(
  data: T[],
  filename: string
) {
  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
