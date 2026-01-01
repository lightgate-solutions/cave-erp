import { RequirePermission } from "@/components/auth/require-permission";

export default function NewsManageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RequirePermission route="/news/manage">{children}</RequirePermission>;
}
