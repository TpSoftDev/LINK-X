"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import Sidebar from "@/components/link-x/LearnSidebar";
import LessonContent from "./components/lesson-content";
import AIChatbot from "./components/ai-chatbot";
import Header from "@/components/link-x/Header";

export default function Home() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden bg-background">
        {/* Sidebar */}
        <Sidebar onCollapseChange={setIsCollapsed} />

        {/* Main Content + Chatbot */}
        <div
          className={cn(
            "flex flex-grow h-full transition-all duration-300 ease-in-out overflow-hidden",
            isCollapsed ? "ml-16" : "ml-64"
          )}
        >
          <main className="flex-grow overflow-y-auto p-6">
            <LessonContent />
          </main>
          <AIChatbot />
        </div>
      </div>
    </div>
  );
}
