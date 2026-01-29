"use server";

import { NextResponse } from "next/server";
import {
  getProjectAssets,
  getProjectAssetsByType,
  createProjectAsset,
} from "@/app/lib/supabase-operations";

// GET /api/projects/[id]/assets
export async function GET(request, { params }) {
  const projectId = params?.id;

  if (!projectId) {
    return NextResponse.json(
      { success: false, message: "Missing project id" },
      { status: 400 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const license = searchParams.get("license");
    const tag = searchParams.get("tag");

    let assets;
    if (type) {
      assets = await getProjectAssetsByType(projectId, type);
    } else {
      assets = await getProjectAssets(projectId);
    }

    // Filter by license if provided
    if (license) {
      assets = assets.filter((a) => a.license === license);
    }

    // Filter by tag if provided
    if (tag) {
      assets = assets.filter((a) => (a.tags || []).includes(tag));
    }

    return NextResponse.json(
      { success: true, assets },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching project assets:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load assets", error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/projects/[id]/assets
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
    const {
      name,
      type,
      source = "engine",
      enginePath = "",
      license = "",
      tags = [],
      metadata = {},
      assetId = null,
    } = body || {};

    if (!name || !type) {
      return NextResponse.json(
        { success: false, message: "Missing required fields: name, type" },
        { status: 400 }
      );
    }

    const result = await createProjectAsset({
      projectId,
      name,
      type,
      source,
      enginePath,
      license,
      tags,
      metadata,
      assetId,
    });

    return NextResponse.json(
      { success: true, asset: result.asset },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error creating project asset:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create asset", error: error.message },
      { status: 500 }
    );
  }
}
