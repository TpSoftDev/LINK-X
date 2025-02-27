import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  pages: {
    signIn: '/login',
    newUser: '/',
  },
  providers: [
    // added later in auth.ts since it requires bcrypt which is only compatible with Node.js
    // while this file is also used in non-Node.js environments
  ],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnChat = nextUrl.pathname.startsWith('/chat');
      const isOnRegister = nextUrl.pathname.startsWith('/register');
      const isOnDashboard = nextUrl.pathname.startsWith('/dashboard');
      const isOnLogin = nextUrl.pathname.startsWith('/login');
      const isOnLanding = nextUrl.pathname === '/';

      // If user is not logged in and tries to access /, allow access to the landing page
      if (!isLoggedIn && isOnLanding) return true;

      // If user is logged in and tries to access /, /login, redirect to /chat (in the future, this will be changesd to the user dashboard page)
      if (isLoggedIn && (isOnLanding || isOnLogin)) {
        return Response.redirect(new URL('/dashboard', nextUrl));
      }

      //once the user is registered, they are taken to the onboarding
      if(isLoggedIn && isOnRegister) {
        return Response.redirect(new URL('/onboarding', nextUrl));
      }

      // Always allow access to register and login pages
      if (isOnRegister || isOnLogin) return true; 

      // If on /chat, only allow access if logged in, else redirect to login
      if (isOnChat && !isLoggedIn) {
        return Response.redirect(new URL('/login', nextUrl));
      }

      // For any other unauthorized access, redirect to /login
      // if (!isLoggedIn) {
      //   return Response.redirect(new URL('/login', nextUrl));
      // }

      return true;
    },
  },
} satisfies NextAuthConfig;
