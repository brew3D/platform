import { NextResponse } from 'next/server';

// GET /api/v1 - API information and status
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';

    const apiInfo = {
      name: 'Simo Platform API',
      version: '1.0.0',
      description: 'Public REST API for the Simo community platform',
      status: 'active',
      endpoints: {
        authentication: {
          login: 'POST /api/v1/auth/login',
          register: 'POST /api/v1/auth/register',
          refresh: 'POST /api/v1/auth/refresh',
          logout: 'POST /api/v1/auth/logout'
        },
        users: {
          profile: 'GET /api/v1/users/profile',
          update: 'PUT /api/v1/users/profile',
          search: 'GET /api/v1/users/search'
        },
        posts: {
          list: 'GET /api/v1/posts',
          create: 'POST /api/v1/posts',
          get: 'GET /api/v1/posts/{id}',
          update: 'PUT /api/v1/posts/{id}',
          delete: 'DELETE /api/v1/posts/{id}',
          like: 'POST /api/v1/posts/{id}/like',
          comment: 'POST /api/v1/posts/{id}/comments'
        },
        events: {
          list: 'GET /api/v1/events',
          create: 'POST /api/v1/events',
          get: 'GET /api/v1/events/{id}',
          update: 'PUT /api/v1/events/{id}',
          delete: 'DELETE /api/v1/events/{id}',
          rsvp: 'POST /api/v1/events/{id}/rsvp'
        },
        search: {
          global: 'GET /api/v1/search',
          posts: 'GET /api/v1/search/posts',
          users: 'GET /api/v1/search/users',
          events: 'GET /api/v1/search/events'
        },
        webhooks: {
          list: 'GET /api/v1/webhooks',
          create: 'POST /api/v1/webhooks',
          get: 'GET /api/v1/webhooks/{id}',
          update: 'PUT /api/v1/webhooks/{id}',
          delete: 'DELETE /api/v1/webhooks/{id}',
          test: 'POST /api/v1/webhooks/{id}/test'
        }
      },
      authentication: {
        type: 'Bearer Token',
        header: 'Authorization: Bearer <token>',
        description: 'Include your API token in the Authorization header'
      },
      rateLimiting: {
        requests: '1000 per hour',
        burst: '100 per minute'
      },
      documentation: {
        openapi: '/api/v1/openapi.json',
        postman: '/api/v1/postman.json'
      }
    };

    if (format === 'yaml') {
      return new Response(convertToYAML(apiInfo), {
        headers: { 'Content-Type': 'application/x-yaml' }
      });
    }

    return NextResponse.json(apiInfo);
  } catch (error) {
    console.error('API info error:', error);
    return NextResponse.json({ 
      error: 'Failed to get API information' 
    }, { status: 500 });
  }
}

// Convert object to YAML format
function convertToYAML(obj) {
  // Simple YAML conversion - in production, use a proper YAML library
  return `name: ${obj.name}
version: ${obj.version}
description: ${obj.description}
status: ${obj.status}
endpoints:
  authentication:
    login: ${obj.endpoints.authentication.login}
    register: ${obj.endpoints.authentication.register}
    refresh: ${obj.endpoints.authentication.refresh}
    logout: ${obj.endpoints.authentication.logout}
  users:
    profile: ${obj.endpoints.users.profile}
    update: ${obj.endpoints.users.update}
    search: ${obj.endpoints.users.search}
  posts:
    list: ${obj.endpoints.posts.list}
    create: ${obj.endpoints.posts.create}
    get: ${obj.endpoints.posts.get}
    update: ${obj.endpoints.posts.update}
    delete: ${obj.endpoints.posts.delete}
    like: ${obj.endpoints.posts.like}
    comment: ${obj.endpoints.posts.comment}
  events:
    list: ${obj.endpoints.events.list}
    create: ${obj.endpoints.events.create}
    get: ${obj.endpoints.events.get}
    update: ${obj.endpoints.events.update}
    delete: ${obj.endpoints.events.delete}
    rsvp: ${obj.endpoints.events.rsvp}
  search:
    global: ${obj.endpoints.search.global}
    posts: ${obj.endpoints.search.posts}
    users: ${obj.endpoints.search.users}
    events: ${obj.endpoints.search.events}
  webhooks:
    list: ${obj.endpoints.webhooks.list}
    create: ${obj.endpoints.webhooks.create}
    get: ${obj.endpoints.webhooks.get}
    update: ${obj.endpoints.webhooks.update}
    delete: ${obj.endpoints.webhooks.delete}
    test: ${obj.endpoints.webhooks.test}
authentication:
  type: ${obj.authentication.type}
  header: ${obj.authentication.header}
  description: ${obj.authentication.description}
rateLimiting:
  requests: ${obj.rateLimiting.requests}
  burst: ${obj.rateLimiting.burst}
documentation:
  openapi: ${obj.documentation.openapi}
  postman: ${obj.documentation.postman}`;
}
