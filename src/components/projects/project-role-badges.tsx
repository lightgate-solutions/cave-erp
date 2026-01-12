import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ProjectRoleBadgesProps {
  roles: string[];
  className?: string;
}

export function ProjectRoleBadges({
  roles,
  className,
}: ProjectRoleBadgesProps) {
  if (!roles || roles.length === 0) {
    return null;
  }

  const roleConfig: Record<
    string,
    { label: string; className: string; order: number }
  > = {
    admin: {
      label: "Admin",
      className:
        "bg-red-500/10 text-red-700 border-red-500/20 hover:bg-red-500/20 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/30",
      order: 1,
    },
    creator: {
      label: "Creator",
      className:
        "bg-blue-500/10 text-blue-700 border-blue-500/20 hover:bg-blue-500/20 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30",
      order: 2,
    },
    supervisor: {
      label: "Supervisor",
      className:
        "bg-purple-500/10 text-purple-700 border-purple-500/20 hover:bg-purple-500/20 dark:bg-purple-500/20 dark:text-purple-400 dark:border-purple-500/30",
      order: 3,
    },
    team_member: {
      label: "Team Member",
      className:
        "bg-gray-500/10 text-gray-700 border-gray-500/20 hover:bg-gray-500/20 dark:bg-gray-500/20 dark:text-gray-400 dark:border-gray-500/30",
      order: 4,
    },
  };

  // Sort roles by order
  const sortedRoles = roles.sort((a, b) => {
    const orderA = roleConfig[a]?.order ?? 999;
    const orderB = roleConfig[b]?.order ?? 999;
    return orderA - orderB;
  });

  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {sortedRoles.map((role) => {
        const config = roleConfig[role];
        if (!config) return null;

        return (
          <Badge
            key={role}
            variant="outline"
            className={cn("text-xs font-medium", config.className)}
          >
            {config.label}
          </Badge>
        );
      })}
    </div>
  );
}
