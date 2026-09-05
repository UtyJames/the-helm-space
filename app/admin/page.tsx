import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminSignInForm from "./sign-in-form";

export const metadata = { title: "Admin Sign In — The Helm Space" };

export default async function AdminPage() {
  const session = await auth();
  if (session?.user) redirect("/admin/dashboard");
  return <AdminSignInForm />;
}
