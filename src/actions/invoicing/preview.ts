"use server";

import { generateInvoicePdf } from "@/lib/pdf/invoice-pdf";

export async function generateTemplatePreview(template: string) {
  try {
    const mockInvoice = {
      invoiceNumber: "PREVIEW-001",
      status: "Draft",
      invoiceDate: new Date().toLocaleDateString(),
      dueDate: new Date(Date.now() + 14 * 86400000).toLocaleDateString(),
      client: {
        name: "John Doe",
        companyName: "Acme Corp",
        email: "john@acme.com",
        billingAddress: "123 Business St\nInnovation City, Tech State 90210",
      },
      lineItems: [
        {
          description: "Professional Services - Senior Consultant",
          quantity: 10,
          unitPrice: 150.0,
          amount: 1500.0,
        },
        {
          description: "Software License - Annual",
          quantity: 1,
          unitPrice: 499.0,
          amount: 499.0,
        },
      ],
      subtotal: "1999.00",
      taxAmount: "199.90",
      total: "2198.90",
      amountDue: "2198.90",
      amountPaid: "0.00",
      taxes: [
        {
          taxName: "VAT",
          taxPercentage: "10.00",
          taxAmount: "199.90",
        },
      ],
      notes: "This is a sample note to demonstrate the invoice layout.",
      termsAndConditions:
        "Payment is due within 14 days. Please include the invoice number in your payment reference.",
      footerNote: "Thank you for your business!",
      template: template,
    };

    const mockOrg = {
      name: "Demo Organization",
      logo: null, // Skip logo for preview
    };

    const mockBank = {
      bankName: "Global Bank",
      accountName: "Demo Org Business",
      accountNumber: "1234567890",
      swiftCode: "GBUNKUS33",
      routingNumber: "021000021",
    };

    const pdfArrayBuffer = await generateInvoicePdf(
      mockInvoice,
      mockOrg,
      mockBank,
      "$",
    );

    // Convert ArrayBuffer to Base64
    const buffer = Buffer.from(pdfArrayBuffer);
    const base64 = buffer.toString("base64");

    return `data:application/pdf;base64,${base64}`;
  } catch (error) {
    console.error("Error generating preview:", error);
    return null;
  }
}
