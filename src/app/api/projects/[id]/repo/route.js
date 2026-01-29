"use server";

import { NextResponse } from "next/server";
import { getProjectById, updateProject } from "@/app/lib/supabase-operations";

// GET /api/projects/[id]/repo
export async function GET(request, { params }) {
  const projectId = params?.id;

  if (!projectId) {
    return NextResponse.json(
      { success: false, message: "Missing project id" },
      { status: 400 }
    );
  }

  try {
    const project = await getProjectById(projectId);
    if (!project) {
      return NextResponse.json(
        { success: false, message: "Project not found" },
        { status: 404 }
      );
    }

    const repoConfig = {
      repoUrl: project.repoUrl || "",
      defaultBranch: project.defaultBranch || "main",
      engineType: project.engineType || "unreal",
    };

    return NextResponse.json(
      { success: true, repo: repoConfig },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error getting repo config:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load repo config", error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/projects/[id]/repo
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
    const { repoUrl = "", defaultBranch = "main", engineType } = body || {};

    const updates = {
      repoUrl,
      defaultBranch,
    };

    if (engineType) {
      updates.engineType = engineType;
    }

    const result = await updateProject(projectId, updates);

    return NextResponse.json(
      { success: true, project: result.project },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error saving repo config:", error);
    return NextResponse.json(
      { success: false, message: "Failed to save repo config", error: error.message },
      { status: 500 }
    );
  }
}

