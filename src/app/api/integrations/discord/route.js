import { NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { TABLE_NAMES, generateId, getCurrentTimestamp } from '../../../lib/dynamodb-schema';

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const docClient = DynamoDBDocumentClient.from(client);

// POST /api/integrations/discord - Handle Discord interactions
export async function POST(request) {
  try {
    const body = await request.json();
    const { type, data, member, guild_id, channel_id } = body;

    // Handle ping
    if (type === 1) {
      return NextResponse.json({ type: 1 });
    }

    // Handle slash commands
    if (type === 2) {
      return await handleDiscordCommand(data, member, guild_id, channel_id);
    }

    // Handle button interactions
    if (type === 3) {
      return await handleDiscordButton(data, member, guild_id, channel_id);
    }

    return NextResponse.json({ 
      type: 4,
      data: {
        content: 'Unknown interaction type',
        flags: 64 // Ephemeral
      }
    });
  } catch (error) {
    console.error('Discord integration error:', error);
    return NextResponse.json({ 
      type: 4,
      data: {
        content: 'An error occurred while processing your request.',
        flags: 64 // Ephemeral
      }
    });
  }
}

// Handle Discord slash commands
async function handleDiscordCommand(data, member, guildId, channelId) {
  try {
    const { name, options } = data;

    switch (name) {
      case 'posts':
        return await handlePostsCommand(options, channelId);
      
      case 'events':
        return await handleEventsCommand(options, channelId);
      
      case 'search':
        return await handleSearchCommand(options, channelId);
      
      case 'help':
        return await handleHelpCommand(channelId);
      
      default:
        return NextResponse.json({
          type: 4,
          data: {
            content: 'Unknown command. Use `/help` for available commands.',
            flags: 64 // Ephemeral
          }
        });
    }
  } catch (error) {
    console.error('Error handling Discord command:', error);
    return NextResponse.json({
      type: 4,
      data: {
        content: 'An error occurred while processing your command.',
        flags: 64 // Ephemeral
      }
    });
  }
}

// Handle Discord button interactions
async function handleDiscordButton(data, member, guildId, channelId) {
  try {
    const { custom_id } = data;
    
    // Parse custom_id to determine action
    const [action, ...params] = custom_id.split(':');
    
    switch (action) {
      case 'refresh_posts':
        return await handleRefreshPosts(channelId);
      
      case 'refresh_events':
        return await handleRefreshEvents(channelId);
      
      case 'view_more':
        return await handleViewMore(params[0], channelId);
      
      default:
        return NextResponse.json({
          type: 4,
          data: {
            content: 'Unknown button action.',
            flags: 64 // Ephemeral
          }
        });
    }
  } catch (error) {
    console.error('Error handling Discord button:', error);
    return NextResponse.json({
      type: 4,
      data: {
        content: 'An error occurred while processing your interaction.',
        flags: 64 // Ephemeral
      }
    });
  }
}

// Handle posts command
async function handlePostsCommand(options, channelId) {
  try {
    const limit = options?.find(opt => opt.name === 'limit')?.value || 5;
    const sortBy = options?.find(opt => opt.name === 'sort')?.value || 'newest';

    const params = new URLSearchParams({
      limit: limit.toString(),
      sortBy
    });

    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/community/posts?${params}`);
    const data = await response.json();

    if (!data.success || !data.items) {
      return NextResponse.json({
        type: 4,
        data: {
          content: 'Failed to fetch recent posts.',
          flags: 64 // Ephemeral
        }
      });
    }

    const posts = data.items.slice(0, limit);
    const embeds = posts.map((post, index) => ({
      title: `Post ${index + 1}`,
      description: post.content.substring(0, 200) + (post.content.length > 200 ? '...' : ''),
      color: 0x8a2be2,
      fields: [
        {
          name: 'Likes',
          value: (post.likes?.length || 0).toString(),
          inline: true
        },
        {
          name: 'Comments',
          value: (post.comments?.length || 0).toString(),
          inline: true
        },
        {
          name: 'Shares',
          value: (post.shares || 0).toString(),
          inline: true
        }
      ],
      timestamp: post.createdAt
    }));

    return NextResponse.json({
      type: 4,
      data: {
        embeds,
        components: [
          {
            type: 1,
            components: [
              {
                type: 2,
                style: 1,
                label: 'Refresh',
                custom_id: 'refresh_posts'
              }
            ]
          }
        ]
      }
    });
  } catch (error) {
    console.error('Error handling posts command:', error);
    return NextResponse.json({
      type: 4,
      data: {
        content: 'Failed to fetch posts.',
        flags: 64 // Ephemeral
      }
    });
  }
}

// Handle events command
async function handleEventsCommand(options, channelId) {
  try {
    const limit = options?.find(opt => opt.name === 'limit')?.value || 5;

    const params = new URLSearchParams({
      limit: limit.toString(),
      status: 'published'
    });

    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/events?${params}`);
    const data = await response.json();

    if (!data.success || !data.events) {
      return NextResponse.json({
        type: 4,
        data: {
          content: 'Failed to fetch upcoming events.',
          flags: 64 // Ephemeral
        }
      });
    }

    const events = data.events.slice(0, limit);
    const embeds = events.map((event, index) => {
      const eventDate = new Date(event.startTime);
      return {
        title: event.title,
        description: event.description.substring(0, 200) + (event.description.length > 200 ? '...' : ''),
        color: 0x8a2be2,
        fields: [
          {
            name: 'Date & Time',
            value: eventDate.toLocaleString(),
            inline: true
          },
          {
            name: 'Location',
            value: event.type === 'online' ? 'Online' : event.location?.name || 'TBD',
            inline: true
          },
          {
            name: 'Attendees',
            value: `${event.currentAttendees}/${event.maxAttendees}`,
            inline: true
          }
        ],
        timestamp: event.startTime
      };
    });

    return NextResponse.json({
      type: 4,
      data: {
        embeds,
        components: [
          {
            type: 1,
            components: [
              {
                type: 2,
                style: 1,
                label: 'Refresh',
                custom_id: 'refresh_events'
              }
            ]
          }
        ]
      }
    });
  } catch (error) {
    console.error('Error handling events command:', error);
    return NextResponse.json({
      type: 4,
      data: {
        content: 'Failed to fetch events.',
        flags: 64 // Ephemeral
      }
    });
  }
}

