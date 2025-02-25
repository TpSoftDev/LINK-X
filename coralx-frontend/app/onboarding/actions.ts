'use server';

import { z } from "zod";
import { auth } from '@/app/(auth)/auth';
import { saveOnboardingData } from "@/lib/db/queries";

const onboardingSchema = z.object({
  name: z.string().min(1),
  job: z.string().optional(),
  traits: z.string().optional(),
  learningStyle: z.string().optional(),
  depth: z.string().optional(),
  topics: z.string().optional(),
  interests: z.string().optional(),
  schedule: z.string().optional(),
  quizzes: z.boolean(),
});

export interface OnboardingActionState {
  status: "idle" | "in_progress" | "success" | "failed" | "invalid_data";
}

export const saveOnboarding = async (
    _: OnboardingActionState,
    formData: FormData
  ): Promise<OnboardingActionState> => {
    try {
      const session = await auth();
      if (!session?.user?.id) {
        console.error("❌ User session not found");
        return { status: "failed" };
      }
  
      console.log("✅ Received form data:", Object.fromEntries(formData.entries()));
  
      const validatedData = onboardingSchema.parse({
        name: formData.get("name"),
        job: formData.get("job"),
        traits: formData.get("traits"),
        learningStyle: formData.get("learningStyle"),
        depth: formData.get("depth"),
        topics: formData.get("topics"),
        interests: formData.get("interests"),
        schedule: formData.get("schedule"),
        quizzes: formData.get("quizzes") === "true",
      });
  
      console.log("✅ Validated onboarding data:", validatedData);
  
      await saveOnboardingData({ userId: session.user.id, ...validatedData });
  
      return { status: "success" };
    } catch (error) {
      console.error("❌ Error in saveOnboarding:", error);
      return { status: "failed" };
    }
  };
  

