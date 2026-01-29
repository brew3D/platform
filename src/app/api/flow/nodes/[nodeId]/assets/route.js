"use server";

import { NextResponse } from "next/server";
import {
  getAssetsForFlowNode,
  linkAssetToFlowNode,
  unlinkAssetFromFlowNode,
} from "@/app/lib/supabase-operations";

// GET /api/flow/nodes/[nodeId]/assets
export async function GET(request, { params }) {
  const nodeId = params?.nodeId;

  if (!nodeId) {
    return NextResponse.json(
      { success: false, message: "Missing node id" },
      { status: 400 }
    );
  }

  try {
    const assets = await getAssetsForFlowNode(nodeId);
    return NextResponse.json(
      { success: true, assets },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching assets for flow node:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load assets", error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/flow/nodes/[nodeId]/assets
export async function POST(request, { params }) {
  const nodeId = params?.nodeId;

  if (!nodeId) {
    return NextResponse.json(
      { success: false, message: "Missing node id" },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();
    const { projectAssetId } = body || {};

    if (!projectAssetId) {
      return NextResponse.json(
        { success: false, message: "Missing projectAssetId" },
        { status: 400 }
      );
    }

    const result = await linkAssetToFlowNode(nodeId, projectAssetId);
    return NextResponse.json(
      { success: true, link: result.link },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error linking asset to flow node:", error);
    return NextResponse.json(
      { success: false, message: "Failed to link asset", error: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/flow/nodes/[nodeId]/assets
export async function DELETE(request, { params }) {
  const nodeId = params?.nodeId;

  if (!nodeId) {
    return NextResponse.json(
      { success: false, message: "Missing node id" },
      { status: 400 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const projectAssetId = searchParams.get("projectAssetId");

    if (!projectAssetId) {
      return NextResponse.json(
        { success: false, message: "Missing projectAssetId query param" },
        { status: 400 }
      );
    }

    const result = await unlinkAssetFromFlowNode(nodeId, projectAssetId);
    return NextResponse.json(
      { success: true },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error unlinking asset from flow node:", error);
    return NextResponse.json(
      { success: false, message: "Failed to unlink asset", error: error.message },
      { status: 500 }
    );
  }
}
