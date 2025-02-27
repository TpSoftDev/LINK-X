"use client";

import { useState, useEffect } from "react";
import { useActionState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckedState } from "@radix-ui/react-checkbox";
import { useRouter } from "next/navigation";

import { saveOnboarding, type OnboardingActionState } from "./actions";

import Header from '@/components/link-x/Header';

export default function OnboardingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // useEffect(() => {
  //   console.log("🔍 Checking session in Onboarding:", { session, status });
    
  //   if (status === "loading") return;
  //   if (!session?.user?.id) {
  //     console.warn("❌ No session found, redirecting to login...");
  //     router.push("/login");
  //   }
  // }, [session, status, router]);

  //form data

  const [formData, setFormData] = useState({
    name: "",
    job: "",
    traits: "",
    learningStyle: "",
    depth: "",
    topics: "",
    interests: "",
    schedule: "",
    quizzes: false,
  });

  const handleChange = (value: string, name: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCheckboxChange = (checked: CheckedState, name: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: checked === true,
    }));
  }; 

  const handleSubmit = async () => {
    

    const form = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      form.append(key, value.toString());
    });

    console.log("🚀 Submitting onboarding data:", Object.fromEntries(form.entries()));

    const response = await saveOnboarding({ status: "idle" } as OnboardingActionState, form);
    if (response.status === "success") {
      console.log("✅ Onboarding data saved successfully!");
      router.push("/dashboard");
    } else {
      console.error("❌ Failed to save onboarding data.");
    }
  };
  

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-gray-100 bg-gray-950 p-6">
      <Header isLoggedIn={false} showAuthButton={false}/>
      <Card className="w-full max-w-lg p-6 relative bg-gray-650 border-blue-500/20 shadow-lg"> {/* Ensure relative positioning */}
        <CardContent>
        <h1 className="text-xl font-semibold mb-4 text-blue-400">Personalized Learning Setup</h1>

        <label className="block mt-4 mb-2 text-gray-400">What should Link-X call you?</label>
          <Input className="bg-gradient-to-br from-gray-900 to-gray-800 border-blue-500/20 shadow-lg" type="text" name="name" onChange={(e) => handleChange(e.target.value, "name")} />

        <label className="block mt-4 mb-2 text-gray-400">What do you do?</label>
          <Input className="bg-gradient-to-br from-gray-900 to-gray-800 border-blue-500/20 shadow-lg"  type="text" name="job" placeholder="e.g., Student, Engineer" onChange={(e) => handleChange(e.target.value, "job")} />

        <label className="block mt-4 mb-2 text-gray-400">What traits should Link-X have?</label>
          <Input className="bg-gradient-to-br from-gray-900 to-gray-800 border-blue-500/20 shadow-lg" type="textarea" name="traits" placeholder="e.g., witty, encouraging" onChange={(e) => handleChange(e.target.value, "traits")} />

          <label className="block mb-2 text-gray-400">Preferred Learning Style</label>
          <Select onValueChange={(value) => handleChange(value, "learningStyle")}>
            <SelectTrigger className="bg-gradient-to-br from-gray-900 to-gray-800 border-blue-500/20 shadow-lg" >
              <SelectValue placeholder="Select a learning style" />
            </SelectTrigger>
            <SelectContent className="z-50 bg-gradient-to-br from-gray-900 to-gray-800 border-blue-500/20 shadow-lg text-gray-100">
              <SelectItem value="visual" className="hover:bg-gray-200 cursor-pointer">Visual</SelectItem>
              <SelectItem value="auditory" className="hover:bg-gray-200 cursor-pointer">Auditory</SelectItem>
              <SelectItem value="games" className="hover:bg-gray-200 cursor-pointer">Games</SelectItem>
              <SelectItem value="text-based" className="hover:bg-gray-200 cursor-pointer">Text-Based</SelectItem>
            </SelectContent>
          </Select>

          <label className="block mt-4 mb-2 text-gray-400">Depth of Explanation</label>
          <Select onValueChange={(value) => handleChange(value, "depth")}>
            <SelectTrigger className="bg-gradient-to-br from-gray-900 to-gray-800 border-blue-500/20 shadow-lg" >
              <SelectValue placeholder="Select depth" />
            </SelectTrigger>
            <SelectContent className="z-50 z-50 bg-gradient-to-br from-gray-900 to-gray-800 border-blue-500/20 shadow-lg text-gray-100">

              <SelectItem value="concise">Concise Summaries</SelectItem>
              <SelectItem value="detailed">In-depth Explanations</SelectItem>
            </SelectContent>
          </Select>

          <label className="block mt-4 mb-2 text-gray-400">Topics of Interest</label>
          <Input className="bg-gradient-to-br from-gray-900 to-gray-800 border-blue-500/20 shadow-lg"  type="text" name="topics" placeholder="e.g., Investing, Finance" onChange={(e) => handleChange(e.target.value, "topics")} />

          <label className="block mt-4 mb-2 text-gray-400">Interests, Values, or Preferences for Personalization</label>
          <Input className="bg-gradient-to-br from-gray-900 to-gray-800 border-blue-500/20 shadow-lg"  type="text" name="interests" placeholder="e.g., Basketball, Video Games" onChange={(e) => handleChange(e.target.value, "interests")} />

          <label className="block mt-4 mb-2 text-gray-400">Preferred Study Schedule</label>
          <Select onValueChange={(value) => handleChange(value, "schedule")}>
            <SelectTrigger className="bg-gradient-to-br from-gray-900 to-gray-800 border-blue-500/20 shadow-lg" >
              <SelectValue placeholder="Select schedule" />
            </SelectTrigger>
            <SelectContent className="z-50 z-50 bg-gradient-to-br from-gray-900 to-gray-800 border-blue-500/20 shadow-lg text-gray-100">

              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="flexible">Flexible</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center mt-4">
          <Checkbox checked={formData.quizzes} onCheckedChange={(checked) => handleCheckboxChange(checked, "quizzes")} />
  <label htmlFor="quizzes" className="ml-2">Include quizzes for progress tracking</label>
</div>



<Button className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white"onClick={handleSubmit}>Save Preferences
</Button>

        </CardContent>
      </Card>
    </div>
  );
}