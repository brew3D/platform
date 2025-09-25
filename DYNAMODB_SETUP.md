# DynamoDB Integration Setup Guide

## Overview
This guide will help you set up DynamoDB integration for the RuchiAI platform. The application now supports full-stack functionality with user authentication, project management, and data persistence.

## DynamoDB Tables Required

### 1. Existing Tables
- **ruchi-ai-users** (with GSI: email-index)
- **ruchi-ai-scenes** (existing)

### 2. New Tables to Create
You need to create these additional tables in DynamoDB:

#### ruchi-ai-projects
```json
{
  "TableName": "ruchi-ai-projects",
  "KeySchema": [
    {
      "AttributeName": "projectId",
      "KeyType": "HASH"
    }
  ],
  "AttributeDefinitions": [
    {
      "AttributeName": "projectId",
      "AttributeType": "S"
    },
    {
      "AttributeName": "userId",
      "AttributeType": "S"
    }
  ],
  "GlobalSecondaryIndexes": [
    {
      "IndexName": "user-id-index",
      "KeySchema": [
        {
          "AttributeName": "userId",
          "KeyType": "HASH"
        }
      ],
      "Projection": {
        "ProjectionType": "ALL"
      }
    }
  ],
  "BillingMode": "PAY_PER_REQUEST"
}
```

#### ruchi-ai-maps
```json
{
  "TableName": "ruchi-ai-maps",
  "KeySchema": [
    {
      "AttributeName": "mapId",
      "KeyType": "HASH"
    }
  ],
  "AttributeDefinitions": [
    {
      "AttributeName": "mapId",
      "AttributeType": "S"
    },
    {
      "AttributeName": "projectId",
      "AttributeType": "S"
    }
  ],
  "GlobalSecondaryIndexes": [
    {
      "IndexName": "project-id-index",
      "KeySchema": [
        {
          "AttributeName": "projectId",
          "KeyType": "HASH"
        }
      ],
      "Projection": {
        "ProjectionType": "ALL"
      }
    }
  ],
  "BillingMode": "PAY_PER_REQUEST"
}
```

#### ruchi-ai-characters
```json
{
  "TableName": "ruchi-ai-characters",
  "KeySchema": [
    {
      "AttributeName": "characterId",
      "KeyType": "HASH"
    }
  ],
  "AttributeDefinitions": [
    {
      "AttributeName": "characterId",
      "AttributeType": "S"
    },
    {
      "AttributeName": "projectId",
      "AttributeType": "S"
    }
  ],
  "GlobalSecondaryIndexes": [
    {
      "IndexName": "project-id-index",
      "KeySchema": [
        {
          "AttributeName": "projectId",
          "KeyType": "HASH"
        }
      ],
      "Projection": {
        "ProjectionType": "ALL"
      }
    }
  ],
  "BillingMode": "PAY_PER_REQUEST"
}
```

#### ruchi-ai-assets
```json
{
  "TableName": "ruchi-ai-assets",
  "KeySchema": [
    {
      "AttributeName": "assetId",
      "KeyType": "HASH"
    }
  ],
  "AttributeDefinitions": [
    {
      "AttributeName": "assetId",
      "AttributeType": "S"
    },
    {
      "AttributeName": "category",
      "AttributeType": "S"
    }
  ],
  "GlobalSecondaryIndexes": [
    {
      "IndexName": "category-index",
      "KeySchema": [
        {
          "AttributeName": "category",
          "KeyType": "HASH"
        }
      ],
      "Projection": {
        "ProjectionType": "ALL"
      }
    }
  ],
  "BillingMode": "PAY_PER_REQUEST"
}
```

## Environment Variables

Add these environment variables to your `.env.local` file:

