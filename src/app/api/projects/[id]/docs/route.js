"use server";

import { NextResponse } from "next/server";
import {
  getProjectDocs,
  createProjectDoc,
  updateProjectDoc,
  deleteProjectDoc,
} from "@/app/lib/supabase-operations";

// GET /api/projects/[id]/docs
export async function GET(request, { params }) {
  const projectId = params?.id;

  if (!projectId) {
    return NextResponse.json(
      { success: false, message: "Missing project id" },
      { status: 400 }
    );
  }

  try {
    const docs = await getProjectDocs(projectId);
    return NextResponse.json(
      { success: true, docs },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching project docs:", error);
    console.error("Error details:", JSON.stringify(error, null, 2));
    
    // Check if it's a column error (migration not run)
    if (error.message?.includes('column') && error.message?.includes('does not exist')) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Database schema not updated. Please run docs-schema-update.sql in Supabase.",
          error: error.message,
          instructions: "Run the SQL migration: src/app/lib/docs-schema-update.sql"
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false, 
        message: "Failed to load docs", 
        error: error.message,
        details: process.env.NODE_ENV === 'development' ? error.toString() : undefined
      },
      { status: 500 }
    );
  }
}

// POST /api/projects/[id]/docs
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
    const { title, content = "", links = {} } = body || {};

    if (!title) {
      return NextResponse.json(
        { success: false, message: "Missing required field: title" },
        { status: 400 }
      );
    }

    const result = await createProjectDoc({
      projectId,
      title,
      content,
      links,
    });

    return NextResponse.json(
      { success: true, doc: result.doc },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error creating project doc:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create doc", error: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/projects/[id]/docs
export async function PUT(request, { params }) {
  const projectId = params?.id;

  if (!projectId) {
    return NextResponse.json(
      { success: false, message: "Missing project id" },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();
    const { docId, title, content, links } = body || {};

    if (!docId) {
      return NextResponse.json(
        { success: false, message: "Missing docId" },
        { status: 400 }
      );
    }

    const updates = {};
    if (title !== undefined) updates.title = title;
    if (content !== undefined) updates.content = content;
    if (links !== undefined) updates.links = links;

    const result = await updateProjectDoc(docId, updates);

    return NextResponse.json(
      { success: true, doc: result.doc },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating project doc:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update doc", error: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[id]/docs
export async function DELETE(request, { params }) {
  const projectId = params?.id;

  if (!projectId) {
    return NextResponse.json(
      { success: false, message: "Missing project id" },
      { status: 400 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const docId = searchParams.get("docId");

    if (!docId) {
      return NextResponse.json(
        { success: false, message: "Missing docId query param" },
        { status: 400 }
      );
    }

    const result = await deleteProjectDoc(docId);
    return NextResponse.json(
      { success: true },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting project doc:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete doc", error: error.message },
      { status: 500 }
    );
  }
}
