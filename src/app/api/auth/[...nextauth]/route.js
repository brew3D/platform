import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { createUser, getUserByEmail } from '../../../lib/dynamodb-operations';

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || ''
    })
  ],
  callbacks: {
    async signIn({ user, account, profile, email, credentials }) {
      if (!user?.email) return false;
      // Link to existing account by email or create if missing
      let existing = await getUserByEmail(user.email);
      if (!existing) {
        await createUser({
          email: user.email,
          name: user.name || user.email,
          passwordHash: '',
          role: 'member',
          profilePicture: user.image || ''
        });
      }
      return true;
    },
    async jwt({ token }) {
      // attach role and userId for convenience
      if (token?.email) {
        const u = await getUserByEmail(token.email);
        if (u) {
          token.userId = u.userId;
          token.role = u.role || 'member';
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token?.userId) {
        session.user.userId = token.userId;
        session.user.role = token.role || 'member';
      }
      return session;
    }
  },
});

export { handler as GET, handler as POST };

import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';

const dynamoClient = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const docClient = DynamoDBDocumentClient.from(dynamoClient);

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account.provider === 'google') {
        try {
          // Check if user exists
          const existingUser = await docClient.send(new QueryCommand({
            TableName: process.env.DYNAMODB_TABLE_NAME || 'ruchi-ai-users',
            IndexName: 'email-index',
            KeyConditionExpression: 'email = :email',
            ExpressionAttributeValues: {
              ':email': user.email,
            },
          }));

          if (!existingUser.Items || existingUser.Items.length === 0) {
            // Create new user
            const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            const newUser = {
              userId,
              name: user.name,
              email: user.email,
              profilePicture: user.image,
              provider: 'google',
              providerId: account.providerAccountId,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              isVerified: true,
              preferences: {
                theme: 'dark',
                notifications: true,
              },
            };

            await docClient.send(new PutCommand({
              TableName: process.env.DYNAMODB_TABLE_NAME || 'ruchi-ai-users',
              Item: newUser,
            }));
          }

          return true;
        } catch (error) {
          console.error('Google signin error:', error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (account && user) {
        token.userId = user.id;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.userId;
        session.user.email = token.email;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    signUp: '/auth/signup',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };
