import 'server-only';

import { genSaltSync, hashSync } from 'bcrypt-ts';
import { and, asc, desc, eq, gt, gte } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import {
  user,
  chat,
  type User,
  document,
  type Suggestion,
  suggestion,
  type Message,
  message,
  vote,
  onboarding,
  market,
  news
} from './schema';
import { BlockKind } from '@/components/block';

// Optionally, if not using email/pass login, you can
// use the Drizzle adapter for Auth.js / NextAuth
// https://authjs.dev/reference/adapter/drizzle

// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);


// Save a news article
export async function saveNewsItem({
  title,
  subject,
  link,
}: {
  title: string;
  subject: string;
  link: string;
}) {
  try {
    console.log("✅ Saving news item:", title);

    const result = await db.insert(news).values({
      title,
      subject,
      link,
    });

    console.log("✅ Successfully inserted:", result);
    return result;
  } catch (error) {
    console.error("❌ Failed to save news item", error);
    throw error;
  }
}

// Get all news articles
export async function getAllNews() {
  try {
    return await db.select().from(news);
  } catch (error) {
    console.error("❌ Failed to fetch news", error);
    throw error;
  }
}

// Get a news article by ID
export async function getNewsById(id: string) {
  try {
    return await db.select().from(news).where(eq(news.id, id));
  } catch (error) {
    console.error("❌ Failed to fetch news by ID", error);
    throw error;
  }
}

// Delete a news article by ID
export async function deleteNewsById(id: string) {
  try {
    console.log("🗑️ Deleting news item with ID:", id);

    const result = await db.delete(news).where(eq(news.id, id));

    console.log("✅ Successfully deleted:", result);
    return result;
  } catch (error) {
    console.error("❌ Failed to delete news item", error);
    throw error;
  }
}


//code for market price
// export async function saveMarketItem({
//   snp500,
//   date,
// }: {
//   snp500: number;
//   date: Date;
// }) {
//   try {
//     console.log("✅ Saving price on:", date, "with price:", snp500);

//     const result = await db.insert(market).values({
//       snp500,
//       date
//     });

//     console.log("✅ Successfully inserted:", result);
//     return result;
//   } catch (error) {
//     console.error("❌ Failed to save market item", error);
//     throw error;
//   }
// }

/**
 * Get the last 30 prices for a specific market item
 */
export async function getRecentMarketPrices() {
  try {
    console.log("📊 Fetching last 30 prices for market item:");

    const result = await db
      .select({ price: market.snp500, date: market.date })
      .from(market)
      .orderBy(asc(market.date)) // Ensure 'date' column exists for sorting
      .limit(30);
      //const prices = result.map((row) => parseFloat(row.price));
      const prices = result.map((row) => ({
        price: parseFloat(row.price),  // Convert price to float
        date: new Date(row.date)  // Keep the date as is
      }));
   
    console.log("✅ Successfully fetched prices:");
    return prices;
  } catch (error) {
    console.error("❌ Failed to fetch recent market prices", error);
    throw error;
  }
}

/**
 * Get a Market item by ID
 */
export async function getMarketItemById(id: string) {
  try {
    return await db.select().from(market).where(eq(market.id, id));
  } catch (error) {
    console.error("❌ Failed to fetch market item by ID", error);
    throw error;
  }
}

/**
 * Update a Market item's price
 */
// export async function updateMarketItemPrice({
//   id,
//   price,
// }: {
//   id: string;
//   price: string;
// }) {
//   try {
//     console.log("🔄 Updating market item price for ID:", id);

//     const result = await db
//       .update(market)
//       .set({price})
//       .where(eq(market.id, id));

//     console.log("✅ Successfully updated:", result);
//     return result;
//   } catch (error) {
//     console.error("❌ Failed to update market item price", error);
//     throw error;
//   }
// }

/**
 * Delete a Market item by ID
 */
export async function deleteMarketItemById(id: string) {
  try {
    console.log("🗑️ Deleting market item with ID:", id);

    const result = await db.delete(market).where(eq(market.id, id));

    console.log("✅ Successfully deleted:", result);
    return result;
  } catch (error) {
    console.error("❌ Failed to delete market item", error);
    throw error;
  }
}

