import type {
  IncomeStatementReport,
  TrialBalanceItem,
} from "@/actions/finance/gl/reports";
import { format } from "date-fns";

/** Classic trial balance: one amount per row — net debit (Dr − Cr) or net credit. */
export function classicTrialBalanceDebitCredit(item: TrialBalanceItem): {
  debit: number;
  credit: number;
} {
  const d = item.closingDebits ?? item.totalDebits;
  const c = item.closingCredits ?? item.totalCredits;
  const net = d - c;
  if (net > 1e-6) return { debit: net, credit: 0 };
  if (net < -1e-6) return { debit: 0, credit: -net };
  return { debit: 0, credit: 0 };
}

export function formatTrialBalanceFigure(n: number): string {
  if (n === 0) return "";
  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(n);
}

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
  const header = ["Account", "Debit", "Credit"];
  const rows: string[][] = [
    [
      "Trial Balance",
      `Period: ${format(startDate, "PP")} - ${format(endDate, "PP")}`,
    ],
    [],
    header,
  ];
  let sumDr = 0;
  let sumCr = 0;
  for (const item of data) {
    const { debit, credit } = classicTrialBalanceDebitCredit(item);
    sumDr += debit;
    sumCr += credit;
  }
  for (const item of data) {
    const { debit, credit } = classicTrialBalanceDebitCredit(item);
    if (debit <= 1e-6 && credit <= 1e-6) continue;
    rows.push([
      `${item.accountCode} - ${item.accountName}`,
      debit > 0 ? formatTrialBalanceFigure(debit) : "",
      credit > 0 ? formatTrialBalanceFigure(credit) : "",
    ]);
  }
  rows.push([
    "TOTAL",
    formatTrialBalanceFigure(sumDr),
    formatTrialBalanceFigure(sumCr),
  ]);

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

  const doc = new jsPDF({ orientation: "portrait" });
  doc.setFontSize(16);
  doc.text("Trial Balance", 14, 16);
  doc.setFontSize(10);
  doc.text(
    `Period: ${format(startDate, "PP")} - ${format(endDate, "PP")}`,
    14,
    24,
  );

  let sumDr = 0;
  let sumCr = 0;
  for (const item of data) {
    const { debit, credit } = classicTrialBalanceDebitCredit(item);
    sumDr += debit;
    sumCr += credit;
  }
  const head = [["Account", "Debit", "Credit"]];
  const body: string[][] = data
    .filter((item) => {
      const { debit, credit } = classicTrialBalanceDebitCredit(item);
      return debit > 1e-6 || credit > 1e-6;
    })
    .map((item) => {
      const { debit, credit } = classicTrialBalanceDebitCredit(item);
      return [
        `${item.accountCode} - ${item.accountName}`,
        debit > 0 ? formatTrialBalanceFigure(debit) : "",
        credit > 0 ? formatTrialBalanceFigure(credit) : "",
      ];
    });
  body.push([
    "TOTAL",
    formatTrialBalanceFigure(sumDr),
    formatTrialBalanceFigure(sumCr),
  ]);

  autoTable(doc, {
    startY: 30,
    head,
    body,
    foot: [head[0].map(() => "")],
    theme: "grid",
    headStyles: { fillColor: [66, 66, 66] },
    margin: { left: 14 },
    styles: { fontSize: 10 },
  });

  const period = `${format(startDate, "yyyy-MM-dd")}_to_${format(endDate, "yyyy-MM-dd")}`;
  doc.save(`Trial_Balance_${period}.pdf`);
}

// --- Income Statement ---

function plRevenueAmount(item: { totalCredits: number; totalDebits: number }) {
  return item.totalCredits - item.totalDebits;
}

function plExpenseAmount(item: { totalDebits: number; totalCredits: number }) {
  return item.totalDebits - item.totalCredits;
}

export function formatIncomeStatementExpenseParens(amount: number): string {
  const a = Math.abs(amount);
  if (a < 1e-9) return "(0)";
  return `(${formatTrialBalanceFigure(a)})`;
}

