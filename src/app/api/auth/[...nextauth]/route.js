import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { getSupabaseClient } from '@/app/lib/supabase';

const supabase = getSupabaseClient();

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
          const { data: existingUser } = await supabase
            .from('users')
            .select('*')
            .eq('email', user.email)
            .single();

          if (!existingUser) {
            // Create new user
            const userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            
            const newUser = {
              user_id: userId,
              name: user.name,
              email: user.email,
              profile_picture: user.image || '',
              password_hash: '', // OAuth users don't need password
              role: 'member',
              security: {
                twoFactorEnabled: false,
                totpSecret: null,
                recoveryCodes: []
              },
              preferences: {
                theme: 'dark',
                notifications: {
                  email: true,
                  platform: true,
                  projectUpdates: false
                },
                language: 'en',
                timezone: 'UTC',
                defaultProjectSettings: {}
              },
              subscription: {
                plan: 'free',
                status: 'active',
                expiresAt: null,
                features: ['basic-editor', 'basic-assets']
              },
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              last_login_at: new Date().toISOString(),
              is_active: true
            };

            const { error: insertError } = await supabase
              .from('users')
              .insert(newUser);

            if (insertError) {
              console.error('Error creating user:', insertError);
            }
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
