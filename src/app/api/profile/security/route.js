import { userStorage } from '../../../lib/userStorage';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function PUT(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return Response.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const email = decoded.email;

    const { currentPassword, newPassword, twoFactorEnabled, loginNotifications, sessionTimeout } = await request.json();

    const user = userStorage.get(email);
    if (!user) {
      return Response.json({ message: 'User not found' }, { status: 404 });
    }

    // Verify current password if changing password
    if (currentPassword && newPassword) {
      const isValidPassword = await bcrypt.compare(currentPassword, user.password);
      if (!isValidPassword) {
        return Response.json({ message: 'Current password is incorrect' }, { status: 400 });
      }

      // Hash new password
      const hashedNewPassword = await bcrypt.hash(newPassword, 12);
      user.password = hashedNewPassword;
    }

    // Update security settings
    const securityData = {
      twoFactorEnabled: twoFactorEnabled || false,
      loginNotifications: loginNotifications !== undefined ? loginNotifications : true,
      sessionTimeout: sessionTimeout || 30
    };

    const updatedUser = userStorage.updateSecurity(email, securityData);

    if (!updatedUser) {
      return Response.json({ message: 'Failed to update security settings' }, { status: 500 });
    }

    return Response.json({
      message: 'Security settings updated successfully',
      security: updatedUser.security
    });

  } catch (error) {
    console.error('Security update error:', error);
    return Response.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
