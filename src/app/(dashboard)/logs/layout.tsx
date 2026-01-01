import { RequirePermission } from "@/components/auth/require-permission";

export default function DataExportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RequirePermission route="/logs">{children}</RequirePermission>;
}
