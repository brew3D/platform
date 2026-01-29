"use server";

import { NextResponse } from "next/server";
import { getProjectById } from "@/app/lib/supabase-operations";
import { createEnginePreview, getProjectPreviews, updateEnginePreview } from "@/app/lib/supabase-operations";
import { generateId } from "@/app/lib/dynamodb-schema";

// GET /api/projects/[id]/preview
export async function GET(request, { params }) {
  const projectId = params?.id;

  if (!projectId) {
    return NextResponse.json(
      { success: false, message: "Missing project id" },
      { status: 400 }
    );
  }

  try {
    const previews = await getProjectPreviews(projectId);
    return NextResponse.json(
      { success: true, previews },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching previews:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load previews", error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/projects/[id]/preview
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
    const { branchOrSha = "", engineType } = body || {};

    const project = await getProjectById(projectId);
    if (!project) {
      return NextResponse.json(
        { success: false, message: "Project not found" },
        { status: 404 }
      );
    }

    const finalEngineType = engineType || project.engineType || "unreal";
    const commitSha = branchOrSha || project.defaultBranch || "main";

    // Create preview request (stub - returns fake stream URL)
    const result = await createEnginePreview({
      projectId,
      engineType: finalEngineType,
      commitSha,
      logs: { message: "Preview request queued (stub)" },
    });

    const previewId = result.preview.previewId || result.preview.preview_id;

    // Stub: immediately mark as completed with fake stream URL
    await updateEnginePreview(previewId, {
      status: "completed",
      streamUrl: `https://placeholder.brew3d/preview/${previewId}`,
      logs: {
        message: "Preview completed (stub)",
        note: "This is a placeholder. Real engine preview will stream from cloud VM.",
      },
    });

    const updatedPreview = await getProjectPreviews(projectId);
    const latest = updatedPreview.find((p) => (p.previewId || p.preview_id) === previewId);

    return NextResponse.json(
      {
        success: true,
        previewId,
        preview: latest,
        streamUrl: latest?.streamUrl || latest?.stream_url || `https://placeholder.brew3d/preview/${previewId}`,
        status: latest?.status || "completed",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error creating preview:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create preview", error: error.message },
      { status: 500 }
    );
  }
}
