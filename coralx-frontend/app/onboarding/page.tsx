"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectItem } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

export default function OnboardingPage() {
  const [formData, setFormData] = useState({
    learningStyle: "",
    depth: "",
    topics: "",
    interests: "",
    schedule: "",
    quizzes: false,
  });

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-6">
      <Card className="w-full max-w-lg p-6">
        <CardContent>
          <h1 className="text-xl font-semibold mb-4">Personalized Learning Setup</h1>
          
          <label className="block mb-2">Preferred Learning Style</label>
          <Select name="learningStyle" onValueChange={handleChange}>
            <SelectItem value="visual">Visual</SelectItem>
            <SelectItem value="auditory">Auditory</SelectItem>
            <SelectItem value="games">Games</SelectItem>
            <SelectItem value="text-based">Text-Based</SelectItem>
          </Select>
          
          <label className="block mt-4 mb-2">Depth of Explanation</label>
          <Select name="depth" onValueChange={handleChange}>
            <SelectItem value="concise">Concise Summaries</SelectItem>
            <SelectItem value="detailed">In-depth Explanations</SelectItem>
          </Select>
          
          <label className="block mt-4 mb-2">Topics of Interest</label>
          <Input type="text" name="topics" placeholder="e.g., Investing, Finance" onChange={handleChange} />

          <label className="block mt-4 mb-2">Interests for Personalization</label>
          <Input type="text" name="interests" placeholder="e.g., Basketball, Video Games" onChange={handleChange} />
          
          <label className="block mt-4 mb-2">Preferred Study Schedule</label>
          <Select name="schedule" onValueChange={handleChange}>
            <SelectItem value="daily">Daily</SelectItem>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="flexible">Flexible</SelectItem>
          </Select>
          
          <div className="flex items-center mt-4">
            <Checkbox name="quizzes" onChange={handleChange} />
            <span className="ml-2">Include quizzes for progress tracking</span>
          </div>
          
          <Button className="w-full mt-6">Save Preferences</Button>
        </CardContent>
      </Card>
    </div>
  );
}
