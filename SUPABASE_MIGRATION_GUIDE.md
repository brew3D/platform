# Supabase Migration Guide

## ✅ Completed

1. **Supabase Client Library** (`src/app/lib/supabase.js`)
   - Created Supabase client wrapper using `SUPABASE_URL` and `SUPABASE_ANON` environment variables

2. **SQL Migration File** (`SUPABASE_MIGRATION.sql`)
   - Complete SQL script to create all tables, indexes, triggers, and RLS policies
   - Includes all 20+ tables from DynamoDB structure

3. **SQL Instructions Page** (`src/app/supabase-setup/page.js`)
   - User-friendly page at `/supabase-setup` with all SQL instructions
   - Copy-to-clipboard functionality
   - Complete documentation

4. **Supabase Operations** (`src/app/lib/supabase-operations.js`)
   - Replaced DynamoDB operations with Supabase equivalents
   - Handles camelCase ↔ snake_case conversion
   - All CRUD operations for Users, Projects, Scenes, Maps, Characters, Assets

5. **Updated Legacy Files**
   - `dynamodb.js` - Now returns Supabase client for backward compatibility
   - `dynamodb-operations.js` - Re-exports from `supabase-operations.js`
   - `api/auth/[...nextauth]/route.js` - Updated to use Supabase

6. **Package Updates**
   - Removed `@aws-sdk/client-dynamodb` and `@aws-sdk/lib-dynamodb`
   - Added `@supabase/supabase-js`

## 📋 Next Steps

### 1. Run SQL Migration
- Go to `/supabase-setup` page or use `SUPABASE_MIGRATION.sql`
- Execute in Supabase SQL Editor
- Verify all tables are created

### 2. Update Environment Variables
Add to `.env.local`:
```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON=your_supabase_anon_key
```

### 3. Update Remaining API Routes
The following files still need to be updated to use Supabase:

**High Priority:**
- `src/app/api/settings/branding/route.js`
- `src/app/api/integrations/slack/route.js`
- `src/app/api/integrations/discord/route.js`
- `src/app/api/v1/webhooks/[webhookId]/route.js`
- `src/app/api/v1/webhooks/[webhookId]/test/route.js`
- `src/app/api/email/digest/route.js`
- `src/app/api/ai/search-assistant/route.js`
- `src/app/api/translation/route.js`
- `src/app/api/ai/summaries/route.js`
- `src/app/api/ai/moderation/route.js`
- `src/app/api/events/[eventId]/rsvp/route.js`
- `src/app/api/marketplace/plugins/[pluginId]/install/route.js`
- `src/app/api/community/posts/[postId]/comments/route.js`
- `src/app/api/community/posts/[postId]/report/route.js`
- `src/app/api/community/posts/[postId]/pin/route.js`
- `src/app/lib/webhook-trigger.js`

**Pattern to Follow:**
```javascript
// OLD (DynamoDB)
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({...});
const docClient = DynamoDBDocumentClient.from(client);

const result = await docClient.send(new GetCommand({
  TableName: 'table-name',
  Key: { id: 'value' }
}));

// NEW (Supabase)
import { getSupabaseClient } from '@/app/lib/supabase';

const supabase = getSupabaseClient();

const { data, error } = await supabase
  .from('table_name')
  .select('*')
  .eq('id', 'value')
  .single();
```

### 4. Update Table Names
DynamoDB table names use kebab-case, Supabase uses snake_case:
- `ruchi-ai-users` → `users`
- `ruchi-ai-projects` → `projects`
- `ruchi-ai-scenes` → `scenes`
- etc.

### 5. Update Field Names
DynamoDB uses camelCase, Supabase uses snake_case:
- `userId` → `user_id`
- `projectId` → `project_id`
- `createdAt` → `created_at`
- etc.

The `supabase-operations.js` file handles this conversion automatically.

### 6. Test All Features
- User authentication
- Project creation/editing
- Scene management
- Asset library
- Community features
- Events and RSVPs
- Chat functionality
- Teams
- Presence tracking

## 🔄 Migration Pattern

### Query Operations
```javascript
// DynamoDB Query
const result = await docClient.send(new QueryCommand({
  TableName: TABLE_NAMES.PROJECTS,
  IndexName: GSI_NAMES.PROJECT_USER,
  KeyConditionExpression: 'userId = :userId',
  ExpressionAttributeValues: { ':userId': userId }
}));

// Supabase Equivalent
const { data } = await supabase
  .from('projects')
  .select('*')
  .eq('user_id', userId);
```

### Insert Operations
```javascript
// DynamoDB Put
await docClient.send(new PutCommand({
  TableName: TABLE_NAMES.USERS,
  Item: user
}));

// Supabase Equivalent
await supabase
  .from('users')
  .insert(user);
```

### Update Operations
```javascript
// DynamoDB Update
await docClient.send(new UpdateCommand({
  TableName: TABLE_NAMES.USERS,
  Key: { userId },
  UpdateExpression: 'SET #name = :name',
  ExpressionAttributeNames: { '#name': 'name' },
  ExpressionAttributeValues: { ':name': newName }
}));

// Supabase Equivalent
await supabase
  .from('users')
  .update({ name: newName })
  .eq('user_id', userId);
```

### Delete Operations
```javascript
// DynamoDB Delete
await docClient.send(new DeleteCommand({
  TableName: TABLE_NAMES.PROJECTS,
  Key: { projectId }
}));

// Supabase Equivalent
await supabase
  .from('projects')
  .delete()
  .eq('project_id', projectId);
```

## 🎯 Key Differences

1. **No More AWS SDK**: All AWS SDK imports should be removed
2. **Environment Variables**: Use `SUPABASE_URL` and `SUPABASE_ANON` instead of AWS credentials
3. **Error Handling**: Supabase returns `{ data, error }` instead of throwing exceptions
4. **Query Syntax**: Use Supabase's query builder instead of DynamoDB expressions
5. **JSON Fields**: Supabase uses JSONB which is more powerful than DynamoDB's JSON

## 📚 Resources

- [Supabase JavaScript Client Docs](https://supabase.com/docs/reference/javascript/introduction)
- [Supabase SQL Editor](https://supabase.com/dashboard/project/_/sql)
- Migration SQL file: `SUPABASE_MIGRATION.sql`
- Setup page: `/supabase-setup`

## ⚠️ Important Notes

1. **Row Level Security**: RLS is enabled but basic policies are set. Customize as needed.
2. **Data Migration**: If you have existing DynamoDB data, you'll need to write a migration script
3. **Testing**: Thoroughly test all features after migration
4. **Backup**: Always backup your database before running migrations

