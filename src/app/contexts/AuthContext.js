"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Version identifier to force cache refresh
  const VERSION = 'v2.1-persistent-auth';

  useEffect(() => {
    console.log('🚀 AuthContext loaded with version:', VERSION);
    
    // Check for stored token on mount
    const storedToken = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('auth_user');
    
    console.log('🔍 Stored auth data:', { 
      hasToken: !!storedToken, 
      hasUser: !!storedUser,
      tokenLength: storedToken?.length || 0
    });
    
    if (storedToken && storedUser) {
      try {
        // Restore user from localStorage immediately
        const parsedUser = JSON.parse(storedUser);
        console.log('👤 Restoring user from localStorage:', parsedUser.email);
        setUser(parsedUser);
        setToken(storedToken);
        setIsInitialized(true);
        setLoading(false);
        
        // Verify token in background
        verifyToken(storedToken);
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        setUser(null);
        setToken(null);
        setIsInitialized(true);
        setLoading(false);
      }
    } else {
      console.log('❌ No stored auth data found');
      
      // Check if user intentionally logged out - don't set temp user in that case
      const logoutFlag = localStorage.getItem('logout_flag');
      if (logoutFlag === 'true') {
        console.log('🚪 Logout flag detected - not setting temp user');
        setUser(null);
        setToken(null);
        setIsInitialized(true);
        setLoading(false);
        return;
      }
      
      // TEMPORARY: Set a default user to bypass authentication
      // Use a consistent ID for the temp user so projects persist across sessions
      const tempUserId = localStorage.getItem('temp_user_id') || 'temp-user-default';
      localStorage.setItem('temp_user_id', tempUserId);
      
      const defaultUser = {
        userId: tempUserId,
        email: 'temp@example.com',
        name: 'Test User',
        role: 'admin'
      };
      const defaultToken = 'temp-token-bypass-auth';
      console.log('🔓 TEMPORARY: Setting default user to bypass authentication', { userId: tempUserId });
      setUser(defaultUser);
      setToken(defaultToken);
      setIsInitialized(true);
      setLoading(false);
    }
  }, []);

  const verifyToken = async (tokenToVerify) => {
    try {
      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: tokenToVerify }),
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setToken(tokenToVerify);
        localStorage.setItem('auth_token', tokenToVerify);
        localStorage.setItem('auth_user', JSON.stringify(data.user));
        // Clear logout flag on successful token verification
        localStorage.removeItem('logout_flag');
      } else {
        localStorage.removeItem('auth_token');
        setUser(null);
        setToken(null);
      }
    } catch (error) {
      console.error('Token verification failed:', error);
      localStorage.removeItem('auth_token');
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      console.log('🔐 NEW VERSION - Attempting login with email:', email);
      console.log('🌐 Using relative URL for signin endpoint');
      
      // Try the main signin endpoint first
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      console.log('📡 First response status:', response.status);

      // If it fails, try dev endpoint
      if (!response.ok) {
        const errorData = await response.json();
        console.log('❌ First request failed with error:', errorData.message);
        
        // Check if it's a DynamoDB/AWS error OR if it's a 401 (user not found in new tables)
        if (errorData.message.includes('AWS credentials') || 
            errorData.message.includes('Database table not found') ||
            errorData.message.includes('Requested resource not found') ||
            errorData.message.includes('ResourceNotFoundException') ||
            (response.status === 401 && errorData.message.includes('Invalid email or password'))) {
          console.log('🔄 AWS/DynamoDB issue or user not found in new tables, falling back to dev mode...');
          
          // Try dev endpoint
          const devResponse = await fetch('/api/auth/dev-signin', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
          });
          
          console.log('📡 Dev response status:', devResponse.status);
          const devData = await devResponse.json();
          
          if (devResponse.ok) {
            // Clear any existing user data before setting new user (but don't set logout flag)
            setUser(null);
            setToken(null);
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_user');
            
            setUser(devData.user);
            setToken(devData.token);
            localStorage.setItem('auth_token', devData.token);
            localStorage.setItem('auth_user', JSON.stringify(devData.user));
            // Clear logout flag on successful login
            localStorage.removeItem('logout_flag');
            return { success: true, warning: devData.warning };
          } else {
            return { success: false, error: devData.message };
          }
        } else {
          // Return the original error for non-AWS issues
          return { success: false, error: errorData.message };
        }
      }

      // If first request succeeded
      const data = await response.json();
      setUser(data.user);
      setToken(data.token);
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('auth_user', JSON.stringify(data.user));
      // Clear logout flag on successful login
      localStorage.removeItem('logout_flag');
      return { success: true, warning: data.warning };
      
    } catch (error) {
      console.error('Login failed:', error);
      return { success: false, error: 'Network error' };
    }
  };

  const register = async (name, email, password) => {
    try {
      console.log('📝 Attempting registration with email:', email);
      
      // Try the main signup endpoint first
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });

      // If it fails, try dev endpoint
      if (!response.ok) {
        const errorData = await response.json();
        console.log('❌ First request failed with error:', errorData.message);
        
        // Check if it's a DynamoDB/AWS error
        if (errorData.message.includes('AWS credentials') || 
            errorData.message.includes('Database table not found') ||
            errorData.message.includes('Requested resource not found') ||
            errorData.message.includes('ResourceNotFoundException')) {
          console.log('🔄 AWS not configured, falling back to dev mode...');
          
          // Try dev endpoint
          const devResponse = await fetch('/api/auth/dev-signup', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, email, password }),
          });
          
          const devData = await devResponse.json();
          
          if (devResponse.ok) {
            setUser(devData.user);
            setToken(devData.token);
            localStorage.setItem('auth_token', devData.token);
            localStorage.setItem('auth_user', JSON.stringify(devData.user));
            // Clear logout flag on successful registration
            localStorage.removeItem('logout_flag');
            return { success: true, warning: devData.warning };
          } else {
            return { success: false, error: devData.message };
          }
        } else {
          // Return the original error for non-AWS issues
          return { success: false, error: errorData.message };
        }
      }

      // If first request succeeded
      const data = await response.json();
      setUser(data.user);
      setToken(data.token);
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('auth_user', JSON.stringify(data.user));
      // Clear logout flag on successful registration
      localStorage.removeItem('logout_flag');
      return { success: true, warning: data.warning };
      
    } catch (error) {
      console.error('Registration failed:', error);
      return { success: false, error: 'Network error' };
    }
  };

  // Helper function to clear user data and cached data
  const clearUserData = () => {
    console.log('🧹 Clearing user data and cached data');
    setUser(null);
    setToken(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('temp_user_id');
    // Set flag to prevent temp user from being set after logout
    localStorage.setItem('logout_flag', 'true');
    // Clear cached data for any previous user
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('teams_')) {
        localStorage.removeItem(key);
      }
    });
  };

  const logout = () => {
    console.log('🚪 Logging out user:', user?.email);
    clearUserData();
    // Redirect immediately to prevent temp user from being set
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  // Helper function to make authenticated API calls with automatic token verification
  const authenticatedFetch = async (url, options = {}) => {
    // TEMPORARY: Bypass authentication - allow requests without token
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Only add Authorization header if token exists
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Don't redirect on 401 - just return the response
    // if (response.status === 401) {
    //   logout();
    //   if (typeof window !== 'undefined') {
    //     window.location.href = '/auth/signin';
    //   }
    //   throw new Error('Session expired');
    // }

    return response;
  };

  const value = {
    user,
    token,
    loading: loading || !isInitialized,
    // TEMPORARY: Always return true for isAuthenticated to bypass auth checks
    isAuthenticated: true, // Boolean(user && token && isInitialized),
    login,
    register,
    logout,
    authenticatedFetch,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
