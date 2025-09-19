import { NextResponse } from "next/server";
import { GetCommand, UpdateCommand, DeleteCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { getDynamoDocClient, getScenesTableName } from "@/app/lib/dynamodb";
import { getScene, putScene, deleteScene } from "@/app/lib/demoScenes";

export async function GET(_request, ctx) {
  try {
    const { id } = await ctx.params;
    try {
      const doc = getDynamoDocClient();
      const TableName = getScenesTableName();
      const res = await doc.send(new GetCommand({ TableName, Key: { id } }));
      if (!res.Item) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      return NextResponse.json({ scene: res.Item });
    } catch (ddbErr) {
      const sc = getScene(id);
      if (!sc) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json({ scene: sc });
    }
  } catch (err) {
    console.error("Get scene error", err);
    return NextResponse.json({ error: "Failed to get scene" }, { status: 500 });
  }
}

export async function PUT(request, ctx) {
  try {
    const { id } = await ctx.params;
    const body = await request.json();
    const now = new Date().toISOString();
    try {
      const doc = getDynamoDocClient();
      const TableName = getScenesTableName();
      const res = await doc.send(new UpdateCommand({
        TableName,
        Key: { id },
        UpdateExpression: "SET #n = :n, objects = :o, groups = :g, updated_at = :u",
        ExpressionAttributeNames: { "#n": "name" },
        ExpressionAttributeValues: {
          ":n": body.name || "Untitled Scene",
          ":o": body.objects || [],
          ":g": body.groups || [],
          ":u": now,
        },
        ReturnValues: "ALL_NEW",
      }));
      return NextResponse.json({ scene: res.Attributes });
    } catch (ddbErr) {
      // Fallback: upsert into memory
      const existing = getScene(id) || { id, user_id: "demo_user", name: body.name || "Untitled Scene", created_at: now };
      const merged = { ...existing, objects: body.objects || [], groups: body.groups || [], name: body.name || existing.name, updated_at: now };
      putScene(merged);
      return NextResponse.json({ scene: merged });
    }
  } catch (err) {
    console.error("Update scene error", err);
    return NextResponse.json({ error: "Failed to update scene" }, { status: 500 });
  }
}

export async function DELETE(_request, { params }) {
  try {
    const { id } = params;
    try {
      const doc = getDynamoDocClient();
      const TableName = getScenesTableName();
      await doc.send(new DeleteCommand({ TableName, Key: { id } }));
      return NextResponse.json({ ok: true });
    } catch (ddbErr) {
      deleteScene(id);
      return NextResponse.json({ ok: true });
    }
  } catch (err) {
    console.error("Delete scene error", err);
    return NextResponse.json({ error: "Failed to delete scene" }, { status: 500 });
  }
}


