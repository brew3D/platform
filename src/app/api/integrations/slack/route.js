import { NextResponse } from 'next/server';
// Slack integration doesn't directly use database, but if needed:
// import { getSupabaseClient } from '@/app/lib/supabase';
// const supabase = getSupabaseClient();

// POST /api/integrations/slack - Handle Slack events and commands
export async function POST(request) {
  try {
    const body = await request.json();
    const { type, challenge, event, command, text, user_id, channel_id } = body;

    // Handle URL verification challenge
    if (type === 'url_verification') {
      return NextResponse.json({ challenge });
    }

    // Handle Slack events
    if (type === 'event_callback' && event) {
      return await handleSlackEvent(event);
    }

    // Handle Slack slash commands
    if (command) {
      return await handleSlackCommand(command, text, user_id, channel_id);
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Event received' 
    });
  } catch (error) {
    console.error('Slack integration error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to process Slack event' 
    }, { status: 500 });
  }
}

// Handle Slack events
async function handleSlackEvent(event) {
  try {
    const { type, user, text, channel } = event;

    switch (type) {
      case 'message':
        // Handle new messages in Slack channels
        if (text && !user.startsWith('B')) { // Ignore bot messages
          await handleSlackMessage(text, channel, user);
        }
        break;
      
      case 'app_mention':
        // Handle @mentions of the bot
        await handleSlackMention(text, channel, user);
        break;
      
      default:
        console.log('Unhandled Slack event type:', type);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error handling Slack event:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to handle Slack event' 
    }, { status: 500 });
  }
}

// Handle Slack slash commands
async function handleSlackCommand(command, text, userId, channelId) {
  try {
    switch (command) {
      case '/brew3d-posts':
        return await handlePostsCommand(text, channelId);
      
      case '/brew3d-events':
        return await handleEventsCommand(text, channelId);
      
      case '/brew3d-search':
        return await handleSearchCommand(text, channelId);
      
      case '/brew3d-help':
        return await handleHelpCommand(channelId);
      
      default:
        return NextResponse.json({
          response_type: 'ephemeral',
          text: 'Unknown command. Use `/brew3d-help` for available commands.'
        });
    }
  } catch (error) {
    console.error('Error handling Slack command:', error);
    return NextResponse.json({
      response_type: 'ephemeral',
      text: 'An error occurred while processing your command.'
    });
  }
}

// Handle posts command
async function handlePostsCommand(text, channelId) {
  try {
    const params = new URLSearchParams({
      limit: '5',
      sortBy: 'newest'
    });

    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/community/posts?${params}`);
    const data = await response.json();

    if (!data.success || !data.items) {
      return NextResponse.json({
        response_type: 'ephemeral',
        text: 'Failed to fetch recent posts.'
      });
    }

    const posts = data.items.slice(0, 5);
    const blocks = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '📝 Recent Community Posts'
        }
      }
    ];

    posts.forEach((post, index) => {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*${index + 1}.* ${post.content.substring(0, 200)}${post.content.length > 200 ? '...' : ''}\n👍 ${post.likes?.length || 0} • 💬 ${post.comments?.length || 0} • 📤 ${post.shares || 0}`
        }
      });
    });

    return NextResponse.json({
      response_type: 'in_channel',
      blocks
    });
  } catch (error) {
    console.error('Error handling posts command:', error);
    return NextResponse.json({
      response_type: 'ephemeral',
      text: 'Failed to fetch posts.'
    });
  }
}

// Handle events command
async function handleEventsCommand(text, channelId) {
  try {
    const params = new URLSearchParams({
      limit: '5',
      status: 'published'
    });

    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/events?${params}`);
    const data = await response.json();

    if (!data.success || !data.events) {
      return NextResponse.json({
        response_type: 'ephemeral',
        text: 'Failed to fetch upcoming events.'
      });
    }

    const events = data.events.slice(0, 5);
    const blocks = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '📅 Upcoming Events'
        }
      }
    ];

    events.forEach((event, index) => {
      const eventDate = new Date(event.startTime);
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*${index + 1}.* *${event.title}*\n📅 ${eventDate.toLocaleDateString()} at ${eventDate.toLocaleTimeString()}\n📍 ${event.type === 'online' ? 'Online' : event.location?.name || 'TBD'}\n👥 ${event.currentAttendees}/${event.maxAttendees} attendees`
        }
      });
    });

    return NextResponse.json({
      response_type: 'in_channel',
      blocks
    });
  } catch (error) {
    console.error('Error handling events command:', error);
    return NextResponse.json({
      response_type: 'ephemeral',
      text: 'Failed to fetch events.'
    });
  }
}

// Handle search command
async function handleSearchCommand(text, channelId) {
  try {
    if (!text || text.trim().length < 2) {
      return NextResponse.json({
        response_type: 'ephemeral',
        text: 'Please provide a search term. Usage: `/brew3d-search your search term`'
      });
    }

    const params = new URLSearchParams({
      q: text.trim(),
      limit: '3'
    });

    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/search?${params}`);
    const data = await response.json();

    if (!data.success || !data.results) {
      return NextResponse.json({
        response_type: 'ephemeral',
        text: 'Failed to search.'
      });
    }

    const { posts, users, tags } = data.results;
    const blocks = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `🔍 Search Results for "${text.trim()}"`
        }
      }
    ];

    if (posts.length > 0) {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*📝 Posts:*'
        }
      });

      posts.slice(0, 3).forEach((post, index) => {
        blocks.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `${index + 1}. ${post.content.substring(0, 150)}${post.content.length > 150 ? '...' : ''}`
          }
        });
      });
    }

    if (users.length > 0) {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*👥 Users:*'
        }
      });

      users.slice(0, 3).forEach((user, index) => {
        blocks.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `${index + 1}. ${user.name} (${user.email})`
          }
        });
      });
    }

    if (tags.length > 0) {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*🏷️ Tags:*'
        }
      });

      const tagText = tags.slice(0, 5).map(tag => `#${tag.name}`).join(' ');
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: tagText
        }
      });
    }

    return NextResponse.json({
      response_type: 'in_channel',
      blocks
    });
  } catch (error) {
    console.error('Error handling search command:', error);
    return NextResponse.json({
      response_type: 'ephemeral',
      text: 'Failed to search.'
    });
  }
}

// Handle help command
async function handleHelpCommand(channelId) {
  const blocks = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: '🤖 Brew3D Platform Slack Commands'
      }
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '*Available Commands:*\n\n• `/brew3d-posts` - Show recent community posts\n• `/brew3d-events` - Show upcoming events\n• `/brew3d-search <query>` - Search posts, users, and tags\n• `/brew3d-help` - Show this help message'
      }
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '*Features:*\n• Real-time notifications for new posts and events\n• Search community content directly from Slack\n• Get updates on trending topics\n• Stay connected with your community'
      }
    }
  ];

  return NextResponse.json({
    response_type: 'ephemeral',
    blocks
  });
}

// Handle Slack messages
async function handleSlackMessage(text, channel, user) {
  // Store message for potential analysis or response
  console.log('Slack message received:', { text, channel, user });
  
  // You could implement auto-responses, content analysis, etc.
}

// Handle Slack mentions
async function handleSlackMention(text, channel, user) {
  // Handle @mentions of the bot
  console.log('Slack mention received:', { text, channel, user });
  
  // You could implement smart responses, command parsing, etc.
}
