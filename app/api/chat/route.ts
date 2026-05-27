import { NextResponse } from "next/server";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = process.env.GROQ_MODEL || "llama-3.1-8b-instant";

type ChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GROQ_API_KEY || process.env.NEXT_PUBLIC_GROQ_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "Missing API key. Set GROQ_API_KEY in .env.local and restart the dev server.",
        },
        { status: 500 }
      );
    }

    const body = await request.json();
    const messages = (body?.messages || []) as ChatMessage[];

    const startedAt = Date.now();
    const groqResponse = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
      }),
    });

    const responseTimeMs = Date.now() - startedAt;
    const data = await groqResponse.json().catch(() => ({}));

    if (!groqResponse.ok) {
      return NextResponse.json(
        {
          error: data?.error?.message || "Groq request failed",
          status: groqResponse.status,
        },
        { status: groqResponse.status }
      );
    }

    return NextResponse.json({ ...data, responseTimeMs });
  } catch {
    return NextResponse.json(
      { error: "Unexpected server error while contacting Groq." },
      { status: 500 }
    );
  }
}
