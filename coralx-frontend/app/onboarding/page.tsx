"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckedState } from "@radix-ui/react-checkbox";

export default function OnboardingPage() {
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
      [name]: checked === true, // Converts "indeterminate" to false
    }));
  };  
  

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-6">
      <Card className="w-full max-w-lg p-6 relative"> {/* Ensure relative positioning */}
        <CardContent>
        <h1 className="text-xl font-semibold mb-4">Personalized Learning Setup</h1>

        <label className="block mt-4 mb-2">What should Link-X call you?</label>
          <Input type="text" name="name" onChange={(e) => handleChange(e.target.value, "name")} />

        <label className="block mt-4 mb-2">What do you do?</label>
          <Input type="text" name="job" placeholder="e.g., Student, Engineer" onChange={(e) => handleChange(e.target.value, "job")} />

        <label className="block mt-4 mb-2">What traits should Link-X have?</label>
          <Input type="textarea" name="traits" placeholder="e.g., witty, encouraging" onChange={(e) => handleChange(e.target.value, "traits")} />

          <label className="block mb-2">Preferred Learning Style</label>
          <Select onValueChange={(value) => handleChange(value, "learningStyle")}>
            <SelectTrigger>
              <SelectValue placeholder="Select a learning style" />
            </SelectTrigger>
            <SelectContent className="z-50 bg-white shadow-md border border-gray-300">
              <SelectItem value="visual" className="hover:bg-gray-200 cursor-pointer">Visual</SelectItem>
              <SelectItem value="auditory" className="hover:bg-gray-200 cursor-pointer">Auditory</SelectItem>
              <SelectItem value="games" className="hover:bg-gray-200 cursor-pointer">Games</SelectItem>
              <SelectItem value="text-based" className="hover:bg-gray-200 cursor-pointer">Text-Based</SelectItem>
            </SelectContent>
          </Select>

          <label className="block mt-4 mb-2">Depth of Explanation</label>
          <Select onValueChange={(value) => handleChange(value, "depth")}>
            <SelectTrigger>
              <SelectValue placeholder="Select depth" />
            </SelectTrigger>
            <SelectContent className="z-50 bg-white shadow-md border border-gray-300">

              <SelectItem value="concise">Concise Summaries</SelectItem>
              <SelectItem value="detailed">In-depth Explanations</SelectItem>
            </SelectContent>
          </Select>

          <label className="block mt-4 mb-2">Topics of Interest</label>
          <Input type="text" name="topics" placeholder="e.g., Investing, Finance" onChange={(e) => handleChange(e.target.value, "topics")} />

          <label className="block mt-4 mb-2">Interests, Values, or Preferences for Personalization</label>
          <Input type="text" name="interests" placeholder="e.g., Basketball, Video Games" onChange={(e) => handleChange(e.target.value, "interests")} />

          <label className="block mt-4 mb-2">Preferred Study Schedule</label>
          <Select onValueChange={(value) => handleChange(value, "schedule")}>
            <SelectTrigger>
              <SelectValue placeholder="Select schedule" />
            </SelectTrigger>
            <SelectContent className="z-50 bg-white shadow-md border border-gray-300">

              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="flexible">Flexible</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center mt-4">
  <Checkbox 
    id="quizzes" 
    checked={formData.quizzes} 
    onCheckedChange={(checked) => handleCheckboxChange(checked, "quizzes")} 
  />
  <label htmlFor="quizzes" className="ml-2">Include quizzes for progress tracking</label>
</div>


<Button className="w-full mt-6 bg-gray-500 hover:bg-gray-600 text-white">
  Save Preferences
</Button>

        </CardContent>
      </Card>
    </div>
  );
}
