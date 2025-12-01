import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/app/lib/supabase';
import nodemailer from 'nodemailer';

const supabase = getSupabaseClient();

// Lazy initialization of email transporter
function getTransporter() {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error('SMTP configuration is not complete');
  }
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

// POST /api/email/digest - Send weekly digest emails
export async function POST(request) {
  try {
    const { searchParams } = new URL(request.url);
    const testMode = searchParams.get('test') === 'true';
    const userId = searchParams.get('userId'); // For testing with specific user

    // Get all users who have email digest enabled
    const users = await getUsersForDigest(userId);
    
    if (users.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No users found for digest emails',
        sent: 0
      });
    }

    let sentCount = 0;
    const errors = [];

    // Process each user
    for (const user of users) {
      try {
        // Generate personalized digest content
        const digestContent = await generateDigestContent(user);
        
        // Send email
        const emailSent = await sendDigestEmail(user, digestContent);
        
        if (emailSent) {
          sentCount++;
          
          // Update user's last digest sent timestamp
          await updateLastDigestSent(user.userId);
        }
      } catch (error) {
        console.error(`Error sending digest to user ${user.userId}:`, error);
        errors.push({ userId: user.userId, error: error.message });
      }
    }

    return NextResponse.json({ 
      success: true, 
      sent: sentCount,
      total: users.length,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Digest email error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to send digest emails' 
    }, { status: 500 });
  }
}

// GET /api/email/digest - Preview digest content for a user
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'User ID is required' 
      }, { status: 400 });
    }

    // Get user
    const user = await getUserById(userId);
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: 'User not found' 
      }, { status: 404 });
    }

    // Generate digest content
    const digestContent = await generateDigestContent(user);

    return NextResponse.json({ 
      success: true, 
      digest: digestContent
    });
  } catch (error) {
    console.error('Preview digest error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to generate digest preview' 
    }, { status: 500 });
  }
}

// Get users who should receive digest emails
async function getUsersForDigest(specificUserId = null) {
  try {
    let query = supabase
      .from('users')
      .select('*')
      .eq('is_active', true);

    // If testing with specific user
    if (specificUserId) {
      query = query.eq('user_id', specificUserId);
    }

    // Filter users with email digest enabled in preferences
    // Note: This requires checking JSONB field - may need to adjust based on your preferences structure
    const { data, error } = await query;

    if (error) {
      console.error('Error getting users for digest:', error);
      return [];
    }

    // Filter users who have email digest enabled
    // Since preferences is JSONB, we filter in JavaScript
    return (data || []).filter(user => {
      const prefs = user.preferences || {};
      return prefs.notifications?.email === true; // Assuming email digest is part of email notifications
    });
  } catch (error) {
    console.error('Error getting users for digest:', error);
    return [];
  }
}

// Get user by ID
async function getUserById(userId) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !data) return null;
    return data;
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
}

// Generate personalized digest content for a user
async function generateDigestContent(user) {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  // Get trending posts from the past week
  const trendingPosts = await getTrendingPosts(oneWeekAgo.toISOString(), 5);
  
  // Get upcoming events
  const upcomingEvents = await getUpcomingEvents(5);
  
  // Get user's activity summary
  const userActivity = await getUserActivitySummary(user.userId, oneWeekAgo.toISOString());
  
  // Get new badges earned
  const newBadges = await getNewBadges(user.userId, oneWeekAgo.toISOString());
  
  // Get community stats
  const communityStats = await getCommunityStats(oneWeekAgo.toISOString());

  return {
    user: {
      name: user.name || user.email,
      email: user.email
    },
    period: {
      start: oneWeekAgo.toISOString(),
      end: new Date().toISOString()
    },
    trendingPosts,
    upcomingEvents,
    userActivity,
    newBadges,
    communityStats
  };
}

// Get trending posts from a specific date
async function getTrendingPosts(since, limit = 5) {
  try {
    const { data: posts, error } = await supabase
      .from('community_posts')
      .select('*')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(100); // Get more to calculate trending

    if (error) {
      console.error('Error getting trending posts:', error);
      return [];
    }

    // Calculate trending score and sort
    const trendingPosts = (posts || []).map(post => ({
      id: post.post_id,
      content: post.content,
      author: post.user_id,
      likes: post.likes?.length || 0,
      comments: post.comments?.length || 0,
      shares: post.shares || 0,
      createdAt: post.created_at,
      trendingScore: calculateTrendingScore(post)
    }));

    return trendingPosts
      .sort((a, b) => b.trendingScore - a.trendingScore)
      .slice(0, limit);
  } catch (error) {
    console.error('Error getting trending posts:', error);
    return [];
  }
}

