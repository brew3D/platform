"use server";

import { NextResponse } from "next/server";
import { getProjectFlows, getFlowWithNodesAndEdges } from "@/app/lib/supabase-operations";
import { generateText } from "@/app/lib/gemini";

export async function POST(request) {
  try {
    const body = await request.json();
    const { projectId } = body || {};

    if (!projectId) {
      return NextResponse.json(
        { success: false, message: "Missing projectId" },
        { status: 400 }
      );
    }

    const flows = await getProjectFlows(projectId);
    if (!flows || flows.length === 0) {
      return NextResponse.json(
        { success: false, message: "No flow defined for this project" },
        { status: 404 }
      );
    }

    const flow = flows[0];
    const fullFlow = await getFlowWithNodesAndEdges(flow.flowId || flow.flow_id);

    const nodes = fullFlow.nodes || [];
    const edges = fullFlow.edges || [];
    const startpoint = fullFlow.startpoint || null;

    const systemPrompt = `
You are Mug, the AI assistant for Brew3D, a game infra and control tower.
You receive a game Flow graph:
- Nodes represent conceptual game states (levels, menus, loading screens, etc.).
- Edges represent transitions between these states.
Your job is to clearly explain the player journey and how the game flows, in concise, human-readable language.
`;

    const prompt = `
Project ID: ${projectId}
Flow name: ${fullFlow.flow.name}

Start node ID: ${startpoint?.startNodeId || startpoint?.start_node_id || "none"}

Nodes:
${nodes
  .map(
    (n) =>
      `- ${n.nodeId || n.node_id}: label="${n.label}", type="${n.nodeType || n.node_type}", engineLevel="${n.engineLevelName || n.engine_level_name || ""}", unityScene="${n.unitySceneName || n.unity_scene_name || ""}"`
  )
  .join("\n")}

Edges:
${edges
  .map(
    (e) =>
      `- ${e.edgeId || e.edge_id}: from=${e.fromNodeId || e.from_node_id} -> to=${e.toNodeId || e.to_node_id}`
  )
  .join("\n")}

Please explain:
1) Where the player starts and the high-level journey.
2) The main branches or alternate paths.
3) Any obvious gaps (nodes with no incoming/outgoing edges).
Keep it under 400 words, bullet points are fine.
`;

    const explanation = await generateText(prompt, systemPrompt, {
      model: "gemini-pro",
    });

    return NextResponse.json(
      {
        success: true,
        explanation: explanation.trim(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error explaining flow:", error);
    return NextResponse.json(
      { success: false, message: "Failed to explain flow", error: error.message },
      { status: 500 }
    );
  }
}

