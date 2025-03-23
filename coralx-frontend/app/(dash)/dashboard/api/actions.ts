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

// export const populateMarket = async (): Promise<MarketActionState> => {
//   try {
//     const session = await auth();
//     if (!session?.user?.id) {
//       console.error("❌ User session not found");
//       return { status: "failed" };
//     }

//     console.log("🌱 Populating Market Table...");

//     const marketData = [
//       { name: "Apple", price: "1.99" },
//       { name: "Banana", price: "0.79" },
//       { name: "Orange", price: "1.49" },
//       { name: "Grapes", price: "2.99" },
//       { name: "Watermelon", price: "4.99" },
//     ];

//     for (const item of marketData) {
//       // Validate each item before saving
//       marketSchema.parse(item);
//       //await saveMarketItem(item);
//     }

//     console.log("✅ Market table populated successfully!");
//     return { status: "success" };
//   } catch (error) {
//     console.error("❌ Error populating Market table:", error);
//     return { status: "failed" };
//   }
// };


// Schema validation for news item
const newsSchema = z.object({
  title: z.string().min(1),
  subject: z.string().min(1),
  link: z.string().url("Invalid URL"),
});

export interface NewsActionState {
  status: "idle" | "in_progress" | "success" | "failed" | "invalid_data";
}

// Save a news article
export const saveNews = async (
  _: NewsActionState,
  formData: FormData
): Promise<NewsActionState> => {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      console.error("❌ User session not found");
      return { status: "failed" };
    }

    console.log("✅ Received news form data:", Object.fromEntries(formData.entries()));

    // Validate input data using Zod
    const validatedData = newsSchema.parse({
      title: formData.get("title"),
      subject: formData.get("subject"),
      link: formData.get("link"),
    });

    console.log("✅ Validated news data:", validatedData);

    await saveNewsItem(validatedData);

    return { status: "success" };
  } catch (error) {
    console.error("❌ Error in saveNews:", error);
    return { status: "failed" };
  }
};

// Fetch all news
export const fetchAllNews = async () => {
  try {
    return await getAllNews();
  } catch (error) {
    console.error("❌ Error fetching news:", error);
    return [];
  }
};

// Delete a news item
export const deleteNews = async (id: string): Promise<NewsActionState> => {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      console.error("❌ User session not found");
      return { status: "failed" };
    }

    await deleteNewsById(id);
    return { status: "success" };
  } catch (error) {
    console.error("❌ Error deleting news:", error);
    return { status: "failed" };
  }
};
