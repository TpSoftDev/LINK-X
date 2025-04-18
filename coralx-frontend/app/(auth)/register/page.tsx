"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AuthForm } from "@/components/auth-form";
import { SubmitButton } from "@/components/submit-button";
import Header from "@/components/link-x/Header";

import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/firebaseconfig";

export default function Page() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [isSuccessful, setIsSuccessful] = useState(false);
  const [state, setState] = useState<
    "idle" | "in_progress" | "success" | "failed" | "user_exists" | "invalid_data"
  >("idle");

  useEffect(() => {
    if (state === "user_exists") {
      toast.error("Account already exists");
    } else if (state === "failed") {
      toast.error("Failed to create account");
    } else if (state === "invalid_data") {
      toast.error("Failed validating your submission!");
    } else if (state === "success") {
      toast.success("Account created successfully");
      setIsSuccessful(true);
      router.push("/onboarding");
    }
  }, [state, router]);

  const handleSubmit = async (formData: FormData) => {
    setEmail(formData.get("email") as string);
    setState("in_progress");
  
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.get("email") as string,
        formData.get("password") as string
      );
  
      const token = await userCredential.user.getIdToken();
      localStorage.setItem("token", token);
  
      const postgresResponse = await fetch("http://localhost:8080/createUser", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.get("email"),
          password: formData.get("password"),
          idToken: token,
        })
      });
  
      if (!postgresResponse.ok) {
        const errorData = await postgresResponse.json();
        console.error("Postgres user creation error:", errorData.error);
        setState("failed");
        toast.error("Failed to create Postgres user record");
        return;
      }
      const loginResponse = await fetch("http://localhost:8080/sessionLogin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ idToken: token })
      });
      
      if (!loginResponse.ok) {
        const errorData = await loginResponse.json();
        console.error("Session login error:", errorData.error);
        setState("failed");
        toast.error("Failed to set session cookie.");
        return;
      }
  
      setState("success");
      router.push("/onboarding");
    } catch (error: any) {
      console.error("Registration Error:", error.message);
      if (error.code === "auth/email-already-in-use") {
        setState("user_exists");
        toast.error("Email is already registered!");
      } else if (error.code === "auth/weak-password") {
        setState("invalid_data");
        toast.error("Password is too weak!");
      } else {
        setState("failed");
        toast.error("Failed to create account.");
      }
    }
  };

  return (
    <div className="flex h-dvh w-screen items-start pt-12 md:pt-0 md:items-center justify-center bg-background">
      <Header isLoggedIn={false} showAuthButton={false} />
      <div className="w-full max-w-md overflow-hidden rounded-2xl gap-12 flex flex-col">
        <div className="flex flex-col items-center justify-center gap-2 px-4 text-center sm:px-16">
          <h3 className="text-xl font-semibold dark:text-zinc-50">Sign Up</h3>
          <p className="text-sm text-gray-500 dark:text-zinc-400">
            Create an account with your email and password
          </p>
        </div>
        <AuthForm action={handleSubmit} defaultEmail={email}>
          <SubmitButton isSuccessful={isSuccessful}>Sign Up</SubmitButton>
          <p className="text-center text-sm text-gray-600 mt-4 dark:text-zinc-400">
            {"Already have an account? "}
            <Link
              href="/login"
              className="font-semibold text-gray-800 hover:underline dark:text-zinc-200"
            >
              Sign in
            </Link>
            {" instead."}
          </p>
        </AuthForm>
      </div>
    </div>
  );
}
