import Link from "next/link";
import { Card } from "@/components/ui/card";
import { BookOpen } from "lucide-react";
import { tutorials } from "@/lib/tutorials-data";

export default function TutorialsPage() {
  return (
    <div className="container mx-auto px-4 py-12 md:px-6 md:py-16">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-4xl font-bold text-foreground">
              Step-by-Step Tutorials
            </h1>
          </div>
          <p className="text-lg text-foreground/80 leading-relaxed">
            Visual guides with screenshots showing exactly how to use each
            feature
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {tutorials.map((tutorial) => (
            <Link
              key={tutorial.id}
              href={`/documentation/tutorials/${tutorial.id}`}
            >
              <Card className="flex h-full flex-col p-6 transition-colors hover:border-primary hover:shadow-md">
                <h3 className="mb-3 text-lg font-semibold leading-tight text-foreground">
                  {tutorial.title}
                </h3>
                <p className="text-sm leading-relaxed text-foreground/70">
                  {tutorial.summary}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
