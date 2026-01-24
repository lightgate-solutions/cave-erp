import { getPayrunById } from "@/actions/payroll/payrun";
import { PayrunDetail } from "@/components/payroll/payrun-detail";

interface PayrunDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function PayrunDetailPage({
  params,
}: PayrunDetailPageProps) {
  const { id } = await params;
  const payrun = await getPayrunById(Number(id));

  if (!payrun) {
    return null;
  }

  return <PayrunDetail payrun={payrun} />;
}
