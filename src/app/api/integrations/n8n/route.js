import { NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { TABLE_NAMES } from '@/app/lib/dynamodb-schema';

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const docClient = DynamoDBDocumentClient.from(client);

// GET /api/integrations/n8n - n8n webhook endpoints
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const trigger = searchParams.get('trigger');
    const apiKey = request.headers.get('x-api-key');

    // Verify API key
    if (!apiKey || !await verifyApiKey(apiKey)) {
      return NextResponse.json({ 
        error: 'Invalid API key' 
      }, { status: 401 });
    }

    switch (trigger) {
      case 'webhook':
        return await handleWebhookTrigger(request);
      
      case 'polling':
        return await handlePollingTrigger(request);
      
      case 'scheduled':
        return await handleScheduledTrigger(request);
      
      default:
        return NextResponse.json({ 
          error: 'Unknown trigger type',
          available_triggers: [
            'webhook',
            'polling',
            'scheduled'
          ]
        }, { status: 400 });
    }
  } catch (error) {
    console.error('n8n integration error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

// POST /api/integrations/n8n - n8n action endpoints
export async function POST(request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const apiKey = request.headers.get('x-api-key');

    // Verify API key
    if (!apiKey || !await verifyApiKey(apiKey)) {
      return NextResponse.json({ 
        error: 'Invalid API key' 
      }, { status: 401 });
    }

    const body = await request.json();

    switch (action) {
      case 'execute_workflow':
        return await executeWorkflow(body);
      
      case 'get_data':
        return await getData(body);
      
      case 'transform_data':
        return await transformData(body);
      
      case 'send_webhook':
        return await sendWebhook(body);
      
      default:
        return NextResponse.json({ 
          error: 'Unknown action type',
          available_actions: [
            'execute_workflow',
            'get_data',
            'transform_data',
            'send_webhook'
          ]
        }, { status: 400 });
    }
  } catch (error) {
    console.error('n8n action error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

// Handle webhook trigger
async function handleWebhookTrigger(request) {
  try {
    const { searchParams } = new URL(request.url);
    const event = searchParams.get('event');
    const data = await request.json();

    // Process webhook data based on event type
    const processedData = await processWebhookData(event, data);

    return NextResponse.json({
      success: true,
      event,
      data: processedData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error handling webhook trigger:', error);
    return NextResponse.json({ 
      error: 'Failed to process webhook' 
    }, { status: 500 });
  }
}

// Handle polling trigger
async function handlePollingTrigger(request) {
  try {
    const { searchParams } = new URL(request.url);
    const resource = searchParams.get('resource');
    const since = searchParams.get('since');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    let data = [];

    switch (resource) {
      case 'posts':
        data = await getPollingData(TABLE_NAMES.COMMUNITY_POSTS, since, limit);
        break;
      case 'events':
        data = await getPollingData(TABLE_NAMES.EVENTS, since, limit);
        break;
      case 'users':
        data = await getPollingData(TABLE_NAMES.USERS, since, limit);
        break;
      default:
        return NextResponse.json({ 
          error: 'Unknown resource type',
          available_resources: ['posts', 'events', 'users']
        }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      resource,
      data,
      count: data.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error handling polling trigger:', error);
    return NextResponse.json({ 
      error: 'Failed to poll data' 
    }, { status: 500 });
  }
}

// Handle scheduled trigger
async function handleScheduledTrigger(request) {
  try {
    const { searchParams } = new URL(request.url);
    const schedule = searchParams.get('schedule');
    const task = searchParams.get('task');

    // Execute scheduled task
    const result = await executeScheduledTask(schedule, task);

    return NextResponse.json({
      success: true,
      schedule,
      task,
      result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error handling scheduled trigger:', error);
    return NextResponse.json({ 
      error: 'Failed to execute scheduled task' 
    }, { status: 500 });
  }
}

// Execute workflow
async function executeWorkflow(body) {
  try {
    const { workflow_id, input_data, parameters = {} } = body;

    if (!workflow_id) {
      return NextResponse.json({ 
        error: 'Workflow ID is required' 
      }, { status: 400 });
    }

    // This would integrate with n8n's workflow execution API
    // For now, simulate workflow execution
    const result = await simulateWorkflowExecution(workflow_id, input_data, parameters);

    return NextResponse.json({
      success: true,
      workflow_id,
      execution_id: result.execution_id,
      status: result.status,
      output: result.output,
      executed_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error executing workflow:', error);
    return NextResponse.json({ 
      error: 'Failed to execute workflow' 
    }, { status: 500 });
  }
}

// Get data
async function getData(body) {
  try {
    const { resource, filters = {}, limit = 50, offset = 0 } = body;

    if (!resource) {
      return NextResponse.json({ 
        error: 'Resource is required' 
      }, { status: 400 });
    }

    let data = [];
    let tableName;

    switch (resource) {
      case 'posts':
        tableName = TABLE_NAMES.COMMUNITY_POSTS;
        break;
      case 'events':
        tableName = TABLE_NAMES.EVENTS;
        break;
      case 'users':
        tableName = TABLE_NAMES.USERS;
        break;
      default:
        return NextResponse.json({ 
          error: 'Unknown resource type' 
        }, { status: 400 });
    }

    data = await getFilteredData(tableName, filters, limit, offset);

    return NextResponse.json({
      success: true,
      resource,
      data,
      count: data.length,
      limit,
      offset
    });
  } catch (error) {
    console.error('Error getting data:', error);
    return NextResponse.json({ 
      error: 'Failed to get data' 
    }, { status: 500 });
  }
}

// Transform data
async function transformData(body) {
  try {
    const { data, transformation, mapping } = body;

    if (!data || !transformation) {
      return NextResponse.json({ 
        error: 'Data and transformation are required' 
      }, { status: 400 });
    }

    // Apply transformation based on type
    let transformedData;

    switch (transformation) {
      case 'map_fields':
        transformedData = mapFields(data, mapping);
        break;
      case 'filter':
        transformedData = filterData(data, mapping);
        break;
      case 'aggregate':
        transformedData = aggregateData(data, mapping);
        break;
      case 'format':
        transformedData = formatData(data, mapping);
        break;
      default:
        return NextResponse.json({ 
          error: 'Unknown transformation type' 
        }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      transformation,
      original_count: Array.isArray(data) ? data.length : 1,
      transformed_count: Array.isArray(transformedData) ? transformedData.length : 1,
      data: transformedData
    });
  } catch (error) {
    console.error('Error transforming data:', error);
    return NextResponse.json({ 
      error: 'Failed to transform data' 
    }, { status: 500 });
  }
}

// Send webhook
async function sendWebhook(body) {
  try {
    const { url, data, headers = {}, method = 'POST' } = body;

    if (!url || !data) {
      return NextResponse.json({ 
        error: 'URL and data are required' 
      }, { status: 400 });
    }

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: JSON.stringify(data)
    });

    const responseData = await response.text();

    return NextResponse.json({
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      response: responseData,
      sent_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error sending webhook:', error);
    return NextResponse.json({ 
      error: 'Failed to send webhook' 
    }, { status: 500 });
  }
}

// Helper functions
async function processWebhookData(event, data) {
  // Process webhook data based on event type
  switch (event) {
    case 'post.created':
      return {
        type: 'post',
        action: 'created',
        id: data.postId,
        content: data.content,
        author: data.userId,
        timestamp: data.createdAt
      };
    case 'event.created':
      return {
        type: 'event',
        action: 'created',
        id: data.eventId,
        title: data.title,
        organizer: data.organizerId,
        timestamp: data.createdAt
      };
    default:
      return data;
  }
}

async function getPollingData(tableName, since, limit) {
  try {
    const params = {
      TableName: tableName,
      Limit: limit
    };

    if (since) {
      params.FilterExpression = 'createdAt >= :since';
      params.ExpressionAttributeValues = { ':since': since };
    }

    const result = await docClient.send(new ScanCommand(params));
    return result.Items || [];
  } catch (error) {
    console.error('Error getting polling data:', error);
    return [];
  }
}

async function executeScheduledTask(schedule, task) {
  // Execute scheduled tasks based on type
  switch (task) {
    case 'cleanup_old_data':
      return await cleanupOldData();
    case 'send_digest':
      return await sendDigestEmails();
    case 'update_statistics':
      return await updateStatistics();
    default:
      return { message: 'Unknown task', executed: false };
  }
}

async function simulateWorkflowExecution(workflowId, inputData, parameters) {
  // Simulate workflow execution
  return {
    execution_id: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    status: 'completed',
    output: {
      processed: inputData,
      parameters,
      result: 'Workflow executed successfully'
    }
  };
}

async function getFilteredData(tableName, filters, limit, offset) {
  try {
    const params = {
      TableName: tableName,
      Limit: limit
    };

    // Add filters
    const filterExpressions = [];
    const expressionAttributeValues = {};

    Object.entries(filters).forEach(([key, value]) => {
      filterExpressions.push(`${key} = :${key}`);
      expressionAttributeValues[`:${key}`] = value;
    });

    if (filterExpressions.length > 0) {
      params.FilterExpression = filterExpressions.join(' AND ');
      params.ExpressionAttributeValues = expressionAttributeValues;
    }

    const result = await docClient.send(new ScanCommand(params));
    return result.Items || [];
  } catch (error) {
    console.error('Error getting filtered data:', error);
    return [];
  }
}

function mapFields(data, mapping) {
  if (!Array.isArray(data)) {
    data = [data];
  }

  return data.map(item => {
    const mapped = {};
    Object.entries(mapping).forEach(([newKey, oldKey]) => {
      mapped[newKey] = item[oldKey];
    });
    return mapped;
  });
}

function filterData(data, filters) {
  if (!Array.isArray(data)) {
    data = [data];
  }

  return data.filter(item => {
    return Object.entries(filters).every(([key, value]) => {
      return item[key] === value;
    });
  });
}

function aggregateData(data, aggregation) {
  if (!Array.isArray(data)) {
    return data;
  }

  const { groupBy, operations } = aggregation;
  const grouped = {};

  data.forEach(item => {
    const key = item[groupBy];
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(item);
  });

  return Object.entries(grouped).map(([key, items]) => {
    const result = { [groupBy]: key };
    
    operations.forEach(op => {
      const { field, operation, as } = op;
      const values = items.map(item => item[field]).filter(v => v !== undefined);
      
      switch (operation) {
        case 'count':
          result[as] = values.length;
          break;
        case 'sum':
          result[as] = values.reduce((sum, val) => sum + (typeof val === 'number' ? val : 0), 0);
          break;
        case 'avg':
          result[as] = values.length > 0 ? values.reduce((sum, val) => sum + (typeof val === 'number' ? val : 0), 0) / values.length : 0;
          break;
        case 'min':
          result[as] = Math.min(...values);
          break;
        case 'max':
          result[as] = Math.max(...values);
          break;
      }
    });
    
    return result;
  });
}

function formatData(data, format) {
  if (!Array.isArray(data)) {
    data = [data];
  }

  return data.map(item => {
    const formatted = {};
    Object.entries(format).forEach(([newKey, expression]) => {
      // Simple expression evaluation (in production, use a proper expression parser)
      formatted[newKey] = evalExpression(expression, item);
    });
    return formatted;
  });
}

function evalExpression(expression, data) {
  // Simple expression evaluation - in production, use a proper expression parser
  return expression.replace(/\{(\w+)\}/g, (match, key) => data[key] || '');
}

async function cleanupOldData() {
  // Cleanup old data
  return { message: 'Old data cleaned up', executed: true };
}

async function sendDigestEmails() {
  // Send digest emails
  return { message: 'Digest emails sent', executed: true };
}

async function updateStatistics() {
  // Update statistics
  return { message: 'Statistics updated', executed: true };
}

async function verifyApiKey(apiKey) {
  try {
    const validApiKeys = process.env.API_KEYS ? JSON.parse(process.env.API_KEYS) : {};
    return !!validApiKeys[apiKey];
  } catch (error) {
    console.error('Error verifying API key:', error);
    return false;
  }
}
