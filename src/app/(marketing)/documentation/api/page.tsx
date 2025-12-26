import { Card } from "@/components/ui/card";
import { Code } from "lucide-react";

export default function APIPage() {
  return (
    <div className="container mx-auto px-4 py-12 md:px-6 md:py-16">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Code className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-4xl font-bold text-foreground">
              API Reference
            </h1>
          </div>
          <p className="text-lg text-foreground/80 leading-relaxed">
            Complete API documentation and integration guides
          </p>
        </div>

        <Card className="p-8">
          <h2 className="mb-4 text-2xl font-semibold text-foreground">
            API Documentation Coming Soon
          </h2>
          <p className="mb-4 text-foreground/80 leading-relaxed">
            Comprehensive API documentation is currently under development. The
            API reference will include:
          </p>
          <ul className="list-disc list-inside space-y-2 text-foreground/80">
            <li>Authentication endpoints</li>
            <li>RESTful API endpoints for all modules</li>
            <li>Request and response examples</li>
            <li>Error handling guidelines</li>
            <li>Rate limiting information</li>
            <li>SDKs and code samples</li>
          </ul>
          <p className="mt-6 text-sm text-foreground/70">
            For API access inquiries, please contact our support team at{" "}
            <a
              href="mailto:contact@lightgatesolutions.com"
              className="text-primary hover:underline"
            >
              contact@lightgatesolutions.com
            </a>
          </p>
        </Card>
      </div>
    </div>
  );
}
