"use client";

import { useEffect, useState } from "react";
import { generateTemplatePreview } from "@/actions/invoicing/preview";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";

const TEMPLATES = ["Modern", "Classic", "Minimal", "Detailed", "Professional"];

export function TemplatePreview() {
  const [selectedTemplate, setSelectedTemplate] = useState("Modern");
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;

    const loadPreview = async () => {
      setLoading(true);
      try {
        const url = await generateTemplatePreview(selectedTemplate);
        if (active) setPdfUrl(url);
      } catch (e) {
        console.error(e);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadPreview();

    return () => {
      active = false;
    };
  }, [selectedTemplate]);

  return (
    <div className="w-full h-full flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold tracking-tight">Invoice Templates</h2>
        <p className="text-muted-foreground">
          Preview how your invoices will look with different style templates.
        </p>
      </div>

      <Tabs
        defaultValue="Modern"
        value={selectedTemplate}
        onValueChange={setSelectedTemplate}
        className="w-full flex-1 flex flex-col"
      >
        <TabsList className="w-full justify-start overflow-x-auto">
          {TEMPLATES.map((t) => (
            <TabsTrigger key={t} value={t}>
              {t}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="flex-1 mt-4 min-h-[600px] border rounded-md bg-muted/20 relative overflow-hidden">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10 backdrop-blur-sm">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {pdfUrl ? (
            <iframe
              src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0`}
              className="w-full h-full min-h-[800px] border-0"
              title="Invoice Preview"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              {loading ? "Generating preview..." : "Failed to load preview"}
            </div>
          )}
        </div>
      </Tabs>
    </div>
  );
}