```bash
# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here

# JWT Secret (generate a secure random string)
JWT_SECRET=your_super_secure_jwt_secret_here

# DynamoDB Table Names
DDB_SCENES_TABLE=ruchi-ai-scenes
DDB_USERS_TABLE=ruchi-ai-users
DDB_PROJECTS_TABLE=ruchi-ai-projects
DDB_MAPS_TABLE=ruchi-ai-maps
DDB_CHARACTERS_TABLE=ruchi-ai-characters
DDB_ASSETS_TABLE=ruchi-ai-assets
```

## Required Dependencies

Install these additional dependencies:

```bash
npm install bcryptjs jsonwebtoken
```

## AWS IAM Permissions

Your AWS user/role needs these DynamoDB permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:Query",
        "dynamodb:Scan",
        "dynamodb:BatchGetItem",
        "dynamodb:BatchWriteItem"
      ],
      "Resource": [
        "arn:aws:dynamodb:us-east-1:*:table/ruchi-ai-*",
        "arn:aws:dynamodb:us-east-1:*:table/ruchi-ai-*/index/*"
      ]
    }
  ]
}
```

## Data Structure

### User Schema
```javascript
{
  userId: "user-1234567890-abc123",
  email: "user@example.com",
  name: "John Doe",
  passwordHash: "hashed_password",
  profilePicture: "https://...",
  preferences: {
    theme: "light",
    editorSettings: {},
    notifications: {
      email: true,
      platform: true,
      projectUpdates: false
    },
    language: "en",
    timezone: "UTC"
  },
  subscription: {
    plan: "free",
    status: "active",
    expiresAt: null,
    features: ["basic-editor", "basic-assets"]
  },
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
  lastLoginAt: "2024-01-01T00:00:00.000Z",
  isActive: true
}
```

### Project Schema
```javascript
{
  projectId: "project-1234567890-abc123",
  name: "My Game Project",
  description: "A cool game project",
  userId: "user-1234567890-abc123",
  teamMembers: ["user-4567890123-def456"],
  settings: {
    template: "platformer",
    gameType: "platformer",
    platform: "web",
    collaboration: {
      allowComments: true,
      allowEdits: false,
      allowViewing: true
    },
    aiSettings: {
      autoSave: true,
      suggestions: true,
      codeCompletion: true
    }
  },
  status: "active",
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
  lastAccessedAt: "2024-01-01T00:00:00.000Z"
}
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create new user
- `POST /api/auth/signin` - User login
- `POST /api/auth/verify` - Verify JWT token

### Projects
- `GET /api/projects` - Get user's projects
- `POST /api/projects` - Create new project
- `GET /api/projects/[id]` - Get specific project
- `PUT /api/projects/[id]` - Update project
- `DELETE /api/projects/[id]` - Delete project

## Testing the Integration

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Test user registration:**
   ```bash
   curl -X POST http://localhost:3000/api/auth/signup \
     -H "Content-Type: application/json" \
     -d '{"name":"Test User","email":"test@example.com","password":"password123"}'
   ```

3. **Test user login:**
   ```bash
   curl -X POST http://localhost:3000/api/auth/signin \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"password123"}'
   ```

4. **Test project creation (with JWT token):**
   ```bash
   curl -X POST http://localhost:3000/api/projects \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -d '{"name":"My Test Project","description":"A test project"}'
   ```

## Next Steps

1. Create the DynamoDB tables using AWS Console or CLI
2. Set up environment variables
3. Install required dependencies
4. Test the authentication flow
5. Test project creation and management
6. Implement additional features (scenes, maps, characters)

## Troubleshooting

### Common Issues

1. **DynamoDB Access Denied:**
   - Check AWS credentials
   - Verify IAM permissions
   - Ensure region is correct

2. **JWT Token Issues:**
   - Verify JWT_SECRET is set
   - Check token expiration
   - Ensure proper Authorization header format

3. **Table Not Found:**
   - Verify table names match environment variables
   - Check table exists in correct region
   - Ensure GSI names match exactly

### Debug Mode

Enable debug logging by adding to your environment:
```bash
DEBUG=dynamodb:*
```

This will show detailed DynamoDB operation logs.
