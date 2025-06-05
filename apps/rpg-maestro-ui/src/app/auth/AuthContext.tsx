import React, { createContext, useContext, useEffect, useState } from 'react';
import { isDevModeEnabled } from '../../FeaturesConfiguration';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: any;
  login: () => void;
  logout: () => void;
  setUserFixture: (user: CloudflareAccessUser) => void;
}

interface CloudflareAccessUser {
  id: string;
  name: string;
  email: string;
  idp: { id: string; type: string };
  geo: { country: string };
  user_uuid: string;
  account_id: string;
  iat: number;
  ip: string;
  auth_status: string;
  common_name: string;
  service_token_id: string;
  service_token_status: boolean;
  is_warp: boolean;
  is_gateway: boolean;
  version: number;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [user, setUser] = useState<any>(null);

  // Check auth status on initial load
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    if(isDevModeEnabled){
      // In development mode, we can mock the user data
      setIsLoading(false);
      setIsAuthenticated(false);
      return;
    }
    try {
      // Cloudflare Access will automatically redirect to login if not authenticated
      // This endpoint should return user info if authenticated
      const response = await fetch('/cdn-cgi/access/get-identity');
      if (response.ok) {
        const userData = await response.json() as CloudflareAccessUser;
        setUser(userData);
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const login = () => {
    // Cloudflare will handle the login redirect
    window.location.href = '/cdn-cgi/access/login';
  };

  const logout = () => {
    // Cloudflare will handle the logout
    window.location.href = '/cdn-cgi/access/logout';
  };

  const setUserFixture = (user: any) => {
    if (!isDevModeEnabled) {
      throw new Error('setUserFixture is only available in development mode');

    }
    setUser(user);
    setIsAuthenticated(true);
    setIsLoading(false)
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, user, login, logout, setUserFixture }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Protected route component
export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>; // Or a loading spinner
  }

  if (!isAuthenticated) {
    // Redirect to login if not authenticated
    window.location.href = '/cdn-cgi/access/login';
    return null;
  }

  return <>{children}</>;
};
