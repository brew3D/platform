import { NextResponse } from 'next/server';
import { requireAuth, requireRole } from '../../lib/auth';

export function withAuth(handler, { roles = [] } = {}) {
  return async function wrapped(request, ...args) {
    const auth = requireAuth(request);
    if (auth.error) {
      return NextResponse.json({ message: auth.error.message }, { status: auth.error.status });
    }
    const roleCheck = requireRole(auth, roles);
    if (roleCheck.error) {
      return NextResponse.json({ message: roleCheck.error.message }, { status: roleCheck.error.status });
    }
    request.__auth = auth;
    return handler(request, ...args);
  };
}


