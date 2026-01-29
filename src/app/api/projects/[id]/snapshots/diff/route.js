"use server";

import { NextResponse } from "next/server";
import { getProjectSnapshot } from "@/app/lib/supabase-operations";
import { generateText } from "@/app/lib/gemini";

export async function POST(request, { params }) {
  const projectId = params?.id;

  if (!projectId) {
    return NextResponse.json(
      { success: false, message: "Missing project id" },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();
    const { snapshotA, snapshotB } = body || {};

    if (!snapshotA || !snapshotB) {
      return NextResponse.json(
        { success: false, message: "Missing snapshotA or snapshotB" },
        { status: 400 }
      );
    }

    const snapA = await getProjectSnapshot(snapshotA);
    const snapB = await getProjectSnapshot(snapshotB);

    if (!snapA || !snapB) {
      return NextResponse.json(
        { success: false, message: "One or both snapshots not found" },
        { status: 404 }
      );
    }

    // Compute structural diff
    const flowA = snapA.snapshotData?.flow || null;
    const flowB = snapB.snapshotData?.flow || null;
    const assetsA = snapA.snapshotData?.assets || [];
    const assetsB = snapB.snapshotData?.assets || [];

    const flowNodesA = flowA?.nodes || [];
    const flowNodesB = flowB?.nodes || [];
    const flowEdgesA = flowA?.edges || [];
    const flowEdgesB = flowB?.edges || [];

    const addedNodes = flowNodesB.filter(
      (nb) => !flowNodesA.find((na) => na.id === nb.id)
    );
    const removedNodes = flowNodesA.filter(
      (na) => !flowNodesB.find((nb) => nb.id === na.id)
    );
    const addedEdges = flowEdgesB.filter(
      (eb) => !flowEdgesA.find((ea) => ea.id === eb.id)
    );
    const removedEdges = flowEdgesA.filter(
      (ea) => !flowEdgesB.find((eb) => eb.id === ea.id)
    );

    const addedAssets = assetsB.filter(
      (ab) => !assetsA.find((aa) => aa.id === ab.id)
    );
    const removedAssets = assetsA.filter(
      (aa) => !assetsB.find((ab) => ab.id === aa.id)
    );

    const systemPrompt = `
You are Mug, the AI assistant for Brew3D.
You are summarizing changes between two project snapshots.
Be concise and highlight the most important changes.
`;

    const prompt = `
Summarize the changes from Snapshot A ("${snapA.label}") to Snapshot B ("${snapB.label}"):

Flow Changes:
- Added nodes: ${addedNodes.map((n) => n.label).join(", ") || "none"}
- Removed nodes: ${removedNodes.map((n) => n.label).join(", ") || "none"}
- Added edges: ${addedEdges.length}
- Removed edges: ${removedEdges.length}

Asset Changes:
- Added assets: ${addedAssets.map((a) => a.name).join(", ") || "none"}
- Removed assets: ${removedAssets.map((a) => a.name).join(", ") || "none"}

Provide a clear, concise summary of what changed (under 200 words).
`;

    const summary = await generateText(prompt, systemPrompt, {
      model: "gemini-pro",
    });

    return NextResponse.json(
      {
        success: true,
        summary: summary.trim(),
        diff: {
          flow: {
            addedNodes,
            removedNodes,
            addedEdges,
            removedEdges,
          },
          assets: {
            added: addedAssets,
            removed: removedAssets,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error computing snapshot diff:", error);
    return NextResponse.json(
      { success: false, message: "Failed to compute diff", error: error.message },
      { status: 500 }
    );
  }
}
