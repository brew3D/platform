"use server";

import { NextResponse } from "next/server";
import {
  getProjectSnapshots,
  createProjectSnapshot,
  getProjectSnapshot,
} from "@/app/lib/supabase-operations";
import { getFlowWithNodesAndEdges } from "@/app/lib/supabase-operations";
import { getProjectFlows } from "@/app/lib/supabase-operations";
import { getProjectAssets } from "@/app/lib/supabase-operations";

// GET /api/projects/[id]/snapshots
export async function GET(request, { params }) {
  const projectId = params?.id;

  if (!projectId) {
    return NextResponse.json(
      { success: false, message: "Missing project id" },
      { status: 400 }
    );
  }

  try {
    const snapshots = await getProjectSnapshots(projectId);
    return NextResponse.json(
      { success: true, snapshots },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching snapshots:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load snapshots", error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/projects/[id]/snapshots
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
    const { label, commitSha = "" } = body || {};

    if (!label) {
      return NextResponse.json(
        { success: false, message: "Missing required field: label" },
        { status: 400 }
      );
    }

    // Capture current state of Flow, Assets, etc. as snapshot_data
    const flows = await getProjectFlows(projectId);
    let flowData = null;
    if (flows && flows.length > 0) {
      const flow = flows[0];
      flowData = await getFlowWithNodesAndEdges(flow.flowId || flow.flow_id);
    }

    const assets = await getProjectAssets(projectId);

    const snapshotData = {
      flow: flowData
        ? {
            nodes: (flowData.nodes || []).map((n) => ({
              id: n.nodeId || n.node_id,
              label: n.label,
              type: n.nodeType || n.node_type,
            })),
            edges: (flowData.edges || []).map((e) => ({
              id: e.edgeId || e.edge_id,
              from: e.fromNodeId || e.from_node_id,
              to: e.toNodeId || e.to_node_id,
            })),
            startpoint: flowData.startpoint?.startNodeId || flowData.startpoint?.start_node_id || null,
          }
        : null,
      assets: assets.map((a) => ({
        id: a.projectAssetId || a.project_asset_id,
        name: a.name,
        type: a.type,
      })),
    };

    const result = await createProjectSnapshot({
      projectId,
      label,
      commitSha,
      snapshotData,
    });

    return NextResponse.json(
      { success: true, snapshot: result.snapshot },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error creating snapshot:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create snapshot", error: error.message },
      { status: 500 }
    );
  }
}
