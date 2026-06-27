import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text", placeholder: "jsmith" },
        email: {
          label: "Email",
          type: "text",
          placeholder: "example@gmail.com",
        },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        const email = credentials?.email;
        const username = credentials?.username;
        const password = credentials?.password;
        const user = {
          email: email,
          username: username,
          id: "1",
        };
        if (user) {
          return user;
        }
        return null;
      },
    }),
  ],
});
export { handler as GET, handler as POST };
