import jwt from 'jsonwebtoken';
import { getUserById } from './dynamodb-operations';

export function requireAuth(request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: { status: 401, message: 'Unauthorized' } };
  }
  try {
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    return { userId: decoded.userId, role: decoded.role || 'member', decoded };
  } catch (e) {
    return { error: { status: 401, message: 'Invalid or expired token' } };
  }
}

export function requireRole(decoded, allowedRoles = []) {
  if (!allowedRoles.length) return { ok: true };
  const role = decoded?.role || 'member';
  if (allowedRoles.includes(role)) return { ok: true };
  return { error: { status: 403, message: 'Forbidden' } };
}

export async function loadUser(userId) {
  const user = await getUserById(userId);
  if (!user || !user.isActive) return null;
  return user;
}


