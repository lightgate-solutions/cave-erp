import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Hash, MapPin, User, Wallet, TrendingUp } from "lucide-react";

type Project = {
  id: number;
  name: string;
  code: string;
  description: string | null;
  location: string | null;
  status: string;
  budgetPlanned: number;
  budgetActual: number;
  supervisorId: number | null;
  supervisorName: string | null;
  supervisorEmail: string | null;
  createdAt: string;
  updatedAt: string;
};

export function ProjectHeader({
  project,
  progress,
  spent: _spent,
  remaining,
}: {
  project: Project;
  progress: number;
  spent: number;
  remaining: number;
}) {
  return (
    <Card className="overflow-hidden border-none shadow-md">
      <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-600 relative">
        <div className="absolute bottom-4 left-6 text-white">
          <h1 className="text-3xl font-bold">{project.name}</h1>
          <div className="flex items-center gap-2 text-blue-100 text-sm mt-1">
            <Hash className="h-3 w-3" />
            <span>{project.code}</span>
            <span className="mx-1">•</span>
            <Badge
              variant="secondary"
              className="bg-white/20 hover:bg-white/30 text-white border-none"
            >
              {project.status}
            </Badge>
          </div>
        </div>
      </div>
      <CardContent className="pt-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <MapPin className="h-4 w-4" />
              Location
            </div>
            <div className="font-medium">{project.location ?? "—"}</div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <User className="h-4 w-4" />
              Supervisor
            </div>
            <div
              className="font-medium truncate"
              title={project.supervisorName ?? ""}
            >
              {project.supervisorName ?? "—"}
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Wallet className="h-4 w-4" />
              Budget
            </div>
            <div className="font-medium">
              ₦{(project.budgetPlanned ?? 0).toLocaleString()}
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <TrendingUp className="h-4 w-4" />
              Remaining
            </div>
            <div
              className={`font-medium ${remaining < 0 ? "text-red-500" : "text-green-600"}`}
            >
              ₦{(remaining ?? 0).toLocaleString()}
            </div>
          </div>
        </div>

        <div className="mt-8">
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium">Project Progress</span>
            <span className="text-muted-foreground">{progress}%</span>
          </div>
          <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
