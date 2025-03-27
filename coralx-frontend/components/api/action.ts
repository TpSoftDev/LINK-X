"use server";

import { z } from "zod";
import { auth } from "@/app/(auth)/auth";
import { getRecentMarketPrices, getMarketItemById, deleteMarketItemById, saveNewsItem, getAllNews, deleteNewsById } from "@/lib/db/queries";
import { TimestampFsp } from "drizzle-orm/mysql-core";

// Schema validation
const marketSchema = z.object({
  snp500: z.number(),
  date: z.date(),
});

export interface MarketActionState {
  status: "idle" | "in_progress" | "success" | "failed" | "invalid_data";
}

export const fetchRecentMarketPrices = async (): Promise<{
  prices: { price: number; date: Date }[]; // Array of price-date pairs
  status: "success" | "failed";
}> => {
  try {
    console.log(`📊 Fetching recent prices for snp500`);

    // Fetch the recent market prices (which now returns price and date)
    const prices = await getRecentMarketPrices();

    console.log("✅ Successfully fetched market prices:", prices);

    // Return the result, maintaining the price and date structure
    return { prices, status: "success" };
  } catch (error) {
    console.error("❌ Error fetching recent market prices:", error);
    return { prices: [], status: "failed" };
  }
};