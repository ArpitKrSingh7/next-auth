"use client";
import { useEffect } from "react";
import useGetSession from "../lib/getSession";
import { useRouter } from "next/navigation";

export default function User() {
  const { status, data } = useGetSession();
  const router = useRouter();
  useEffect(() => {
    if (status === "unauthenticated") router.replace("/");
  }, [router, status]);
  if (status === "loading") return <div>Loading ...</div>;
  return <div>welcome {data?.user?.email}</div>;
}
