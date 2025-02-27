'use server';

import { z } from 'zod';

import { createUser, getUser } from '@/lib/db/queries';

import { signIn } from './auth';

const authFormSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export interface LoginActionState {
  status: 'idle' | 'in_progress' | 'success' | 'failed' | 'invalid_data';
}

export const login = async (
  _: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> => {
  try {
    const validatedData = authFormSchema.parse({
      email: formData.get('email'),
      password: formData.get('password'),
    });

    await signIn('credentials', {
      email: validatedData.email,
      password: validatedData.password,
      redirect: false,
    });

    return { status: 'success' };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { status: 'invalid_data' };
    }

    return { status: 'failed' };
  }
};

export interface RegisterActionState {
  status:
    | 'idle'
    | 'in_progress'
    | 'success'
    | 'failed'
    | 'user_exists'
    | 'invalid_data';
}

export const register = async (
  _: RegisterActionState,
  formData: FormData,
): Promise<RegisterActionState> => {
  try {
    const validatedData = authFormSchema.parse({
      email: formData.get("email"),
      password: formData.get("password"),
    });

    const [user] = await getUser(validatedData.email);

    if (user) {
      return { status: "user_exists" };
    }

    await createUser(validatedData.email, validatedData.password);

    // 🔍 Ensure new session is created immediately
    const signInResponse = await signIn("credentials", {
      email: validatedData.email,
      password: validatedData.password,
      redirect: false, // Prevent NextAuth's default redirection
    });

    if (!signInResponse || signInResponse.error) {
      console.error("❌ Sign-in failed after registration:", signInResponse?.error);
      return { status: "failed" };
    }

    // console.log("✅ Auto-login successful! Forcing session refresh...");

    // // 🔥 Force session refresh to ensure it's available immediately
    // const sessionRes = await fetch("/api/auth/session");
    // console.log("🔍 Session after login:", await sessionRes.json());

    return { status: "success" };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { status: "invalid_data" };
    }
    return { status: "failed" };
  }
}
