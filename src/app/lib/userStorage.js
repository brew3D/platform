// In-memory storage for demo (replace with DynamoDB later)
// Use global storage to persist between API calls
if (!global.userStorage) {
  global.userStorage = new Map();
}

export const userStorage = {
  // Add user
  set(email, user) {
    global.userStorage.set(email, user);
  },

  // Get user by email
  get(email) {
    return global.userStorage.get(email);
  },

  // Check if user exists
  has(email) {
    return global.userStorage.has(email);
  },

  // Get all users (for debugging)
  getAll() {
    return Array.from(global.userStorage.values());
  },

  // Clear all users (for testing)
  clear() {
    global.userStorage.clear();
  },

  // Update user profile
  updateProfile(email, profileData) {
    const user = global.userStorage.get(email);
    if (user) {
      const updatedUser = { ...user, ...profileData, updatedAt: new Date().toISOString() };
      global.userStorage.set(email, updatedUser);
      return updatedUser;
    }
    return null;
  },

  // Update user preferences
  updatePreferences(email, preferences) {
    const user = global.userStorage.get(email);
    if (user) {
      const updatedUser = { 
        ...user, 
        preferences: { ...user.preferences, ...preferences },
        updatedAt: new Date().toISOString()
      };
      global.userStorage.set(email, updatedUser);
      return updatedUser;
    }
    return null;
  },

  // Update user security settings
  updateSecurity(email, securityData) {
    const user = global.userStorage.get(email);
    if (user) {
      const updatedUser = { 
        ...user, 
        security: { ...user.security, ...securityData },
        updatedAt: new Date().toISOString()
      };
      global.userStorage.set(email, updatedUser);
      return updatedUser;
    }
    return null;
  }
};