// Get upcoming events
async function getUpcomingEvents(limit = 5) {
  try {
    const now = new Date().toISOString();
    const oneWeekFromNow = new Date();
    oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);

    const { data: events, error } = await supabase
      .from('events')
      .select('*')
      .gte('start_time', now)
      .lte('start_time', oneWeekFromNow.toISOString())
      .eq('status', 'published')
      .order('start_time', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('Error getting upcoming events:', error);
      return [];
    }

    return (events || []).map(event => ({
      ...event,
      startTime: event.start_time,
      maxAttendees: event.max_attendees,
      currentAttendees: event.current_attendees
    }));
  } catch (error) {
    console.error('Error getting upcoming events:', error);
    return [];
  }
}

// Get user's activity summary
async function getUserActivitySummary(userId, since) {
  try {
    // Get user's posts
    const { data: posts } = await supabase
      .from('community_posts')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', since);
    
    // Get user's points
    const { data: points } = await supabase
      .from('user_points')
      .select('*')
      .eq('user_id', userId)
      .single();

    const pointsData = points || { total_points: 0, level: 1 };

    return {
      postsCreated: (posts || []).length,
      totalLikes: (posts || []).reduce((sum, post) => sum + (post.likes?.length || 0), 0),
      totalComments: (posts || []).reduce((sum, post) => sum + (post.comments?.length || 0), 0),
      totalShares: (posts || []).reduce((sum, post) => sum + (post.shares || 0), 0),
      currentLevel: pointsData.level || 1,
      pointsEarned: pointsData.total_points || 0
    };
  } catch (error) {
    console.error('Error getting user activity:', error);
    return {
      postsCreated: 0,
      totalLikes: 0,
      totalComments: 0,
      totalShares: 0,
      currentLevel: 1,
      pointsEarned: 0
    };
  }
}

// Get new badges earned by user
async function getNewBadges(userId, since) {
  try {
    const { data: userBadges } = await supabase
      .from('user_badges')
      .select('*, badges(*)')
      .eq('user_id', userId)
      .gte('earned_at', since);

    if (!userBadges) return [];

    // Get badge details
    const badgesWithDetails = await Promise.all(
      (userBadges || []).map(async (userBadge) => {
        const { data: badge } = await supabase
          .from('badges')
          .select('*')
          .eq('badge_id', userBadge.badge_id)
          .single();
        
        return {
          ...badge,
          earnedAt: userBadge.earned_at
        };
      })
    );

    return badgesWithDetails.filter(b => b.badge_id); // Filter out null badges
  } catch (error) {
    console.error('Error getting new badges:', error);
    return [];
  }
}

