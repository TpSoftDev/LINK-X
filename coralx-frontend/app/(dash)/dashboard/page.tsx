"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
//import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { populateMarket, type MarketActionState } from "./api/actions";
//import { Progress } from "@/components/ui/progress";
import {
  BarChart3,
  BookOpen,
  Clock,
  TrendingUp,
  Newspaper,
  GraduationCap,
  ChevronRight,
} from "lucide-react";
import Header from "@/components/link-x/Header";

export default function Dashboard() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <Header isLoggedIn={true} />
      <main className="pt-[calc(8vh+2rem)] px-6 md:px-8 lg:px-12">
        <h1 className="text-4xl font-bold mb-8 text-blue-400">
          Financial Learning Dashboard
        </h1>
        <h2 className="text-1xl font-bold mb-8 text-white">
          Welcome back to Link-X! Here's an overview of your financial learning
          journey.
        </h2>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            {
              title: "Courses Completed",
              value: "12",
              icon: BookOpen,
              progress: 60,
            },
            {
              title: "Hours Studied",
              value: "87",
              icon: Clock,
              subtext: "+2.5% from last week",
            },
            {
              title: "Community Rank",
              value: "#42",
              icon: TrendingUp,
              badge: "Top 10%",
            },
            {
              title: "Next Milestone",
              value: "15 courses",
              icon: GraduationCap,
              progress: 80,
            },
          ].map((item, index) => (
            <Card
              key={index}
              className="bg-gradient-to-br from-gray-900 to-gray-800 border-blue-500/20 shadow-lg"
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-gray-400">
                  {item.title}
                </CardTitle>
                <item.icon className="h-5 w-5 text-blue-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white mb-2">
                  {item.value}
                </div>
                {/* {item.progress !== undefined && (
                  <Progress value={item.progress} className="bg-black" />
                )} */}
                {item.subtext && (
                  <p className="text-xs text-blue-300 mt-1">{item.subtext}</p>
                )}
                {/* {item.badge && (
                  <Badge className="mt-2 bg-blue-500/20 text-blue-300 border border-blue-500/50">{item.badge}</Badge>
                )} */}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recommended Courses */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-blue-500/20 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl text-blue-400">
                Recommended Courses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                {[
                  "Advanced Stock Trading",
                  "Cryptocurrency Fundamentals",
                  "Personal Finance Mastery",
                ].map((course, index) => (
                  <li
                    key={index}
                    className="flex items-center justify-between bg-gray-800/50 p-3 rounded-lg"
                  >
                    <span className="text-white">{course}</span>
                    <Button
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white flex items-center"
                      onClick={() => router.push("/learn")} // Navigate to /chat
                    >
                      Enroll <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Market Trends */}
          <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-blue-500/20 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl text-blue-400">
                Market Trends & Economic News
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-white mb-2">
                  Today's Market Movement
                </h3>
                <div className="bg-gray-800/50 p-4 rounded-lg">
                  <svg
                    className="w-full h-24"
                    viewBox="0 0 300 100"
                    preserveAspectRatio="none"
                  >
                    <path
                      d="M0,50 C50,30 100,70 150,50 S250,40 300,60"
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="2"
                    />
                  </svg>
                  <div className="flex justify-between text-xs text-gray-400 mt-2">
                    <span>9:30 AM</span>
                    <span>12:00 PM</span>
                    <span>4:00 PM</span>
                  </div>
                </div>
              </div>
              <ul className="space-y-4">
                {[
                  {
                    icon: BarChart3,
                    text: "S&P 500 reaches new all-time high",
                  },
                  {
                    icon: Newspaper,
                    text: "Federal Reserve hints at potential rate cut",
                  },
                  {
                    icon: TrendingUp,
                    text: "Tech sector shows strong Q2 earnings",
                  },
                ].map((item, index) => (
                  <li
                    key={index}
                    className="flex items-start space-x-3 bg-gray-800/50 p-3 rounded-lg"
                  >
                    <item.icon className="h-5 w-5 text-blue-400 mt-0.5" />
                    <span className="text-white">{item.text}</span>
                  </li>
                ))}
              </ul>

              {/* Button to Populate Market Table */}
              <div className="mt-6 flex justify-center">
                <Button
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={async () => {
                    try {
                      console.log("🟢 Starting market table population...");
                      const response = await populateMarket(); // Call Server Action instead of fetch

                      if (response.status === "success") {
                        alert("✅ Market table populated successfully!");
                      } else {
                        alert("❌ Failed to populate market table");
                      }
                    } catch (error) {
                      console.error("❌ Error populating market table:", error);
                      alert("❌ Failed to populate market table");
                    }
                  }}
                >
                  Populate Market Table
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recently Completed Courses */}
        <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-blue-500/20 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl text-blue-400">
              Recently Completed Courses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                "Introduction to Investing",
                "Financial Statement Analysis",
                "Risk Management Basics",
              ].map((course, index) => (
                <Card key={index} className="bg-gray-800/50 border-blue-500/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-white">
                      {course}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      {/* <Badge className="bg-green-500/20 text-green-300 border border-green-500/50">Completed</Badge> */}
                      <span className="text-xs text-gray-400">2 days ago</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
