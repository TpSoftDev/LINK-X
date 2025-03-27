"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { BarChart3, Newspaper, TrendingUp } from "lucide-react";
import { fetchRecentMarketPrices } from "@/components/api/action"; // Import API function

const MarketTrends = () => {
  const [marketPrices, setMarketPrices] = useState<{ price: number; date: Date }[]>([]);
  const [status, setStatus] = useState<"loading" | "success" | "failed">("loading");
  const [sp500Change, setSp500Change] = useState<string>("");

  useEffect(() => {
    const fetchData = async () => {
      const { prices, status } = await fetchRecentMarketPrices();
      setMarketPrices(prices);
      setStatus(status);

      if (prices.length > 1) {
        const firstPrice = prices[0].price;
        const lastPrice = prices[prices.length - 1].price;
        const change = (((lastPrice - firstPrice) / firstPrice) * 100).toFixed(2);
        setSp500Change(`${change}%`);
      }
    };

    fetchData();
  }, []);

  const renderChart = () => {
    if (status === "loading") {
      return <p className="text-gray-400">Loading chart...</p>;
    }

    if (status === "failed") {
      return <p className="text-red-500">Failed to load data.</p>;
    }

    if (marketPrices.length === 0) {
      return <p className="text-gray-400">No market data available.</p>;
    }

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

    const pathData = marketPrices
      .map((data, index) => {
        const scaledX = ((new Date(data.date).getTime() - minDate) / (maxDate - minDate)) * 300;
        const scaledY = ((data.price - minPrice) / (maxPrice - minPrice)) * 100;

        return `${index === 0 ? "M" : "L"}${scaledX},${100 - scaledY}`;
      })
      .join(" ");

    return (
      <>
        <svg className="w-full h-24" viewBox="0 0 300 100" preserveAspectRatio="none">
          <path d={pathData} fill="none" stroke="#3b82f6" strokeWidth="2" />
        </svg>
        <div className="flex justify-between text-xs text-gray-400 mt-2">
          <span>{minDateFormatted}</span>
          <span>{halfDateFormatted}</span>
          <span>{maxDateFormatted}</span>
        </div>
      </>
    );
  };

  return (
    <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-blue-500/20 shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl text-blue-400">Market Trends & Economic News</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-white mb-2">Today's Market Movement</h3>
          <div className="bg-gray-800/50 p-4 rounded-lg">{renderChart()}</div>
        </div>
        <ul className="space-y-4">
          <li className="flex items-start space-x-3 bg-gray-800/50 p-3 rounded-lg">
            <BarChart3 className="h-5 w-5 text-blue-400 mt-0.5" />
            <span className="text-white">
              S&P 500 {sp500Change && (parseFloat(sp500Change) >= 0 ? "has gained " : "has lost ")}
              {sp500Change} over the last 30 days
            </span>
          </li>
          {[
            { icon: Newspaper, text: "Federal Reserve hints at potential rate cut" },
            { icon: TrendingUp, text: "Tech sector shows strong Q2 earnings" },
          ].map((item, index) => (
            <li key={index} className="flex items-start space-x-3 bg-gray-800/50 p-3 rounded-lg">
              <item.icon className="h-5 w-5 text-blue-400 mt-0.5" />
              <span className="text-white">{item.text}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};

export default MarketTrends;
