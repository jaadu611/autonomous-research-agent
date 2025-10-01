import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { question, pdfText } = await req.json();

    if (!question || !pdfText) {
      return NextResponse.json(
        { error: "No question or PDF text provided" },
        { status: 400 }
      );
    }

    // Prompt explicitly asks for the exact snippet
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a helpful research assistant. Answer the question based on the PDF, IMAGE, CSV content.
          Provide your answer in this exact format:
          
          Answer: <your answer>
          Source: <copy the exact snippet(s) from the PDF that support your answer, do NOT just give line numbers>`,
        },
        {
          role: "user",
          content: `Question: ${question}\n\nPDF Content:\n${pdfText}`,
        },
      ],
      max_tokens: 500,
    });

    const rawAnswer =
      response.choices?.[0]?.message?.content || "No answer found";

    // Extract the "Source:" snippet
    const match = rawAnswer.match(/Source:\s*([\s\S]*)$/i);
    const source = match ? match[1].trim() : undefined;
    const answer = rawAnswer.replace(/Source:\s*([\s\S]*)$/i, "").trim();

    return NextResponse.json({ answer, source });
  } catch (err) {
    console.error("ask error:", err);
    return NextResponse.json(
      { error: "Failed to get answer" },
      { status: 500 }
    );
  }
}
