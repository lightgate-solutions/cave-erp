import { RequirePermission } from "@/components/auth/require-permission";

export default function PayrollLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RequirePermission route="/payroll">{children}</RequirePermission>;
}
