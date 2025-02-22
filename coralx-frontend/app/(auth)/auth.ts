import { compare } from 'bcrypt-ts';
import NextAuth, { type User, type Session } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

import { authConfig } from './auth.config';

interface ExtendedSession extends Session {
  user: User;
}

interface UserResponse {
  id: string;
  email: string;
  // Add any additional fields that your Flask API returns
}

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text', placeholder: 'Email address' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, request) {
        if (!credentials) return null;
        // Cast credentials to the expected type
        const { email, password } = credentials as { email: string; password: string };

        try {
          // Call the backend API using fetch
          const response = await fetch('http://localhost:8080/user', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
          });

          if (response.ok) {
            const data: UserResponse = await response.json();
            return data; // Return the user data on successful authentication
          } else {
            console.error('Authentication failed:', response.statusText);
            return null;
          }
        } catch (error) {
          console.error('Error authenticating user:', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }: { session: ExtendedSession; token: any }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});