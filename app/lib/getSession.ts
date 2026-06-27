import { useSession } from "next-auth/react";

export default function useGetSession() {
  return useSession();
}
