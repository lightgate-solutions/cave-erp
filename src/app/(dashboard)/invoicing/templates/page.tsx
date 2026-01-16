import { TemplatePreview } from "@/components/invoicing/template-preview";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Invoice Templates | Cave ERP",
  description: "Preview invoice templates",
};

export default function TemplatesPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8">
      <TemplatePreview />
    </div>
  );
}
