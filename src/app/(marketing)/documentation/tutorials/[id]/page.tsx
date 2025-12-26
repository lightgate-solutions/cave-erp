import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { tutorials } from "@/lib/tutorials-data";
import { notFound } from "next/navigation";

export default async function TutorialPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const tutorial = tutorials.find((t) => t.id === resolvedParams.id);

  if (!tutorial) {
    notFound();
  }

  const currentIndex = tutorials.findIndex((t) => t.id === tutorial.id);
  const prevTutorial = currentIndex > 0 ? tutorials[currentIndex - 1] : null;
  const nextTutorial =
    currentIndex < tutorials.length - 1 ? tutorials[currentIndex + 1] : null;

  return (
    <div className="container mx-auto px-4 py-12 md:px-6 md:py-16">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-4 text-4xl font-bold text-foreground">
            {tutorial.title}
          </h1>
          <p className="text-lg text-foreground/80 leading-relaxed">
            {tutorial.summary}
          </p>
        </div>

        {/* Steps */}
        {tutorial.steps && (
          <Card className="mb-8 rounded-lg bg-muted/50 p-6">
            <h2 className="mb-4 text-xl font-semibold text-foreground">
              Step-by-Step Guide
            </h2>
            <ol className="space-y-4 text-sm leading-relaxed text-foreground/80">
              {tutorial.steps
                .split("\n")
                .filter((step) => step.trim())
                .map((step, idx) => {
                  const stepNumber = step.match(/^\d+\./)?.[0] || `${idx + 1}.`;
                  const stepText = step.replace(/^\d+\.\s*/, "");
                  return (
                    <li key={idx} className="flex gap-4">
                      <span className="mt-0.5 shrink-0 font-semibold text-primary">
                        {stepNumber}
                      </span>
                      <span className="flex-1">{stepText}</span>
                    </li>
                  );
                })}
            </ol>
          </Card>
        )}

        {/* Images */}
        {tutorial.images && tutorial.images.length > 0 && (
          <div className="mb-8 space-y-6">
            {tutorial.images.map((img, idx) => (
              <div
                key={img.src}
                className="overflow-hidden rounded-lg border bg-card"
              >
                <Image
                  src={img.src}
                  alt={img.alt}
                  width={1200}
                  height={800}
                  className="h-auto w-full"
                />
                {tutorial.images && tutorial.images.length > 1 && (
                  <div className="border-t bg-muted/50 px-4 py-3">
                    <p className="text-xs font-medium text-foreground">
                      {idx + 1} of {tutorial.images.length}
                    </p>
                    <p className="text-xs text-muted-foreground">{img.alt}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {tutorial.image && (
          <div className="mb-8 overflow-hidden rounded-lg border bg-card">
            <Image
              src={tutorial.image}
              alt={tutorial.title}
              width={1200}
              height={800}
              className="h-auto w-full"
            />
          </div>
        )}

        {/* Navigation */}
        <div className="flex flex-col gap-4 border-t border-border pt-8 sm:flex-row sm:justify-between">
          {prevTutorial ? (
            <Button variant="outline" asChild className="w-full sm:w-auto">
              <Link href={`/documentation/tutorials/${prevTutorial.id}`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Previous: {prevTutorial.title}
              </Link>
            </Button>
          ) : (
            <div />
          )}
          {nextTutorial && (
            <Button variant="outline" asChild className="w-full sm:w-auto">
              <Link href={`/documentation/tutorials/${nextTutorial.id}`}>
                Next: {nextTutorial.title}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
