"use server";

import { NextResponse } from "next/server";
import { getProjectById } from "@/app/lib/supabase-operations";

// Stubbed connectivity check - does not actually contact the repo yet.
export async function POST(request, { params }) {
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

    const repoUrl = project.repoUrl || "";
    const defaultBranch = project.defaultBranch || "main";

    if (!repoUrl) {
      return NextResponse.json(
        {
          success: false,
          status: "failed",
          message: "No repo URL configured",
        },
        { status: 200 }
      );
    }

    // Stub: pretend the repo and branch are reachable.
    return NextResponse.json(
      {
        success: true,
        status: "connected",
        repoUrl,
        defaultBranch,
        branches: [defaultBranch],
        message: "Connectivity check is stubbed and always succeeds for now.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error checking repo connectivity:", error);
    return NextResponse.json(
      {
        success: false,
        status: "failed",
        message: "Failed to check repo connectivity",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

