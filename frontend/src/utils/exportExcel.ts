interface ExportOptions {
  filename: string;
  sheetName?: string;
}

/**
 * Export an array of objects to an Excel (.xlsx) file.
 * Automatically triggers a browser download.
 */
export async function exportToExcel<T extends Record<string, unknown>>(
  data: T[],
  columns: { header: string; key: keyof T }[],
  options: ExportOptions,
) {
  const XLSX = await import('xlsx');
  const { filename, sheetName = 'Data' } = options;

  // Build header row
  const headers = columns.map((c) => c.header);

  // Build data rows
  const rows = data.map((item) =>
    columns.map((c) => {
      const val = item[c.key];
      return val ?? '';
    }),
  );

  const worksheetData = [headers, ...rows];
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

  // Auto-size columns
  const colWidths = columns.map((col, i) => {
    const maxLen = Math.max(col.header.length, ...rows.map((row) => String(row[i] ?? '').length));
    return { wch: Math.min(maxLen + 4, 40) };
  });
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  XLSX.writeFile(workbook, `${filename}.xlsx`);
}
