/** biome-ignore-all lint/suspicious/noExplicitAny: <> */

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

// Helper to fetch image
async function fetchImageAsBase64(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    const mimeType = response.headers.get("content-type") || "image/png";
    return `data:${mimeType};base64,${base64}`;
  } catch (error) {
    console.error("Error fetching logo:", error);
    return null;
  }
}

export async function generateInvoicePdf(
  invoice: any,
  organization: any,
  bankAccount: any,
  currencySymbol: string = "$",
) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  const template = invoice.template || "Modern";

  // Template Config
  let _headerColor = [0, 0, 0]; // Black
  let primaryColor = [59, 130, 246]; // Blue-500
  let font = "helvetica";

  if (template === "Classic") {
    _headerColor = [60, 60, 60];
    primaryColor = [60, 60, 60];
    font = "times";
  } else if (template === "Minimal") {
    _headerColor = [0, 0, 0];
    primaryColor = [0, 0, 0];
    font = "courier";
  } else if (template === "Professional") {
    _headerColor = [15, 23, 42]; // Slate-900
    primaryColor = [15, 23, 42];
    font = "helvetica";
  }

  doc.setFont(font);

  // --- Header ---
  let yPos = 20;

  // Logo
  if (organization.logo) {
    const logoData = await fetchImageAsBase64(organization.logo);
    if (logoData) {
      try {
        // Keep aspect ratio, max width 40, max height 20
        const props = doc.getImageProperties(logoData);
        const ratio = props.width / props.height;
        let w = 40;
        let h = w / ratio;
        if (h > 20) {
          h = 20;
          w = h * ratio;
        }
        doc.addImage(logoData, "PNG", margin, yPos - 10, w, h);
      } catch (e) {
        console.error("Error adding logo to PDF", e);
      }
    }
  }

  // Organization Details (Right aligned)
  doc.setFontSize(10);
  doc.setTextColor(100);
  const orgX = pageWidth - margin;
  doc.text(organization.name, orgX, yPos, { align: "right" });

  yPos += 30;

  // --- Title & Invoice Info ---
  doc.setFontSize(24);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(template === "Minimal" ? "INVOICE" : "INVOICE", margin, yPos);

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`#${invoice.invoiceNumber}`, margin, yPos + 8);

  // Status Badge-like text
  doc.setFillColor(240, 240, 240);
  if (invoice.status === "Paid") doc.setFillColor(220, 255, 220); // Light Green
  if (invoice.status === "Overdue") doc.setFillColor(255, 220, 220); // Light Red

  // Minimal template doesn't use badges
  if (template !== "Minimal") {
    doc.rect(pageWidth - margin - 30, yPos - 8, 30, 10, "F");
  }

  doc.setFontSize(10);
  doc.setTextColor(50);
  doc.text(invoice.status.toUpperCase(), pageWidth - margin - 15, yPos - 1, {
    align: "center",
  });

  yPos += 25;

  // --- Bill To & Dates ---
  const col2X = pageWidth / 2 + 10;

  // Bill To
  doc.setFontSize(10);
  doc.setTextColor(150);
  doc.text("Bill To:", margin, yPos);

  doc.setTextColor(0);
  doc.setFontSize(11);
  doc.text(invoice.client.name, margin, yPos + 6);
  if (invoice.client.companyName) {
    doc.text(invoice.client.companyName, margin, yPos + 11);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(invoice.client.email, margin, yPos + 16);
  } else {
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(invoice.client.email, margin, yPos + 11);
  }

  if (invoice.client.billingAddress) {
    // Simple address wrap
    const addressLines = doc.splitTextToSize(invoice.client.billingAddress, 80);
    doc.text(addressLines, margin, yPos + 22);
  }

  // Dates & Payment Info
  doc.setFontSize(10);
  doc.setTextColor(150);
  doc.text("Invoice Date:", col2X, yPos);
  doc.setTextColor(0);
  doc.text(invoice.invoiceDate, pageWidth - margin, yPos, { align: "right" });

  doc.setTextColor(150);
  doc.text("Due Date:", col2X, yPos + 6);
  doc.setTextColor(0);
  doc.text(invoice.dueDate, pageWidth - margin, yPos + 6, { align: "right" });

  yPos += 40;

  // --- Line Items ---
  const tableData = invoice.lineItems.map((item: any) => [
    item.description,
    item.quantity,
    `${currencySymbol}${Number(item.unitPrice).toFixed(2)}`,
    `${currencySymbol}${Number(item.amount).toFixed(2)}`,
  ]);

  let headStyles: any = { fillColor: primaryColor, textColor: 255 };
  if (template === "Minimal") {
    headStyles = {
      fillColor: 255,
      textColor: 0,
      fontStyle: "bold",
      lineWidth: 0,
      border: "bottom",
    };
  } else if (template === "Classic") {
    headStyles = { fillColor: 240, textColor: 0, fontStyle: "bold" };
  }

  autoTable(doc, {
    startY: yPos,
    head: [["Description", "Qty", "Unit Price", "Amount"]],
    body: tableData,
    theme: template === "Minimal" ? "plain" : "grid",
    headStyles: headStyles,
    columnStyles: {
      0: { cellWidth: "auto" },
      1: { cellWidth: 20, halign: "center" },
      2: { cellWidth: 30, halign: "right" },
      3: { cellWidth: 30, halign: "right" },
    },
    styles: { fontSize: 9, cellPadding: 3, font: font },
  });

  // @ts-ignore
  let finalY = doc.lastAutoTable.finalY + 10;

  // --- Totals ---
  const totalsX = pageWidth - margin - 70;
  const valX = pageWidth - margin;

  doc.setFontSize(10);
  doc.setTextColor(100);

  doc.text("Subtotal:", totalsX, finalY);
  doc.text(
    `${currencySymbol}${Number(invoice.subtotal).toFixed(2)}`,
    valX,
    finalY,
    { align: "right" },
  );

  finalY += 6;

  // Taxes
  if (invoice.taxes && invoice.taxes.length > 0) {
    for (const tax of invoice.taxes) {
      doc.text(
        `${tax.taxName} (${Number(tax.taxPercentage)}%):`,
        totalsX,
        finalY,
      );
      doc.text(
        `${currencySymbol}${Number(tax.taxAmount).toFixed(2)}`,
        valX,
        finalY,
        { align: "right" },
      );
      finalY += 6;
    }
  } else if (Number(invoice.taxAmount) > 0) {
    // Fallback for legacy or aggregated taxAmount without details
    doc.text("Tax:", totalsX, finalY);
    doc.text(
      `${currencySymbol}${Number(invoice.taxAmount).toFixed(2)}`,
      valX,
      finalY,
      { align: "right" },
    );
    finalY += 6;
  }

  doc.setFontSize(12);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont(font, "bold"); // Bold
  doc.text("Total:", totalsX, finalY + 2);
  doc.text(
    `${currencySymbol}${Number(invoice.total).toFixed(2)}`,
    valX,
    finalY + 2,
    { align: "right" },
  );
  doc.setFont(font, "normal"); // Reset font

  finalY += 20;

  // --- Bank Details ---
  if (bankAccount) {
    doc.setFontSize(11);
    doc.setTextColor(0);
    doc.text("Payment Details", margin, finalY);

    doc.setFontSize(9);
    doc.setTextColor(100);
    finalY += 6;
    doc.text(`Bank: ${bankAccount.bankName}`, margin, finalY);
    finalY += 5;
    doc.text(`Account Name: ${bankAccount.accountName}`, margin, finalY);
    finalY += 5;
    doc.text(`Account Number: ${bankAccount.accountNumber}`, margin, finalY);

    if (bankAccount.swiftCode) {
      finalY += 5;
      doc.text(`SWIFT/BIC: ${bankAccount.swiftCode}`, margin, finalY);
    }
    if (bankAccount.routingNumber) {
      finalY += 5;
      doc.text(`Routing: ${bankAccount.routingNumber}`, margin, finalY);
    }
  }

  // --- Notes ---
  if (invoice.notes) {
    finalY += 15;
    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.text("Notes", margin, finalY);
    doc.setFontSize(9);
    doc.setTextColor(100);
    const notes = doc.splitTextToSize(invoice.notes, pageWidth - margin * 2);
    doc.text(notes, margin, finalY + 5);
    finalY += 5 + notes.length * 4; // approximate height adjustment
  }

  // --- Terms and Conditions ---
  if (invoice.termsAndConditions) {
    finalY += 10;
    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.text("Terms and Conditions", margin, finalY);
    doc.setFontSize(9);
    doc.setTextColor(100);
    const terms = doc.splitTextToSize(
      invoice.termsAndConditions,
      pageWidth - margin * 2,
    );
    doc.text(terms, margin, finalY + 5);
    finalY += 5 + terms.length * 4;
  }

  // --- Footer Note ---
  if (invoice.footerNote) {
    const footerY = doc.internal.pageSize.getHeight() - 20;
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(invoice.footerNote, pageWidth / 2, footerY, { align: "center" });
  }

  return doc.output("arraybuffer");
}
