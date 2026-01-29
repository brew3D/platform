"use server";

import { NextResponse } from "next/server";
import { getProjectById } from "@/app/lib/supabase-operations";
import { createBuild, getProjectBuilds, updateBuild } from "@/app/lib/supabase-operations";

// GET /api/projects/[id]/builds
export async function GET(request, { params }) {
  const projectId = params?.id;

  if (!projectId) {
    return NextResponse.json(
      { success: false, message: "Missing project id" },
      { status: 400 }
    );
  }

  try {
    const builds = await getProjectBuilds(projectId);
    return NextResponse.json(
      { success: true, builds },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching builds:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load builds", error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/projects/[id]/builds
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
    const { commitSha = "", engineType, trigger = "manual" } = body || {};

    const project = await getProjectById(projectId);
    if (!project) {
      return NextResponse.json(
        { success: false, message: "Project not found" },
        { status: 404 }
      );
    }

    const finalEngineType = engineType || project.engineType || "unreal";
    const finalCommitSha = commitSha || project.defaultBranch || "main";

    // Create build request (stub - returns fake logs)
    const result = await createBuild({
      projectId,
      engineType: finalEngineType,
      commitSha: finalCommitSha,
      trigger,
      logs: "Build request queued (stub)\n",
    });

    const buildId = result.build.buildId || result.build.build_id;

    // Stub: immediately mark as succeeded with fake logs
    await updateBuild(buildId, {
      status: "succeeded",
      logs: `Build completed successfully (stub)\nEngine: ${finalEngineType}\nCommit: ${finalCommitSha}\n\nThis is a placeholder. Real builds will compile your engine project and produce artifacts.`,
      artifacts: {
        executable: `builds/${buildId}/game.exe`,
        logs: `builds/${buildId}/build.log`,
        note: "Artifacts are placeholders",
      },
    });

    const updatedBuilds = await getProjectBuilds(projectId);
    const latest = updatedBuilds.find((b) => (b.buildId || b.build_id) === buildId);

    return NextResponse.json(
      {
        success: true,
        buildId,
        build: latest,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error creating build:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create build", error: error.message },
      { status: 500 }
    );
  }
}
