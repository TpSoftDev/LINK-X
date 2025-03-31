"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Sidebar from "@/components/link-x/Sidebar";
import StatisticsCard from "@/components/dashboard/StatisticsCard";
import MarketTrends from "@/components/dashboard/MarketTrends";
import CoursesList from "@/components/dashboard/CoursesList";
import RecentlyCompletedCourses from "@/components/dashboard/RecentCourses";
import Header from "@/components/link-x/Header";
import Footer from "@/components/landing/Footer";
import { cn } from "@/lib/utils";
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

async function fetchRecentMarketPricesDirectly() {
  try {
    const res = await fetch("http://localhost:8080/market/recent", {
      method: "GET",
    });
    if (!res.ok) {
      throw new Error("Failed to fetch market prices");
    }
    const data = await res.json();
    const prices = data.map((item) => ({
      price: item.price,
      date: new Date(item.date),
    }));
    return { prices, status: "success" };
  } catch (error) {
    console.error("❌ Error fetching market prices:", error);
    return { prices: [], status: "failed" };
  }
}

export default function Dashboard() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [marketPrices, setMarketPrices] = useState([]);
  const [status, setStatus] = useState("loading");
  const [sp500Change, setSp500Change] = useState("");
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const getPrices = async () => {
      setStatus("loading");
      const response = await fetchRecentMarketPricesDirectly();
      if (response.status === "success") {
        setMarketPrices(response.prices);
        if (response.prices.length > 1) {
          const firstPrice = response.prices[0].price;
          const lastPrice = response.prices[response.prices.length - 1].price;
          const change = ((lastPrice - firstPrice) / firstPrice) * 100;
          setSp500Change(`${change.toFixed(2)}%`);
        }
        setStatus("success");
      } else {
        setStatus("failed");
      }
    };
    getPrices();
  }, []);

  

  return (
    <div className="min-h-screen bg-black text-gray-100 flex">
      <Sidebar onCollapseChange={(value) => setIsCollapsed(value)} />
      <div className={cn("flex-1 transition-all duration-300", isCollapsed ? "ml-14" : "ml-44")}>
        <main className={cn("pt-6 transition-all duration-300", isCollapsed ? "px-6 md:px-8 lg:px-12" : "px-4")}>
          <h1 className="text-4xl font-bold mb-4 text-blue-400">Financial Learning Dashboard</h1>
          <h2 className="text-1xl font-bold mb-8 text-white">
            Welcome back to Link-X! Here's an overview of your financial learning journey.
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 my-8">
          <StatisticsCard title="Courses Completed" value="12" icon={BookOpen} />
          <StatisticsCard title="Hours Studied" value="87" icon={Clock} />
          <StatisticsCard title="Community Rank" value="#42" icon={TrendingUp} />
          <StatisticsCard title="Next Milestone" value="15 courses" icon={GraduationCap} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CoursesList search={search} setSearch={setSearch} />
          <MarketTrends sp500Change={sp500Change} renderChart={() => <p>Chart here</p>} />
        </div>
        <div className="grid grid-cols-1 gap-6 my-8">
          <RecentlyCompletedCourses/>
        </div>
          <Footer />
        </main>
      </div>
    </div>
  );
}