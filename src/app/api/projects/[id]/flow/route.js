"use server";

import { NextResponse } from "next/server";
import {
  createFlow,
  getProjectFlows,
  getFlowWithNodesAndEdges,
  upsertFlowNodesAndEdges,
} from "@/app/lib/supabase-operations";

// GET /api/projects/[id]/flow
// Returns the primary flow for a project with nodes, edges, and startpoint.
export async function GET(request, { params }) {
  const projectId = params?.id;

  if (!projectId) {
    return NextResponse.json(
      { success: false, message: "Missing project id" },
      { status: 400 }
    );
  }

  try {
    const flows = await getProjectFlows(projectId);
    let flow;

    if (!flows || flows.length === 0) {
      const created = await createFlow(projectId, { name: "Main Flow" });
      flow = created.flow;
    } else {
      // Use the earliest created flow as the primary one
      flow = flows[0];
    }

    const fullFlow = await getFlowWithNodesAndEdges(flow.flowId || flow.flow_id);

    return NextResponse.json(
      {
        success: true,
        flowId: fullFlow.flow.flowId,
        flow: fullFlow.flow,
        nodes: fullFlow.nodes,
        edges: fullFlow.edges,
        startpoint: fullFlow.startpoint,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching project flow:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load flow", error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/projects/[id]/flow
// Upserts nodes, edges, and startpoint for the project's primary flow.
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
    const { nodes = [], edges = [], startNodeId = null } = body || {};

    const flows = await getProjectFlows(projectId);
    let flow;

    if (!flows || flows.length === 0) {
      const created = await createFlow(projectId, { name: "Main Flow" });
      flow = created.flow;
    } else {
      flow = flows[0];
    }

    const flowId = flow.flowId || flow.flow_id;

    await upsertFlowNodesAndEdges(flowId, projectId, {
      nodes,
      edges,
      startNodeId,
    });

    return NextResponse.json(
      { success: true, flowId },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error saving project flow:", error);
    return NextResponse.json(
      { success: false, message: "Failed to save flow", error: error.message },
      { status: 500 }
    );
  }
}

