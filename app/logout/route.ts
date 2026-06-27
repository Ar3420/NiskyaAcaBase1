import { redirect } from "next/navigation";
import { logoutHelixMember } from "@/lib/auth";

export async function GET() {
  await logoutHelixMember();
  redirect("/login");
}
