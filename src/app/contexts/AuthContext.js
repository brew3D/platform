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
  
  // Version identifier to force cache refresh
  const VERSION = 'v2.0-fixed-port-issue';

  useEffect(() => {
    console.log('🚀 AuthContext loaded with version:', VERSION);
    // Check for stored token on mount
    const storedToken = localStorage.getItem('auth_token');
    if (storedToken) {
      verifyToken(storedToken);
    } else {
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
            setUser(devData.user);
            setToken(devData.token);
            localStorage.setItem('auth_token', devData.token);
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
      return { success: true, warning: data.warning };
      
    } catch (error) {
      console.error('Registration failed:', error);
      return { success: false, error: 'Network error' };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('auth_token');
  };

  // Helper function to make authenticated API calls with automatic token verification
  const authenticatedFetch = async (url, options = {}) => {
    if (!token) {
      throw new Error('No authentication token available');
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    // If token is expired, clear it and redirect to login
    if (response.status === 401) {
      logout();
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/signin';
      }
      throw new Error('Session expired');
    }

    return response;
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: Boolean(user || token),
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
