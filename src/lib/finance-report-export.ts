import type { TrialBalanceItem } from "@/actions/finance/gl/reports";
import { format } from "date-fns";

/** jspdf-autotable adds lastAutoTable to the doc instance at runtime (not in jsPDF types) */
type DocWithAutoTable = { lastAutoTable?: { finalY: number } };

function getTableFinalY(doc: DocWithAutoTable, fallbackY: number): number {
  return doc.lastAutoTable?.finalY ?? fallbackY;
}

function escapeCsvCell(value: string | number): string {
  const s = String(value);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function downloadCsv(filename: string, csvContent: string) {
  const blob = new Blob([`\uFEFF${csvContent}`], {
    type: "text/csv;charset=utf-8",
  });
  downloadBlob(filename, blob);
}

// --- Trial Balance ---

export function exportTrialBalanceToCSV(
  data: TrialBalanceItem[],
  startDate: Date,
  endDate: Date,
) {
  const period = `${format(startDate, "yyyy-MM-dd")}_to_${format(endDate, "yyyy-MM-dd")}`;
  const rows: string[][] = [
    [
      "Trial Balance",
      `Period: ${format(startDate, "PP")} - ${format(endDate, "PP")}`,
    ],
    [],
    ["Account", "Type", "Debit", "Credit"],
  ];
  for (const item of data) {
    rows.push([
      `${item.accountCode} - ${item.accountName}`,
      item.accountType,
      item.totalDebits > 0 ? item.totalDebits.toFixed(2) : "",
      item.totalCredits > 0 ? item.totalCredits.toFixed(2) : "",
    ]);
  }
  const totalDebit = data.reduce((s, i) => s + i.totalDebits, 0);
  const totalCredit = data.reduce((s, i) => s + i.totalCredits, 0);
  rows.push(["Total", "", totalDebit.toFixed(2), totalCredit.toFixed(2)]);

  const csv = rows.map((row) => row.map(escapeCsvCell).join(",")).join("\n");
  downloadCsv(`Trial_Balance_${period}.csv`, csv);
}

export async function exportTrialBalanceToPDF(
  data: TrialBalanceItem[],
  startDate: Date,
  endDate: Date,
) {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;

  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text("Trial Balance", 14, 16);
  doc.setFontSize(10);
  doc.text(
    `Period: ${format(startDate, "PP")} - ${format(endDate, "PP")}`,
    14,
    24,
  );

  const body = data.map((item) => [
    `${item.accountCode} - ${item.accountName}`,
    item.accountType,
    item.totalDebits > 0 ? item.totalDebits.toFixed(2) : "-",
    item.totalCredits > 0 ? item.totalCredits.toFixed(2) : "-",
  ]);
  const totalDebit = data.reduce((s, i) => s + i.totalDebits, 0);
  const totalCredit = data.reduce((s, i) => s + i.totalCredits, 0);
  body.push(["Total", "", totalDebit.toFixed(2), totalCredit.toFixed(2)]);

  autoTable(doc, {
    startY: 30,
    head: [["Account", "Type", "Debit", "Credit"]],
    body,
    foot: [["", "", "", ""]],
    theme: "grid",
    headStyles: { fillColor: [66, 66, 66] },
    margin: { left: 14 },
  });

  const period = `${format(startDate, "yyyy-MM-dd")}_to_${format(endDate, "yyyy-MM-dd")}`;
  doc.save(`Trial_Balance_${period}.pdf`);
}

// --- Income Statement ---

interface IncomeStatementData {
  revenue: {
    accountId: number;
    accountName: string;
    totalDebits: number;
    totalCredits: number;
  }[];
  expenses: {
    accountId: number;
    accountName: string;
    totalDebits: number;
    totalCredits: number;
  }[];
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
}

export function exportIncomeStatementToCSV(
  data: IncomeStatementData,
  startDate: Date,
  endDate: Date,
) {
  const period = `${format(startDate, "yyyy-MM-dd")}_to_${format(endDate, "yyyy-MM-dd")}`;
  const rows: string[][] = [
    [
      "Income Statement",
      `Period: ${format(startDate, "PP")} - ${format(endDate, "PP")}`,
    ],
    [],
    ["Revenue", ""],
  ];
  for (const item of data.revenue) {
    rows.push([
      item.accountName,
      (item.totalCredits - item.totalDebits).toFixed(2),
    ]);
  }
  rows.push(["Total Revenue", data.totalRevenue.toFixed(2)]);
  rows.push([]);
  rows.push(["Expenses", ""]);
  for (const item of data.expenses) {
    rows.push([
      item.accountName,
      (item.totalDebits - item.totalCredits).toFixed(2),
    ]);
  }
  rows.push(["Total Expenses", data.totalExpenses.toFixed(2)]);
  rows.push([]);
  rows.push(["Net Income", data.netIncome.toFixed(2)]);

  const csv = rows.map((row) => row.map(escapeCsvCell).join(",")).join("\n");
  downloadCsv(`Income_Statement_${period}.csv`, csv);
}

export async function exportIncomeStatementToPDF(
  data: IncomeStatementData,
  startDate: Date,
  endDate: Date,
) {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;

  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text("Income Statement", 14, 16);
  doc.setFontSize(10);
  doc.text(
    `Period: ${format(startDate, "PP")} - ${format(endDate, "PP")}`,
    14,
    24,
  );

  let startY = 30;

  doc.setFontSize(11);
  doc.text("Revenue", 14, startY);
  startY += 6;
  const revBody = data.revenue.map((item) => [
    item.accountName,
    (item.totalCredits - item.totalDebits).toFixed(2),
  ]);
  revBody.push(["Total Revenue", data.totalRevenue.toFixed(2)]);
  autoTable(doc, {
    startY,
    head: [["Account", "Amount"]],
    body: revBody,
    theme: "grid",
    headStyles: { fillColor: [66, 66, 66] },
    margin: { left: 14 },
  });
  startY = getTableFinalY(doc as DocWithAutoTable, startY) + 12;

  doc.setFontSize(11);
  doc.text("Expenses", 14, startY);
  startY += 6;
  const expBody = data.expenses.map((item) => [
    item.accountName,
    (item.totalDebits - item.totalCredits).toFixed(2),
  ]);
  expBody.push(["Total Expenses", data.totalExpenses.toFixed(2)]);
  autoTable(doc, {
    startY,
    head: [["Account", "Amount"]],
    body: expBody,
    theme: "grid",
    headStyles: { fillColor: [66, 66, 66] },
    margin: { left: 14 },
  });
  startY = getTableFinalY(doc as DocWithAutoTable, startY) + 12;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Net Income", 14, startY);
  doc.text(data.netIncome.toFixed(2), 190, startY, { align: "right" });
  doc.setFont("helvetica", "normal");

  const period = `${format(startDate, "yyyy-MM-dd")}_to_${format(endDate, "yyyy-MM-dd")}`;
  doc.save(`Income_Statement_${period}.pdf`);
}

// --- Balance Sheet ---

interface BalanceSheetItem {
  accountId: number;
  accountName: string;
  totalDebits: number;
  totalCredits: number;
}

interface BalanceSheetData {
  assets: BalanceSheetItem[];
  totalAssets: number;
  liabilities: BalanceSheetItem[];
  totalLiabilities: number;
  equity: BalanceSheetItem[];
  totalEquity: number;
  retainedEarnings: number;
}

export function exportBalanceSheetToCSV(
  data: BalanceSheetData,
  asOfDate: Date,
) {
  const dateStr = format(asOfDate, "yyyy-MM-dd");
  const rows: string[][] = [
    ["Balance Sheet", `As of ${format(asOfDate, "PP")}`],
    [],
    ["Assets", ""],
  ];
  for (const item of data.assets) {
    rows.push([
      item.accountName,
      (item.totalDebits - item.totalCredits).toFixed(2),
    ]);
  }
  rows.push(["Total Assets", data.totalAssets.toFixed(2)]);
  rows.push([]);
  rows.push(["Liabilities", ""]);
  for (const item of data.liabilities) {
    rows.push([
      item.accountName,
      (item.totalCredits - item.totalDebits).toFixed(2),
    ]);
  }
  rows.push(["Total Liabilities", data.totalLiabilities.toFixed(2)]);
  rows.push([]);
  rows.push(["Equity", ""]);
  for (const item of data.equity) {
    rows.push([
      item.accountName,
      (item.totalCredits - item.totalDebits).toFixed(2),
    ]);
  }
  rows.push(["Retained Earnings", data.retainedEarnings.toFixed(2)]);
  rows.push(["Total Equity", data.totalEquity.toFixed(2)]);
  rows.push([]);
  rows.push([
    "Total Liabilities & Equity",
    (data.totalLiabilities + data.totalEquity).toFixed(2),
  ]);

  const csv = rows.map((row) => row.map(escapeCsvCell).join(",")).join("\n");
  downloadCsv(`Balance_Sheet_${dateStr}.csv`, csv);
}

export async function exportBalanceSheetToPDF(
  data: BalanceSheetData,
  asOfDate: Date,
) {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;

  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text("Balance Sheet", 14, 16);
  doc.setFontSize(10);
  doc.text(`As of ${format(asOfDate, "PP")}`, 14, 24);

  let startY = 30;

  doc.setFontSize(11);
  doc.text("Assets", 14, startY);
  startY += 6;
  const assetsBody = data.assets.map((item) => [
    item.accountName,
    (item.totalDebits - item.totalCredits).toFixed(2),
  ]);
  assetsBody.push(["Total Assets", data.totalAssets.toFixed(2)]);
  autoTable(doc, {
    startY,
    head: [["Account", "Amount"]],
    body: assetsBody,
    theme: "grid",
    headStyles: { fillColor: [66, 66, 66] },
    margin: { left: 14 },
  });
  startY = getTableFinalY(doc as DocWithAutoTable, startY) + 12;

  doc.text("Liabilities", 14, startY);
  startY += 6;
  const liabBody = data.liabilities.map((item) => [
    item.accountName,
    (item.totalCredits - item.totalDebits).toFixed(2),
  ]);
  liabBody.push(["Total Liabilities", data.totalLiabilities.toFixed(2)]);
  autoTable(doc, {
    startY,
    head: [["Account", "Amount"]],
    body: liabBody,
    theme: "grid",
    headStyles: { fillColor: [66, 66, 66] },
    margin: { left: 14 },
  });
  startY = getTableFinalY(doc as DocWithAutoTable, startY) + 12;

  doc.text("Equity", 14, startY);
  startY += 6;
  const equityBody = data.equity.map((item) => [
    item.accountName,
    (item.totalCredits - item.totalDebits).toFixed(2),
  ]);
  equityBody.push(["Retained Earnings", data.retainedEarnings.toFixed(2)]);
  equityBody.push(["Total Equity", data.totalEquity.toFixed(2)]);
  autoTable(doc, {
    startY,
    head: [["Account", "Amount"]],
    body: equityBody,
    theme: "grid",
    headStyles: { fillColor: [66, 66, 66] },
    margin: { left: 14 },
  });
  startY = getTableFinalY(doc as DocWithAutoTable, startY) + 8;

  doc.setFont("helvetica", "bold");
  doc.text("Total Liabilities & Equity", 14, startY);
  doc.text((data.totalLiabilities + data.totalEquity).toFixed(2), 190, startY, {
    align: "right",
  });
  doc.setFont("helvetica", "normal");

  const dateStr = format(asOfDate, "yyyy-MM-dd");
  doc.save(`Balance_Sheet_${dateStr}.pdf`);
}
