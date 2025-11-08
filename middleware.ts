import { withAuth } from "next-auth/middleware";

export default withAuth({
  callbacks: {
    authorized: ({ token }) => {
      return Boolean(token);
    },
  },
  pages: {
    signIn: "/",
  },
});

export const config = {
  matcher: [
    "/api/bookmarks/:path*",
  ],
};
