"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
//import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input"; 
//import { populateMarket, type MarketActionState } from "./api/actions";
//import { Progress } from "@/components/ui/progress";
import {
  BarChart3,
  BookOpen,
  Clock,
  TrendingUp,
  Newspaper,
  GraduationCap,
  ChevronRight,
  Plus,
} from "lucide-react";
import Header from "@/components/link-x/Header";
import { fetchRecentMarketPrices } from "./api/actions";
import { market } from "@/lib/db/schema";

export default function Dashboard() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [marketPrices, setMarketPrices] = useState<{ price: number; date: Date }[]>([]);
  const [status, setStatus] = useState<"loading" | "success" | "failed">("loading");
  const [sp500Change, setSp500Change] = useState<string>("");
  useEffect(() => {
    const getPrices = async () => {
      try {
        const response = await fetchRecentMarketPrices();
        if (response.status === "success") {
          setMarketPrices(response.prices); // Update state with the fetched data
          if (response.prices.length > 1) {
            const firstPrice = response.prices[0].price;
            const lastPrice = response.prices[response.prices.length - 1].price;

            const change = ((lastPrice - firstPrice) / firstPrice) * 100;
            setSp500Change(`${change.toFixed(2)}%`);
          }
          console.log(marketPrices)
          setStatus("success");
        } else {
          setStatus("failed");
        }
      } catch (error) {
        console.error("❌ Error fetching market prices:", error);
        setStatus("failed");
      }
    };

    getPrices(); // Fetch data when the page loads
  }, []);

  // Function to draw the chart
  const renderChart = () => {
    if (status === "loading") {
      return <p className="text-gray-400">Loading chart...</p>;
    }
  
    if (status === "failed") {
      return <p className="text-red-500">Failed to load data.</p>;
    }
  
    // Get the min and max prices to scale the Y-axis
    const prices = marketPrices.map((data) => data.price);
    const dates = marketPrices.map((data) => new Date(data.date));
  
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
  
    const minDate = Math.min(...dates.map((date) => date.getTime()));
    const maxDate = Math.max(...dates.map((date) => date.getTime()));
    const halfDate = new Date((minDate + maxDate) / 2);

    const minDateFormatted = new Date(minDate).toLocaleDateString();
    const maxDateFormatted = new Date(maxDate).toLocaleDateString();
    const halfDateFormatted = halfDate.toLocaleDateString();
  
  
    // Create the path data by scaling the prices and dates
    const pathData = marketPrices.map((data, index) => {
      const scaledX = ((new Date(data.date).getTime() - minDate) / (maxDate - minDate)) * 300; // Scale X to fit the width (300)
      const scaledY = ((data.price - minPrice) / (maxPrice - minPrice)) * 100; // Scale Y to fit the height (100)
  
      return `${index === 0 ? "M" : "L"}${scaledX},${100 - scaledY}`; // Move (M) to the first point and Line (L) to the others
    }).join(" ");
  
    return (
      <>
        <svg className="w-full h-24" viewBox="0 0 300 100" preserveAspectRatio="none">
          <path d={pathData} fill="none" stroke="#3b82f6" strokeWidth="2" />
        </svg>
  
        {/* Render the date range only when the data is available */}
        <div className="flex justify-between text-xs text-gray-400 mt-2">
          <span>{minDateFormatted}</span>
          <span>{halfDateFormatted}</span>
          <span>{maxDateFormatted}</span>
        </div>
      </>
    );
  };

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
            <div className="mb-4">
              <CardHeader>
                <CardTitle className="text-xl text-blue-400">Courses and Topics</CardTitle>
              </CardHeader>
              <div className="px-4 sm:px-6">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Input
                      type="text"
                      placeholder="Search courses..."
                      className="bg-gray-800/80 text-white border-blue-500/30 focus:border-blue-400/50 pl-10 h-10 rounded-lg shadow-inner shadow-blue-900/10 focus-visible:ring-blue-500/40 focus-visible:ring-offset-gray-900 w-full"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-blue-400/70"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    </div>
                  </div>
                  <Button className="bg-green-600 hover:bg-green-700 text-white h-10 px-4 shadow-md shadow-green-900/20 border border-green-500/30 whitespace-nowrap">
                    <Plus className="h-5 w-5 mr-2" />
                    Upload Course
                  </Button>
                </div>
              </div>
            </div>
            <CardContent>
              <ul className="space-y-4">
                {["Advanced Stock Trading", "Cryptocurrency Fundamentals", "Personal Finance Mastery"].map(
                  (course, index) => (
                    <li key={index} className="flex items-center justify-between bg-gray-800/50 p-3 rounded-lg">
                      <span className="text-white">{course}</span>
                      <Button
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 text-white flex items-center"
                        onClick={() => router.push("/learn")} // Navigate to /learn
                      >
                        Learn <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </li>
                  ),
                )}
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
        {renderChart()}

      </div>
              </div>
              <ul className="space-y-4">
                <li className="flex items-start space-x-3 bg-gray-800/50 p-3 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-blue-400 mt-0.5" />
                  <span className="text-white">
                    S&P 500 {"The " + sp500Change && (parseFloat(sp500Change) >= 0 ? "has gained " : "has lost ")} {sp500Change + " over the last 30 days"} 
                  </span>
                </li>
                {[
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
