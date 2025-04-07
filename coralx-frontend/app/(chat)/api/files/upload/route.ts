import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { z } from "zod";
import { adminAuth } from "@/lib/server/firebaseAdmin";

const FileSchema = z.object({
  file: z
    .instanceof(Blob)
    .refine((file) => file.size <= 5 * 1024 * 1024, {
      message: "File size should be less than 5MB",
    })
    .refine((file) => ["image/jpeg", "image/png"].includes(file.type), {
      message: "File type should be JPEG or PNG",
    }),
});

export async function POST(request: Request) {
  const cookieHeader = request.headers.get("cookie") || "";
  const sessionCookie = parseCookie("session", cookieHeader);

  if (!sessionCookie) {
    return NextResponse.json({ error: "Missing session cookie" }, { status: 401 });
  }

  try {
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);

    if (request.body === null) {
      return new Response("Request body is empty", { status: 400 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as Blob;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const validatedFile = FileSchema.safeParse({ file });
    if (!validatedFile.success) {
      const errorMessage = validatedFile.error.errors.map((err) => err.message).join(", ");
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    const filename = (formData.get("file") as File).name;
    const fileBuffer = await file.arrayBuffer();

    try {
      const data = await put(filename, fileBuffer, {
        access: "public",
      });
      return NextResponse.json(data);
    } catch (uploadError) {
      return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }
  } catch (verifyError) {
    return NextResponse.json({ error: "Invalid or expired session cookie" }, { status: 401 });
  }
}

function parseCookie(name: string, cookieHeader: string) {
  const cookieString = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${name}=`));
  return cookieString?.split("=")[1] ?? "";
}
