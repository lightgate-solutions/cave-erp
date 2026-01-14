import { redirect } from "next/navigation";

export default async function FleetPage() {
  redirect("/fleet/dashboard");
}
