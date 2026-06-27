"use client";

import { signIn, signOut } from "next-auth/react";
import { useSession } from "next-auth/react";

export default function Home() {
  const session = useSession();
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      {session.status === "authenticated" && (
        <div>
          <h1>Signed In</h1>
          <p>Welcome back!</p>
          <button onClick={() => signOut()}> Logout</button>
        </div>
      )}

      {session.status === "unauthenticated" && (
        <div>
          <h1>Signed Out</h1>
          <p>Bye!</p>
          <button onClick={() => signIn(undefined, { callbackUrl: "/user" })}>
            {" "}
            SignIn
          </button>
        </div>
      )}
    </div>
  );
}
