import { RequirePermission } from "@/components/auth/require-permission";

export default function FleetLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RequirePermission route="/fleet">{children}</RequirePermission>;
}