/** Legacy name — some bundles still reference `formatIsParens` after the rename. */
export const formatIsParens = formatIncomeStatementExpenseParens;

export function formatIncomeStatementRevenue(n: number): string {
  return formatTrialBalanceFigure(Math.max(0, n));
}

export function formatIncomeStatementProfit(n: number): string {
  return formatTrialBalanceFigure(n);
}

export function exportIncomeStatementToCSV(
  data: IncomeStatementReport,
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
      formatIncomeStatementRevenue(plRevenueAmount(item)),
    ]);
  }
  if (data.revenue.length > 1) {
    rows.push([
      "Total Revenue",
      formatIncomeStatementRevenue(data.totalRevenue),
    ]);
  }
  if (data.costOfGoodsSold.length > 0) {
    rows.push([]);
    rows.push(["Cost of Goods Sold", ""]);
    for (const item of data.costOfGoodsSold) {
      rows.push([
        item.accountName,
        formatIncomeStatementExpenseParens(plExpenseAmount(item)),
      ]);
    }
  }
  rows.push([]);
  rows.push(["Gross Profit", formatIncomeStatementProfit(data.grossProfit)]);
  rows.push([]);
  rows.push(["Operating Expenses", ""]);
  for (const item of data.operatingExpenses) {
    rows.push([
      item.accountName,
      formatIncomeStatementExpenseParens(plExpenseAmount(item)),
    ]);
  }
  rows.push([]);
  rows.push(["Net Profit", formatIncomeStatementProfit(data.netIncome)]);

  const csv = rows.map((row) => row.map(escapeCsvCell).join(",")).join("\n");
  downloadCsv(`Income_Statement_${period}.csv`, csv);
}

export async function exportIncomeStatementToPDF(
  data: IncomeStatementReport,
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

  const revBody: string[][] = data.revenue.map((item) => [
    item.accountName,
    formatIncomeStatementRevenue(plRevenueAmount(item)),
  ]);
  if (data.revenue.length > 1) {
    revBody.push([
      "Total Revenue",
      formatIncomeStatementRevenue(data.totalRevenue),
    ]);
  }

  doc.setFontSize(11);
  doc.text("Revenue", 14, startY);
  startY += 6;
  autoTable(doc, {
    startY,
    head: [["Account", "Amount"]],
    body: revBody,
    theme: "grid",
    headStyles: { fillColor: [66, 66, 66] },
    margin: { left: 14 },
  });
  startY = getTableFinalY(doc as DocWithAutoTable, startY) + 10;

  if (data.costOfGoodsSold.length > 0) {
    doc.setFontSize(11);
    doc.text("Cost of Goods Sold", 14, startY);
    startY += 6;
    const cogsBody = data.costOfGoodsSold.map((item) => [
      item.accountName,
      formatIncomeStatementExpenseParens(plExpenseAmount(item)),
    ]);
    autoTable(doc, {
      startY,
      head: [["Account", "Amount"]],
      body: cogsBody,
      theme: "grid",
      headStyles: { fillColor: [66, 66, 66] },
      margin: { left: 14 },
    });
    startY = getTableFinalY(doc as DocWithAutoTable, startY) + 10;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Gross Profit", 14, startY);
  doc.text(formatIncomeStatementProfit(data.grossProfit), 190, startY, {
    align: "right",
  });
  doc.setFont("helvetica", "normal");
  startY += 12;

  doc.setFontSize(11);
  doc.text("Operating Expenses", 14, startY);
  startY += 6;
  const opBody = data.operatingExpenses.map((item) => [
    item.accountName,
    formatIncomeStatementExpenseParens(plExpenseAmount(item)),
  ]);
  autoTable(doc, {
    startY,
    head: [["Account", "Amount"]],
    body: opBody.length > 0 ? opBody : [["—", "(0)"]],
    theme: "grid",
    headStyles: { fillColor: [66, 66, 66] },
    margin: { left: 14 },
  });
  startY = getTableFinalY(doc as DocWithAutoTable, startY) + 12;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Net Profit", 14, startY);
  doc.text(formatIncomeStatementProfit(data.netIncome), 190, startY, {
    align: "right",
  });
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
