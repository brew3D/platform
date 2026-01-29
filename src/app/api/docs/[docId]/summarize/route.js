"use server";

import { NextResponse } from "next/server";
import { getProjectDoc } from "@/app/lib/supabase-operations";
import { generateText } from "@/app/lib/gemini";

export async function POST(request, { params }) {
  const docId = params?.docId;

  if (!docId) {
    return NextResponse.json(
      { success: false, message: "Missing docId" },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();
    const { nodeId, assetId, scriptId } = body || {};

    const doc = await getProjectDoc(docId);
    if (!doc) {
      return NextResponse.json(
        { success: false, message: "Doc not found" },
        { status: 404 }
      );
    }

    const systemPrompt = `
You are Mug, the AI assistant for Brew3D.
You are summarizing a project documentation page in the context of the game project.
Be concise and highlight key points.
`;

    let contextPrompt = `Summarize this documentation:\n\nTitle: ${doc.title}\n\nContent:\n${doc.content}\n\n`;

    if (nodeId) {
      contextPrompt += `\nContext: This doc is linked to Flow node ${nodeId}.`;
    }
    if (assetId) {
      contextPrompt += `\nContext: This doc is linked to asset ${assetId}.`;
    }
    if (scriptId) {
      contextPrompt += `\nContext: This doc is linked to script ${scriptId}.`;
    }

    const summary = await generateText(contextPrompt, systemPrompt, {
      model: "gemini-pro",
    });

    return NextResponse.json(
      {
        success: true,
        summary: summary.trim(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error summarizing doc:", error);
    return NextResponse.json(
      { success: false, message: "Failed to summarize doc", error: error.message },
      { status: 500 }
    );
  }
}