//code for posting onboarding data


export async function saveOnboardingData({
  userId,
  name,
  job,
  traits,
  learningStyle,
  depth,
  topics,
  interests,
  schedule,
  quizzes,
}: {
  userId: string;
  name: string;
  job?: string;
  traits?: string;
  learningStyle?: string;
  depth?: string;
  topics?: string;
  interests?: string;
  schedule?: string;
  quizzes: boolean;
}) {
  try {
    console.log("✅ Saving onboarding data to database for user:", userId);
    
    const result = await db.insert(onboarding).values({
      userId,
      name,
      job,
      traits,
      learningStyle,
      depth,
      topics,
      interests,
      schedule,
      quizzes,
      createdAt: new Date(),
    });

    console.log("✅ Successfully inserted:", result);
    return result;
  } catch (error) {
    console.error("❌ Failed to save onboarding data in database", error);
    throw error;
  }
}


export async function getOnboardingDataByUserId(userId: string) {
  try {
    return await db
      .select()
      .from(onboarding)
      .where(eq(onboarding.userId,userId));
  } catch (error) {
    console.error("Failed to fetch onboarding data for user", error);
    throw error;
  }
}

export async function updateOnboardingData({
  userId,
  name,
  job,
  traits,
  learningStyle,
  depth,
  topics,
  interests,
  schedule,
  quizzes,
}: {
  userId: string;
  name?: string;
  job?: string;
  traits?: string;
  learningStyle?: string;
  depth?: string;
  topics?: string;
  interests?: string;
  schedule?: string;
  quizzes?: boolean;
}) {
  try {
    return await db
      .update(onboarding)
      .set({
        name,
        job,
        traits,
        learningStyle,
        depth,
        topics,
        interests,
        schedule,
        quizzes,
        createdAt: new Date(),
      })
      .where(eq(onboarding.userId,userId));
  } catch (error) {
    console.error("Failed to update onboarding data in database", error);
    throw error;
  }
}

export async function deleteOnboardingDataByUserId(userId: string) {
  try {
    return await db.delete(onboarding).where(eq(onboarding.userId,userId));
  } catch (error) {
    console.error("Failed to delete onboarding data for user", error);
    throw error;
  }
}




export async function getUser(email: string): Promise<Array<User>> {
  try {
    return await db.select().from(user).where(eq(user.email, email));
  } catch (error) {
    console.error('Failed to get user from database');
    throw error;
  }
}

export async function createUser(email: string, password: string) {
  const salt = genSaltSync(10);
  const hash = hashSync(password, salt);

  try {
    return await db.insert(user).values({ email, password: hash });
  } catch (error) {
    console.error('Failed to create user in database');
    throw error;
  }
}

export async function saveChat({
  id,
  userId,
  title,
}: {
  id: string;
  userId: string;
  title: string;
}) {
  try {
    return await db.insert(chat).values({
      id,
      createdAt: new Date(),
      userId,
      title,
    });
  } catch (error) {
    console.error('Failed to save chat in database');
    throw error;
  }
}

export async function deleteChatById({ id }: { id: string }) {
  try {
    await db.delete(vote).where(eq(vote.chatId, id));
    await db.delete(message).where(eq(message.chatId, id));

    return await db.delete(chat).where(eq(chat.id, id));
  } catch (error) {
    console.error('Failed to delete chat by id from database');
    throw error;
  }
}

export async function getChatsByUserId({ id }: { id: string }) {
  try {
    return await db
      .select()
      .from(chat)
      .where(eq(chat.userId, id))
      .orderBy(desc(chat.createdAt));
  } catch (error) {
    console.error('Failed to get chats by user from database');
    throw error;
  }
}

export async function getChatById({ id }: { id: string }) {
  try {
    const [selectedChat] = await db.select().from(chat).where(eq(chat.id, id));
    return selectedChat;
  } catch (error) {
    console.error('Failed to get chat by id from database');
    throw error;
  }
}

export async function saveMessages({ messages }: { messages: Array<Message> }) {
  try {
    return await db.insert(message).values(messages);
  } catch (error) {
    console.error('Failed to save messages in database', error);
    throw error;
  }
}

