import { HistoryRow, BackupData, Currency } from '../types';
import { formatDate, formatCurrency } from './formatters';

export function exportJson(data: BackupData): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  downloadBlob(blob, `budgetflow-backup-${dateSuffix()}.json`);
}

export function exportHistoryJson(rows: HistoryRow[]): void {
  const blob = new Blob([JSON.stringify(rows, null, 2)], { type: 'application/json' });
  downloadBlob(blob, `budgetflow-history-${dateSuffix()}.json`);
}

export async function exportExcel(rows: HistoryRow[], currency: Currency): Promise<void> {
  const { utils, writeFile } = await import('xlsx');
  const data = [
    ['Date', 'Type', 'Category', 'Title', 'Amount', 'Notes', 'Recurring'],
    ...rows.map((r) => [
      formatDate(r.date),
      r.type.charAt(0).toUpperCase() + r.type.slice(1),
      r.categoryName ?? '—',
      r.title,
      formatCurrency(r.amount, currency),
      r.note ?? '',
      r.recurring ? 'Yes' : '',
    ]),
  ];
  const ws = utils.aoa_to_sheet(data);
  const wb = utils.book_new();
  utils.book_append_sheet(wb, ws, 'History');
  writeFile(wb, `budgetflow-history-${dateSuffix()}.xlsx`);
}

export async function exportPdf(rows: HistoryRow[], currency: Currency): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  doc.setFontSize(18);
  doc.setTextColor(99, 102, 241);
  doc.text('BudgetFlow — Transaction History', 14, 18);
  doc.setFontSize(10);
  doc.setTextColor(120, 120, 120);
  doc.text(`Exported on ${new Date().toLocaleDateString('en-GB')}`, 14, 26);

  autoTable(doc, {
    startY: 32,
    head: [['Date', 'Type', 'Category', 'Title', 'Amount', 'Notes']],
    body: rows.map((r) => [
      formatDate(r.date),
      r.type.charAt(0).toUpperCase() + r.type.slice(1),
      r.categoryName ?? '—',
      r.title,
      formatCurrency(r.amount, currency),
      r.note ?? '',
    ]),
    headStyles: { fillColor: [99, 102, 241], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 248, 255] },
    styles: { fontSize: 9, cellPadding: 3 },
  });

  doc.save(`budgetflow-history-${dateSuffix()}.pdf`);
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function dateSuffix(): string {
  return new Date().toISOString().slice(0, 10);
}
