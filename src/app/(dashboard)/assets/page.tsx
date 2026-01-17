import { redirect } from "next/navigation";
import { requireAssetAccess } from "@/actions/auth/dal";

export default async function AssetsPage() {
  await requireAssetAccess();
  redirect("/assets/dashboard");
}