// Get community stats
async function getCommunityStats(since) {
  try {
    // Get total posts
    const { count: postsCount } = await supabase
      .from('community_posts')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', since);

    // Get total events
    const { count: eventsCount } = await supabase
      .from('events')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', since);

    // Get new users
    const { count: usersCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', since);

    return {
      totalPosts: postsCount || 0,
      totalEvents: eventsCount || 0,
      newUsers: usersCount || 0,
      totalEngagement: 0 // Would need to calculate from all interactions
    };
  } catch (error) {
    console.error('Error getting community stats:', error);
    return {
      totalPosts: 0,
      totalEvents: 0,
      newUsers: 0,
      totalEngagement: 0
    };
  }
}

// Calculate trending score for a post
function calculateTrendingScore(post) {
  const likes = post.likes?.length || 0;
  const comments = post.comments?.length || 0;
  const shares = post.shares || 0;
  
  // Weighted engagement score
  const engagementScore = (likes * 1) + (comments * 3) + (shares * 5);
  
  // Time decay factor
  const hoursSinceCreation = (Date.now() - new Date(post.createdAt).getTime()) / (1000 * 60 * 60);
  const timeDecay = Math.exp(-0.1 * hoursSinceCreation);
  
  return engagementScore * timeDecay;
}

// Send digest email to user
async function sendDigestEmail(user, digestContent) {
  try {
    const htmlContent = generateEmailHTML(digestContent);
    const textContent = generateEmailText(digestContent);

    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: user.email,
      subject: `Weekly Digest - ${new Date().toLocaleDateString()}`,
      html: htmlContent,
      text: textContent
    };

    const transporter = getTransporter();
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

// Generate HTML email content
function generateEmailHTML(content) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Weekly Digest</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #8a2be2, #667eea); color: white; padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px; }
        .section { margin-bottom: 30px; padding: 20px; background: #f8f9fa; border-radius: 8px; }
        .section h2 { color: #8a2be2; margin-top: 0; }
        .post-item, .event-item { margin-bottom: 15px; padding: 15px; background: white; border-radius: 5px; border-left: 4px solid #8a2be2; }
        .badge-item { display: inline-block; margin: 5px; padding: 10px; background: #8a2be2; color: white; border-radius: 20px; font-size: 14px; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-top: 15px; }
        .stat-item { text-align: center; padding: 15px; background: white; border-radius: 5px; }
        .stat-value { font-size: 24px; font-weight: bold; color: #8a2be2; }
        .footer { text-align: center; margin-top: 30px; padding: 20px; background: #f8f9fa; border-radius: 8px; color: #666; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Weekly Community Digest</h1>
        <p>Hello ${content.user.name}! Here's what happened in your community this week.</p>
      </div>

      ${content.trendingPosts.length > 0 ? `
        <div class="section">
          <h2>🔥 Trending Posts</h2>
          ${content.trendingPosts.map(post => `
            <div class="post-item">
              <p><strong>${post.content.substring(0, 100)}${post.content.length > 100 ? '...' : ''}</strong></p>
              <p>👍 ${post.likes} • 💬 ${post.comments} • 📤 ${post.shares}</p>
            </div>
          `).join('')}
        </div>
      ` : ''}

      ${content.upcomingEvents.length > 0 ? `
        <div class="section">
          <h2>📅 Upcoming Events</h2>
          ${content.upcomingEvents.map(event => `
            <div class="event-item">
              <h3>${event.title}</h3>
              <p>📅 ${new Date(event.startTime).toLocaleDateString()} at ${new Date(event.startTime).toLocaleTimeString()}</p>
              <p>📍 ${event.type === 'online' ? 'Online' : event.location?.name || 'TBD'}</p>
            </div>
          `).join('')}
        </div>
      ` : ''}

      ${content.newBadges.length > 0 ? `
        <div class="section">
          <h2>🏆 New Badges Earned</h2>
          ${content.newBadges.map(badge => `
            <div class="badge-item">
              ${badge.icon} ${badge.name}
            </div>
          `).join('')}
        </div>
      ` : ''}

      <div class="section">
        <h2>📊 Your Activity This Week</h2>
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-value">${content.userActivity.postsCreated}</div>
            <div>Posts Created</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">${content.userActivity.totalLikes}</div>
            <div>Likes Received</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">${content.userActivity.currentLevel}</div>
            <div>Current Level</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">${content.userActivity.pointsEarned}</div>
            <div>Total Points</div>
          </div>
        </div>
      </div>

      <div class="section">
        <h2>🌍 Community Stats</h2>
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-value">${content.communityStats.totalPosts}</div>
            <div>New Posts</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">${content.communityStats.totalEvents}</div>
            <div>New Events</div>
          </div>
        </div>
      </div>

      <div class="footer">
        <p>Thanks for being part of our community!</p>
        <p><a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}" style="color: #8a2be2;">Visit Community</a></p>
      </div>
    </body>
    </html>
  `;
}

// Generate text email content
function generateEmailText(content) {
  return `
Weekly Community Digest
Hello ${content.user.name}!

Here's what happened in your community this week:

${content.trendingPosts.length > 0 ? `
TRENDING POSTS:
${content.trendingPosts.map(post => `- ${post.content.substring(0, 100)}${post.content.length > 100 ? '...' : ''} (👍 ${post.likes}, 💬 ${post.comments}, 📤 ${post.shares})`).join('\n')}
` : ''}

${content.upcomingEvents.length > 0 ? `
UPCOMING EVENTS:
${content.upcomingEvents.map(event => `- ${event.title} on ${new Date(event.startTime).toLocaleDateString()} at ${new Date(event.startTime).toLocaleTimeString()}`).join('\n')}
` : ''}

${content.newBadges.length > 0 ? `
NEW BADGES EARNED:
${content.newBadges.map(badge => `- ${badge.icon} ${badge.name}`).join('\n')}
` : ''}

YOUR ACTIVITY THIS WEEK:
- Posts Created: ${content.userActivity.postsCreated}
- Likes Received: ${content.userActivity.totalLikes}
- Current Level: ${content.userActivity.currentLevel}
- Total Points: ${content.userActivity.pointsEarned}

COMMUNITY STATS:
- New Posts: ${content.communityStats.totalPosts}
- New Events: ${content.communityStats.totalEvents}

Thanks for being part of our community!
Visit: ${process.env.NEXTAUTH_URL || 'http://localhost:3000'}
  `;
}

// Update user's last digest sent timestamp
async function updateLastDigestSent(userId) {
  try {
    // Get current preferences
    const { data: user } = await supabase
      .from('users')
      .select('preferences')
      .eq('user_id', userId)
      .single();

    if (user) {
      const preferences = user.preferences || {};
      preferences.lastDigestSent = new Date().toISOString();

      await supabase
        .from('users')
        .update({ preferences })
        .eq('user_id', userId);
    }
  } catch (error) {
    console.error('Error updating last digest sent:', error);
  }
}
