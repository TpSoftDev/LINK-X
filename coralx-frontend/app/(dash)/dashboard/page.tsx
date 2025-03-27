"use client";
import { useState, useEffect } from "react";
import Header from "@/components/link-x/Header";
import StatisticsCard from "@/components/dashboard/StatisticsCard";
import MarketTrends from "@/components/dashboard/MarketTrends";
import CoursesList from "@/components/dashboard/CoursesList";
import { BookOpen, Clock, TrendingUp, GraduationCap } from "lucide-react";
import { fetchRecentMarketPrices } from "./api/actions";
import RecentlyCompletedCourses from "@/components/dashboard/RecentCourses";

export default function Dashboard() {
  const [search, setSearch] = useState("");
  const [marketPrices, setMarketPrices] = useState<{ price: number; date: Date }[]>([]);
  const [sp500Change, setSp500Change] = useState("");

  useEffect(() => {
    fetchRecentMarketPrices().then(response => {
      if (response.status === "success") {
        setMarketPrices(response.prices);
        if (response.prices.length > 1) {
          const change = ((response.prices[response.prices.length - 1].price - response.prices[0].price) / response.prices[0].price) * 100;
          setSp500Change(`${change.toFixed(2)}%`);
        }
      }
    });
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <Header isLoggedIn={true} />
      <main className="pt-[calc(8vh+2rem)] px-6">
        <h1 className="text-4xl font-bold text-blue-400">Financial Learning Dashboard</h1>

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
      
      </main>
    </div>
  );
}
