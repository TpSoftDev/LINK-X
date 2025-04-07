import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Newspaper, TrendingUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

async function fetchRecentMarketPricesDirectly() {
  try {
    const res = await fetch("http://localhost:8080/market/recent", { method: "GET" });
    if (!res.ok) throw new Error("Failed to fetch market prices");

    const data = await res.json();
    return data.map((item: { price: number; date: string }) => ({
      price: item.price,
      date: new Date(item.date),
    }));
  } catch (error) {
    console.error("❌ Error fetching market prices:", error);
    return [];
  }
}

export default function MarketTrends() {
  const [marketPrices, setMarketPrices] = useState<{ price: number; date: Date }[]>([]);
  const [status, setStatus] = useState<"loading" | "success" | "failed">("loading");
  const [sp500Change, setSp500Change] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const getPrices = async () => {
      setStatus("loading");
      const prices = await fetchRecentMarketPricesDirectly();
      if (prices.length > 0) {
        setMarketPrices(prices);
        const firstPrice = prices[0].price;
        const lastPrice = prices[prices.length - 1].price;
        setSp500Change(`${(((lastPrice - firstPrice) / firstPrice) * 100).toFixed(2)}%`);
        setStatus("success");
      } else {
        setStatus("failed");
      }
    };
    getPrices();
  }, []);

  const renderChart = () => {
    if (status === "loading") {
      return <p className="text-gray-400">Loading chart...</p>;
    }
    if (status === "failed") {
      return <p className="text-red-500">Failed to load data.</p>;
    }
    const prices = marketPrices.map((d) => d.price);
    const dates = marketPrices.map((d) => d.date.getTime());
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const minDate = Math.min(...dates);
    const maxDate = Math.max(...dates);
    const midDateValue = new Date((minDate + maxDate) / 2);
    const minDateLabel = new Date(minDate).toLocaleDateString();
    const midDateLabel = midDateValue.toLocaleDateString();
    const maxDateLabel = new Date(maxDate).toLocaleDateString();

    const pathData = marketPrices
      .map((d, i) => {
        const scaledX = ((d.date.getTime() - minDate) / (maxDate - minDate)) * 300;
        const scaledY = ((d.price - minPrice) / (maxPrice - minPrice)) * 100;
        return `${i === 0 ? "M" : "L"}${scaledX},${100 - scaledY}`;
      })
      .join(" ");

    return (
      <>
        <svg className="w-full h-24" viewBox="0 0 300 100" preserveAspectRatio="none">
          <path d={pathData} fill="none" stroke="#3b82f6" strokeWidth="2" />
        </svg>
        <div className="flex justify-between text-xs text-gray-400 mt-2">
          <span>{minDateLabel}</span>
          <span>{midDateLabel}</span>
          <span>{maxDateLabel}</span>
        </div>
      </>
    );
  };

  return (
    <div
      className={cn(
        "transition-all duration-300",
        isExpanded ? "fixed inset-0 bg-black z-50 flex items-center justify-center p-6" : "relative"
      )}
    >
      <Card
        className={cn(
          "bg-gradient-to-br from-gray-900 to-gray-800 border-blue-500/20 shadow-lg transition-all duration-300",
          isExpanded ? "w-full max-w-4xl h-full p-6 overflow-auto" : "w-full"
        )}
        onClick={() => !isExpanded && setIsExpanded(true)}
      >
        <CardHeader className="relative flex justify-between items-center">
          <CardTitle className="text-xl text-blue-400">Market Trends & Economic News</CardTitle>
          {isExpanded && (
            <Button
              variant="ghost"
              className="absolute top-3 right-3"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(false);
              }}
            >
              <X className="h-6 w-6 text-white" />
            </Button>
          )}
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
                S&P 500 {sp500Change ? (parseFloat(sp500Change) >= 0 ? `has gained ${sp500Change} over the last 30 days` : `has lost ${sp500Change} over the last 30 days`) : "price change unavailable"}
              </span>
            </li>
            {[{ icon: Newspaper, text: "Federal Reserve hints at potential rate cut" }, { icon: TrendingUp, text: "Tech sector shows strong Q2 earnings" }].map((item, idx) => (
              <li key={idx} className="flex items-start space-x-3 bg-gray-800/50 p-3 rounded-lg">
                <item.icon className="h-5 w-5 text-blue-400 mt-0.5" />
                <span className="text-white">{item.text}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
