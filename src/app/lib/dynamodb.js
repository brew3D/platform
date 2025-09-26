import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

let cachedDocClient = null;

export function getDynamoDocClient() {
  if (cachedDocClient) return cachedDocClient;

  const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-east-1";

  const client = new DynamoDBClient({
    region,
    credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY ? {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      sessionToken: process.env.AWS_SESSION_TOKEN,
    } : undefined,
  });

  cachedDocClient = DynamoDBDocumentClient.from(client, {
    marshallOptions: { removeUndefinedValues: true },
  });

  return cachedDocClient;
}

export function getScenesTableName() {
  // Use scenes-specific environment variable or default
  return process.env.DDB_SCENES_TABLE || "ruchi-ai-scenes";
}


