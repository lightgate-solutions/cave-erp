import { RequirePermission } from "@/components/auth/require-permission";
import FinanceLayoutClient from "./finance-layout-client";

export default function FinanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RequirePermission route="/finance">
      <FinanceLayoutClient>{children}</FinanceLayoutClient>
    </RequirePermission>
  );
}
