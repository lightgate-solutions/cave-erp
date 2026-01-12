import { requireHROrAdmin } from "@/actions/auth/dal";
import { redirect } from "next/navigation";

export default async function RecruitmentPage() {
  try {
    await requireHROrAdmin();
  } catch (error) {
    console.log(error);
    redirect("/");
  }
  redirect("/recruitment/jobs");
}
