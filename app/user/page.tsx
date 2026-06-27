import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "../lib/auth";

export default async function User() {
  const session = await getServerSession();
  if (!session?.user) redirect("/");
  return <div>welcome {session?.user?.email}</div>;
}
