"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Sidebar from "@/components/link-x/DashSidebar";
import StatisticsCard from "@/components/dashboard/StatisticsCard";
import MarketTrends from "@/components/dashboard/MarketTrends";
import CoursesList from "@/components/dashboard/CoursesList";
import AudioUpload from "@/components/dashboard/AudioUpload";
import RecentlyCompletedCourses from "@/components/dashboard/RecentCourses";
import Header from "@/components/link-x/Header";
import Footer from "@/components/landing/Footer";
import {
  BookOpen,
  Clock,
  TrendingUp,
  GraduationCap,
  Plus,
  UploadCloud
} from "lucide-react";
import LearnPrompt from "@/components/dashboard/LearnPrompt";

export default function Dashboard() {
  const [search, setSearch] = useState("");
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-white text-gray-900 flex">
      <Sidebar onCollapseChange={(value) => setIsCollapsed(value)} />
      <div className={cn("flex-1 transition-all duration-300", isCollapsed ? "ml-14" : "ml-44")}>
        <main className={cn("pt-6 transition-all duration-300", isCollapsed ? "px-6 md:px-8 lg:px-12" : "px-4")}>
          <h1 className="text-4xl font-bold mb-4 text-blue-600">Learning Dashboard</h1>
          <h2 className="text-lg font-medium mb-8 text-gray-700">
            Welcome back to Learn-X! Here's an overview of your learning journey.
          </h2>

          {/* STATS SECTION */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 my-8">
            <StatisticsCard title="Courses Completed" value="12" icon={BookOpen} />
            <StatisticsCard title="Hours Studied" value="87" icon={Clock} />
            <StatisticsCard title="Community Rank" value="#42" icon={TrendingUp} />
            <StatisticsCard title="Next Milestone" value="15 courses" icon={GraduationCap} />
          </div>

          {/* TWO MAIN FUNCTIONALITY CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5 text-blue-500" /> Join a Class
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Input placeholder="Enter class code..." className="mb-4" />
                <Button>Join</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UploadCloud className="w-5 h-5 text-green-500" /> Upload Content
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AudioUpload />
              </CardContent>
            </Card>
          </div>

          {/* OTHER SECTIONS */}
          <div className="grid grid-cols-1 gap-6">
            <LearnPrompt />
            <CoursesList search={search} setSearch={setSearch} />
            <RecentlyCompletedCourses />
          </div>

          <Footer />
        </main>
      </div>
    </div>
  );
}
