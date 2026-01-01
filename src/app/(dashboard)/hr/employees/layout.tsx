import { RequirePermission } from "@/components/auth/require-permission";

export default function HREmployeesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RequirePermission route="/hr/employees">{children}</RequirePermission>
  );
}