export async function getMessagesByChatId({ id }: { id: string }) {
  try {
    return await db
      .select()
      .from(message)
      .where(eq(message.chatId, id))
      .orderBy(asc(message.createdAt));
  } catch (error) {
    console.error('Failed to get messages by chat id from database', error);
    throw error;
  }
}

export async function voteMessage({
  chatId,
  messageId,
  type,
}: {
  chatId: string;
  messageId: string;
  type: 'up' | 'down';
}) {
  try {
    const [existingVote] = await db
      .select()
      .from(vote)
      .where(and(eq(vote.messageId, messageId)));

    if (existingVote) {
      return await db
        .update(vote)
        .set({ isUpvoted: type === 'up' })
        .where(and(eq(vote.messageId, messageId), eq(vote.chatId, chatId)));
    }
    return await db.insert(vote).values({
      chatId,
      messageId,
      isUpvoted: type === 'up',
    });
  } catch (error) {
    console.error('Failed to upvote message in database', error);
    throw error;
  }
}

export async function getVotesByChatId({ id }: { id: string }) {
  try {
    return await db.select().from(vote).where(eq(vote.chatId, id));
  } catch (error) {
    console.error('Failed to get votes by chat id from database', error);
    throw error;
  }
}

export async function saveDocument({
  id,
  title,
  kind,
  content,
  userId,
}: {
  id: string;
  title: string;
  kind: BlockKind;
  content: string;
  userId: string;
}) {
  try {
    return await db.insert(document).values({
      id,
      title,
      kind,
      content,
      userId,
      createdAt: new Date(),
    });
  } catch (error) {
    console.error('Failed to save document in database');
    throw error;
  }
}

export async function getDocumentsById({ id }: { id: string }) {
  try {
    const documents = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(asc(document.createdAt));

    return documents;
  } catch (error) {
    console.error('Failed to get document by id from database');
    throw error;
  }
}

export async function getDocumentById({ id }: { id: string }) {
  try {
    const [selectedDocument] = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(desc(document.createdAt));

    return selectedDocument;
  } catch (error) {
    console.error('Failed to get document by id from database');
    throw error;
  }
}

export async function deleteDocumentsByIdAfterTimestamp({
  id,
  timestamp,
}: {
  id: string;
  timestamp: Date;
}) {
  try {
    await db
      .delete(suggestion)
      .where(
        and(
          eq(suggestion.documentId, id),
          gt(suggestion.documentCreatedAt, timestamp),
        ),
      );

    return await db
      .delete(document)
      .where(and(eq(document.id, id), gt(document.createdAt, timestamp)));
  } catch (error) {
    console.error(
      'Failed to delete documents by id after timestamp from database',
    );
    throw error;
  }
}

export async function saveSuggestions({
  suggestions,
}: {
  suggestions: Array<Suggestion>;
}) {
  try {
    return await db.insert(suggestion).values(suggestions);
  } catch (error) {
    console.error('Failed to save suggestions in database');
    throw error;
  }
}

export async function getSuggestionsByDocumentId({
  documentId,
}: {
  documentId: string;
}) {
  try {
    return await db
      .select()
      .from(suggestion)
      .where(and(eq(suggestion.documentId, documentId)));
  } catch (error) {
    console.error(
      'Failed to get suggestions by document version from database',
    );
    throw error;
  }
}

export async function getMessageById({ id }: { id: string }) {
  try {
    return await db.select().from(message).where(eq(message.id, id));
  } catch (error) {
    console.error('Failed to get message by id from database');
    throw error;
  }
}

export async function deleteMessagesByChatIdAfterTimestamp({
  chatId,
  timestamp,
}: {
  chatId: string;
  timestamp: Date;
}) {
  try {
    return await db
      .delete(message)
      .where(
        and(eq(message.chatId, chatId), gte(message.createdAt, timestamp)),
      );
  } catch (error) {
    console.error(
      'Failed to delete messages by id after timestamp from database',
    );
    throw error;
  }
}

export async function updateChatVisiblityById({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: 'private' | 'public';
}) {
  try {
    return await db.update(chat).set({ visibility }).where(eq(chat.id, chatId));
  } catch (error) {
    console.error('Failed to update chat visibility in database');
    throw error;
  }
}