// Handle search command
async function handleSearchCommand(options, channelId) {
  try {
    const query = options?.find(opt => opt.name === 'query')?.value;
    const limit = options?.find(opt => opt.name === 'limit')?.value || 3;

    if (!query || query.trim().length < 2) {
      return NextResponse.json({
        type: 4,
        data: {
          content: 'Please provide a search term. Usage: `/search query:your search term`',
          flags: 64 // Ephemeral
        }
      });
    }

    const params = new URLSearchParams({
      q: query.trim(),
      limit: limit.toString()
    });

    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/search?${params}`);
    const data = await response.json();

    if (!data.success || !data.results) {
      return NextResponse.json({
        type: 4,
        data: {
          content: 'Failed to search.',
          flags: 64 // Ephemeral
        }
      });
    }

    const { posts, users, tags } = data.results;
    const embeds = [];

    if (posts.length > 0) {
      embeds.push({
        title: '📝 Posts',
        color: 0x8a2be2,
        fields: posts.slice(0, 3).map((post, index) => ({
          name: `Post ${index + 1}`,
          value: post.content.substring(0, 100) + (post.content.length > 100 ? '...' : ''),
          inline: false
        }))
      });
    }

    if (users.length > 0) {
      embeds.push({
        title: '👥 Users',
        color: 0x8a2be2,
        fields: users.slice(0, 3).map((user, index) => ({
          name: `User ${index + 1}`,
          value: `${user.name} (${user.email})`,
          inline: false
        }))
      });
    }

    if (tags.length > 0) {
      embeds.push({
        title: '🏷️ Tags',
        color: 0x8a2be2,
        description: tags.slice(0, 5).map(tag => `#${tag.name}`).join(' '),
        fields: []
      });
    }

    if (embeds.length === 0) {
      return NextResponse.json({
        type: 4,
        data: {
          content: `No results found for "${query.trim()}"`,
          flags: 64 // Ephemeral
        }
      });
    }

    return NextResponse.json({
      type: 4,
      data: {
        embeds
      }
    });
  } catch (error) {
    console.error('Error handling search command:', error);
    return NextResponse.json({
      type: 4,
      data: {
        content: 'Failed to search.',
        flags: 64 // Ephemeral
      }
    });
  }
}

// Handle help command
async function handleHelpCommand(channelId) {
  const embed = {
    title: '🤖 Simo Platform Discord Bot',
    description: 'Connect your Discord server with the Simo community platform!',
    color: 0x8a2be2,
    fields: [
      {
        name: 'Available Commands',
        value: '• `/posts` - Show recent community posts\n• `/events` - Show upcoming events\n• `/search` - Search posts, users, and tags\n• `/help` - Show this help message',
        inline: false
      },
      {
        name: 'Features',
        value: '• Real-time notifications for new posts and events\n• Search community content directly from Discord\n• Get updates on trending topics\n• Stay connected with your community',
        inline: false
      },
      {
        name: 'Setup',
        value: 'To enable notifications, contact an administrator to configure webhooks for your server.',
        inline: false
      }
    ],
    footer: {
      text: 'Simo Platform • Community Integration'
    }
  };

  return NextResponse.json({
    type: 4,
    data: {
      embeds: [embed]
    }
  });
}

// Handle refresh posts button
async function handleRefreshPosts(channelId) {
  return await handlePostsCommand([{ name: 'limit', value: 5 }], channelId);
}

// Handle refresh events button
async function handleRefreshEvents(channelId) {
  return await handleEventsCommand([{ name: 'limit', value: 5 }], channelId);
}

// Handle view more button
async function handleViewMore(type, channelId) {
  switch (type) {
    case 'posts':
      return await handlePostsCommand([{ name: 'limit', value: 10 }], channelId);
    case 'events':
      return await handleEventsCommand([{ name: 'limit', value: 10 }], channelId);
    default:
      return NextResponse.json({
        type: 4,
        data: {
          content: 'Unknown view more type.',
          flags: 64 // Ephemeral
        }
      });
  }
}
