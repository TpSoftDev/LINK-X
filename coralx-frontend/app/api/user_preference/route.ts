import { NextResponse } from "next/server";
import { Pool } from "pg";

// Initialize NeonDB connection
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL, // Ensure this is set in your .env file
});

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { name, job, traits, learningStyle, depth, topics, interests, schedule, quizzes } = data;

    // if (!user_id) {
    //   return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    // }

    const client = await pool.connect();
    try {
      await client.query(
        `
        INSERT INTO user_preference (name, job, traits, learning_style, depth, topics, interests, schedule, quizzes)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        SET name = EXCLUDED.name,
            job = EXCLUDED.job,
            traits = EXCLUDED.traits,
            learning_style = EXCLUDED.learning_style,
            depth = EXCLUDED.depth,
            topics = EXCLUDED.topics,
            interests = EXCLUDED.interests,
            schedule = EXCLUDED.schedule,
            quizzes = EXCLUDED.quizzes;
        `,
        [name, job, traits, learningStyle, depth, topics, interests, schedule, quizzes]
      );

      return NextResponse.json({ success: true });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error saving preferences:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
