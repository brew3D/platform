"use server";

import { NextResponse } from "next/server";
import { getProjectFlows, getFlowWithNodesAndEdges } from "@/app/lib/supabase-operations";
import { getProjectAssets } from "@/app/lib/supabase-operations";
import { generateText } from "@/app/lib/gemini";

export async function POST(request, { params }) {
  const projectId = params?.projectId;

  if (!projectId) {
    return NextResponse.json(
      { success: false, message: "Missing projectId" },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();
    const { messages = [], action, payload = {} } = body || {};

    // Load project context
    const flows = await getProjectFlows(projectId);
    let flowContext = null;
    if (flows && flows.length > 0) {
      const flow = flows[0];
      flowContext = await getFlowWithNodesAndEdges(flow.flowId || flow.flow_id);
    }

    const assets = await getProjectAssets(projectId);

    // Build system prompt with context
    const systemPrompt = `
You are Mug, the AI assistant for Brew3D, a cloud-based infrastructure and AI control tower for game development.
Brew3D orchestrates real Unreal/Unity projects, tracks Flow (game state graphs), manages assets, and provides AI insights.

Current project context:
- Project ID: ${projectId}
- Flow nodes: ${flowContext?.nodes?.length || 0}
- Flow edges: ${flowContext?.edges?.length || 0}
- Assets: ${assets?.length || 0}

Your role:
- Explain how the game Flow works
- Identify missing logic or gaps in the Flow
- Explain assets and their usage
- Provide actionable guidance
- Be concise and helpful

Remember: Brew3D is NOT a game engine. It's infrastructure around engine projects.
`;

    // Handle specific actions
    if (action === "explainFlow") {
      if (!flowContext) {
        return NextResponse.json(
          { success: false, message: "No flow defined for this project" },
          { status: 404 }
        );
      }

      const nodes = flowContext.nodes || [];
      const edges = flowContext.edges || [];
      const startpoint = flowContext.startpoint || null;

      const prompt = `
Explain this game Flow:

Start node: ${startpoint?.startNodeId || startpoint?.start_node_id || "none"}

Nodes:
${nodes
  .map(
    (n) =>
      `- ${n.nodeId || n.node_id}: "${n.label}", type=${n.nodeType || n.node_type}, engineLevel="${n.engineLevelName || n.engine_level_name || ""}", unityScene="${n.unitySceneName || n.unity_scene_name || ""}"`
  )
  .join("\n")}

Edges:
${edges
  .map(
    (e) =>
      `- ${e.edgeId || e.edge_id}: ${e.fromNodeId || e.from_node_id} -> ${e.toNodeId || e.to_node_id}`
  )
  .join("\n")}

Provide a clear explanation of the player journey and game flow.
`;

      const explanation = await generateText(prompt, systemPrompt, {
        model: "gemini-pro",
      });

      return NextResponse.json(
        {
          success: true,
          response: explanation.trim(),
          action: "explainFlow",
        },
        { status: 200 }
      );
    }

    if (action === "findMissingSteps") {
      if (!flowContext) {
        return NextResponse.json(
          { success: false, message: "No flow defined for this project" },
          { status: 404 }
        );
      }

      const nodes = flowContext.nodes || [];
      const edges = flowContext.edges || [];
      const startpoint = flowContext.startpoint || null;

      const nodeIds = new Set(nodes.map((n) => n.nodeId || n.node_id));
      const incoming = new Map();
      const outgoing = new Map();

      nodeIds.forEach((id) => {
        incoming.set(id, 0);
        outgoing.set(id, 0);
      });

      edges.forEach((e) => {
        const from = e.fromNodeId || e.from_node_id;
        const to = e.toNodeId || e.to_node_id;
        if (nodeIds.has(from)) {
          outgoing.set(from, (outgoing.get(from) || 0) + 1);
        }
        if (nodeIds.has(to)) {
          incoming.set(to, (incoming.get(to) || 0) + 1);
        }
      });

      const startNodeId = startpoint?.startNodeId || startpoint?.start_node_id || null;

      const deadEnds = [];
      const isolated = [];
      const noIncoming = [];
      const noOutgoing = [];

      nodes.forEach((n) => {
        const id = n.nodeId || n.node_id;
        const inCount = incoming.get(id) || 0;
        const outCount = outgoing.get(id) || 0;

        if (inCount === 0 && outCount === 0) {
          isolated.push(n);
        } else {
          if (inCount === 0 && id !== startNodeId) noIncoming.push(n);
          if (outCount === 0) noOutgoing.push(n);
        }

        if (outCount === 0 && inCount > 0) {
          deadEnds.push(n);
        }
      });

      const issues = {
        hasStartpoint: !!startNodeId,
        startNodeId,
        deadEnds: deadEnds.map((n) => ({ id: n.nodeId || n.node_id, label: n.label })),
        isolated: isolated.map((n) => ({ id: n.nodeId || n.node_id, label: n.label })),
        noIncoming: noIncoming.map((n) => ({ id: n.nodeId || n.node_id, label: n.label })),
        noOutgoing: noOutgoing.map((n) => ({ id: n.nodeId || n.node_id, label: n.label })),
      };

      // Generate AI explanation of issues
      const prompt = `
Analyze these Flow issues and provide actionable suggestions:

Issues found:
- Has startpoint: ${issues.hasStartpoint}
- Dead ends (nodes with no outgoing edges): ${issues.deadEnds.length}
- Isolated nodes (no connections): ${issues.isolated.length}
- Nodes with no incoming edges (except startpoint): ${issues.noIncoming.length}
- Nodes with no outgoing edges: ${issues.noOutgoing.length}

Provide concise suggestions on how to fix these issues.
`;

      const suggestions = await generateText(prompt, systemPrompt, {
        model: "gemini-pro",
      });

      return NextResponse.json(
        {
          success: true,
          response: suggestions.trim(),
          action: "findMissingSteps",
          issues,
        },
        { status: 200 }
      );
    }

    if (action === "explainAsset") {
      const { assetId } = payload;
      if (!assetId) {
        return NextResponse.json(
          { success: false, message: "Missing assetId in payload" },
          { status: 400 }
        );
      }

      const asset = assets.find(
        (a) => a.projectAssetId === assetId || a.project_asset_id === assetId
      );

      if (!asset) {
        return NextResponse.json(
          { success: false, message: "Asset not found" },
          { status: 404 }
        );
      }

      const prompt = `
Explain this asset:

Name: ${asset.name}
Type: ${asset.type}
Source: ${asset.source}
Engine Path: ${asset.enginePath || asset.engine_path || "N/A"}
License: ${asset.license || "N/A"}
Tags: ${(asset.tags || []).join(", ") || "None"}

Explain what this asset is, how it's used, and any relevant context.
`;

      const explanation = await generateText(prompt, systemPrompt, {
        model: "gemini-pro",
      });

      return NextResponse.json(
        {
          success: true,
          response: explanation.trim(),
          action: "explainAsset",
          assetId,
        },
        { status: 200 }
      );
    }

    // General chat
    const lastMessage = messages[messages.length - 1];
    const userPrompt = lastMessage?.content || "";

    const fullPrompt = `
User question: ${userPrompt}

Project context:
- Flow: ${flowContext ? `${flowContext.nodes?.length || 0} nodes, ${flowContext.edges?.length || 0} edges` : "No flow defined"}
- Assets: ${assets.length} assets

Provide a helpful answer based on the project context.
`;

    const response = await generateText(fullPrompt, systemPrompt, {
      model: "gemini-pro",
    });

    return NextResponse.json(
      {
        success: true,
        response: response.trim(),
        action: "chat",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in Mug AI:", error);
    return NextResponse.json(
      { success: false, message: "Failed to process request", error: error.message },
      { status: 500 }
    );
  }
}
