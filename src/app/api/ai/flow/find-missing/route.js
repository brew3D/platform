"use server";

import { NextResponse } from "next/server";
import { getProjectFlows, getFlowWithNodesAndEdges } from "@/app/lib/supabase-operations";

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
        if (inCount === 0) noIncoming.push(n);
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

    return NextResponse.json(
      {
        success: true,
        issues,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error finding missing steps in flow:", error);
    return NextResponse.json(
      { success: false, message: "Failed to analyze flow", error: error.message },
      { status: 500 }
    );
  }
}

