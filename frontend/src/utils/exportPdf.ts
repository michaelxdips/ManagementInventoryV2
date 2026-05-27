import { formatWIBDateTime } from './dateUtils';

interface ExportPdfOptions {
  filename: string;
  title: string;
  subtitle?: string;
  columns: { header: string; dataKey: string }[];
  data: Record<string, unknown>[];
}

export const exportToPdf = async ({ filename, title, subtitle, columns, data }: ExportPdfOptions) => {
  // Give UI a chance to render loading state
  await new Promise(resolve => setTimeout(resolve, 100));

  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ]);

  const doc = new jsPDF();

  // Add Company/App Header
  doc.setFontSize(18);
  doc.setTextColor(47, 129, 247); // Primary blue
  doc.text('Inventory Management System', 14, 20);

  // Add Title
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text(title, 14, 30);

  // Add Subtitle/Date
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  const dateText = subtitle || `Dicetak pada: ${formatWIBDateTime(new Date())}`;
  doc.text(dateText, 14, 36);

  // Prepare table data
  const tableData = data.map((row) =>
    columns.map((col) => {
      const val = row[col.dataKey];
      return val !== null && val !== undefined ? String(val) : '-';
    }),
  );

  autoTable(doc, {
    head: [columns.map((c) => c.header)],
    body: tableData,
    startY: 42,
    theme: 'grid',
    styles: {
      fontSize: 9,
      cellPadding: 4,
    },
    headStyles: {
      fillColor: [47, 129, 247],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [245, 248, 255],
    },
    margin: { top: 40 },
  });

  // Signature Area
  const finalY = (doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY || 42;
  if (finalY + 40 < doc.internal.pageSize.getHeight()) {
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text('Mengetahui,', 140, finalY + 20);
    doc.text('______________________', 140, finalY + 40);
    doc.text('Admin Inventory', 140, finalY + 45);
  }

  doc.save(`${filename}.pdf`);
};
