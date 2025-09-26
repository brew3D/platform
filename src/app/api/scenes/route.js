import { NextResponse } from "next/server";
import { GetCommand, PutCommand, QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { getDynamoDocClient, getScenesTableName } from "@/app/lib/dynamodb";
import { listScenesForUser, putScene } from "@/app/lib/demoScenes";

// List scenes for a user, and create new scene

export async function GET(request) {
  try {
    const userId = (await request.headers.get("x-user-id")) || "demo_user";
    try {
      const doc = getDynamoDocClient();
      const TableName = getScenesTableName();
      const result = await doc.send(new QueryCommand({
        TableName,
        IndexName: process.env.DDB_SCENES_USER_INDEX || "email-index",
        KeyConditionExpression: "user_id = :u",
        ExpressionAttributeValues: { ":u": userId },
      }));
      return NextResponse.json({ scenes: result.Items || [] });
    } catch (ddbErr) {
      // Fallback to in-memory
      const scenes = listScenesForUser(userId);
      return NextResponse.json({ scenes });
    }
  } catch (err) {
    console.error("List scenes error", err);
    return NextResponse.json({ error: "Failed to list scenes" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const userId = (await request.headers.get("x-user-id")) || "demo_user";
    const sceneId = body.id || `scene_${Date.now()}`;
    const now = new Date().toISOString();
    const item = {
      id: sceneId,
      user_id: userId,
      name: body.name || "Untitled Scene",
      objects: body.objects || [],
      groups: body.groups || [],
      created_at: now,
      updated_at: now,
    };

    try {
      const doc = getDynamoDocClient();
      const TableName = getScenesTableName();
      await doc.send(new PutCommand({ TableName, Item: item }));
      return NextResponse.json({ scene: item }, { status: 201 });
    } catch (ddbErr) {
      // Fallback to in-memory
      putScene(item);
      return NextResponse.json({ scene: item }, { status: 201 });
    }
  } catch (err) {
    console.error("Create scene error", err);
    return NextResponse.json({ error: "Failed to create scene" }, { status: 500 });
  }
}


