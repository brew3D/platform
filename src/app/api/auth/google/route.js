import { redirect } from 'next/navigation';

export async function GET() {
  // Redirect to NextAuth Google provider
  redirect('/api/auth/signin/google');
}