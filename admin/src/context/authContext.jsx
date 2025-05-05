import React, { createContext, useState, useEffect, useCallback } from "react";
import Cookies from "js-cookie";
import axios from "axios";
import { API_URL } from "@/constant/Urls";
import { useNavigate } from "react-router-dom";
axios.defaults.withCredentials = true;

// Create the Auth Context
const AuthContext = createContext();

// Enhanced cookie configuration for persistence
const COOKIE_OPTIONS = {
  secure: false, // Set to true in production with HTTPS
  sameSite: "strict",
  expires: 30, // Increased from 7 to 30 days
  path: "/",
};

// Token names
const TOKEN_NAME = "_usertoken";
const REFRESH_TOKEN_NAME = "_refreshtoken";

// Also use localStorage as backup
const saveTokenToLocalStorage = (name, value) => {
  if (value) {
    localStorage.setItem(name, value);
  }
};

const getTokenFromStorage = (name) => {
  return Cookies.get(name) || localStorage.getItem(name);
};

export const AuthProvider = ({ children }) => {
  const router = useNavigate();
  const [token, setToken] = useState(getTokenFromStorage(TOKEN_NAME) || null);
  const [refreshToken, setRefreshToken] = useState(getTokenFromStorage(REFRESH_TOKEN_NAME) || null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [tokenExpiry, setTokenExpiry] = useState(null);

  const secureAxios = axios.create({
    baseURL: API_URL,
    withCredentials: true,
  });

  secureAxios.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      if (error.response?.status === 401 && !originalRequest._retry && refreshToken) {
        originalRequest._retry = true;

        try {
          const response = await axios.post(`${API_URL}/refresh-token`, {
            refreshToken,
          });

          const { token: newToken, refreshToken: newRefreshToken } = response.data;

          setTokens(newToken, newRefreshToken);

          originalRequest.headers["Authorization"] = `Bearer ${newToken}`;
          return axios(originalRequest);
        } catch (refreshError) {
          // Don't immediately logout on refresh error
          console.error("Token refresh failed:", refreshError);
          return Promise.reject(refreshError);
        }
      }

      return Promise.reject(error);
    }
  );

  const setTokens = useCallback((accessToken, refresh = null) => {
    if (accessToken) {
      // Set in both cookies and localStorage for redundancy
      Cookies.set(TOKEN_NAME, accessToken, COOKIE_OPTIONS);
      saveTokenToLocalStorage(TOKEN_NAME, accessToken);
      setToken(accessToken);

      try {
        const payload = JSON.parse(atob(accessToken.split('.')[1]));
        if (payload.exp) {
          setTokenExpiry(payload.exp * 1000);
        }
      } catch (e) {
        console.error("Error decoding token:", e);
      }
    }

    if (refresh) {
      // Set refresh token in both cookies and localStorage
      Cookies.set(REFRESH_TOKEN_NAME, refresh, COOKIE_OPTIONS);
      saveTokenToLocalStorage(REFRESH_TOKEN_NAME, refresh);
      setRefreshToken(refresh);
    }
  }, []);

  const loadUser = useCallback(async () => {
    console.log("🔁 loadUser called", getTokenFromStorage(TOKEN_NAME));
  
    // First, check if we have tokens in either cookies or localStorage
    const currentToken = getTokenFromStorage(TOKEN_NAME);
    const currentRefreshToken = getTokenFromStorage(REFRESH_TOKEN_NAME);
    
    // Update state with any found tokens
    if (currentToken && currentToken !== token) {
      setToken(currentToken);
    }
    
    if (currentRefreshToken && currentRefreshToken !== refreshToken) {
      setRefreshToken(currentRefreshToken);
    }
  
    if (!currentToken) {
      console.log("⛔ No token found");
      setLoading(false);
      return;
    }
  
    try {
      console.log("✅ Token found:", currentToken);
  
      if (tokenExpiry) {
        console.log("⏰ Token expiry time:", tokenExpiry);
      }
  
      if (tokenExpiry && Date.now() > tokenExpiry) {
        console.log("⚠️ Token expired");
  
        if (currentRefreshToken) {
          console.log("🔄 Refresh token available, trying to refresh...");
  
          const refreshResponse = await axios.post(`${API_URL}/refresh-token`, {
            refreshToken: currentRefreshToken,
          });
  
          console.log("✅ Token refreshed:", refreshResponse.data.token);
          setTokens(refreshResponse.data.token, refreshResponse.data.refreshToken);
        } else {
          console.log("⛔ No refresh token available, session expired");
          throw new Error("Session expired");
        }
      }
  
      console.log("📡 Sending request to load user");
  
      const response = await secureAxios.get(
        `http://localhost:8000/api/v1/dashboard-user`,
        {
          headers: {
            Authorization: `Bearer ${currentToken}`,
          },
        }
      );
  
      console.log("✅ User loaded successfully:", response.data);
  
      setUser(response.data.data);
      setIsAuthenticated(true);
      setError(null);
    } catch (err) {
      console.error("❌ Authentication error:", err);
  
      const errorMessage = err.response?.data?.message || "Session expired. Please log in again.";
      setError(errorMessage);
      console.log("⚠️ Error message set:", errorMessage);
  
      // Don't clear auth state on 401 - let the token refresh mechanism try first
      // Only logout if specifically requested
    } finally {
      console.log("🔚 Finished loadUser");
      setLoading(false);
    }
  }, [token, refreshToken, tokenExpiry, setTokens]);
  
  useEffect(() => {
    loadUser();
    
    // Add event listener to detect local storage changes from other tabs
    const handleStorageChange = (e) => {
      if (e.key === TOKEN_NAME || e.key === REFRESH_TOKEN_NAME) {
        loadUser();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [loadUser]);

  // Effect to refresh token before expiry
  useEffect(() => {
    if (!tokenExpiry || !refreshToken) return;

    // Refresh 5 minutes before expiry
    const timeUntilRefresh = tokenExpiry - Date.now() - (5 * 60 * 1000);

    if (timeUntilRefresh <= 0) {
      // Token already expired or about to expire, refresh immediately
      refreshAccessToken();
      return;
    }

    const refreshTimer = setTimeout(refreshAccessToken, timeUntilRefresh);

    return () => clearTimeout(refreshTimer);
  }, [tokenExpiry, refreshToken]);

  // Function to refresh the access token
  const refreshAccessToken = async () => {
    if (!refreshToken) return;

    try {
      const response = await axios.post(`${API_URL}/refresh-token`, {
        refreshToken,
      });

      setTokens(response.data.token, response.data.refreshToken);
    } catch (err) {
      console.error("Token refresh failed:", err);
      // Don't automatically logout on refresh failure
      // The user might still have a valid session
    }
  };

  // Clear all auth state
  const clearAuthState = () => {
    Cookies.remove(TOKEN_NAME, { path: "/" });
    Cookies.remove(REFRESH_TOKEN_NAME, { path: "/" });
    localStorage.removeItem(TOKEN_NAME);
    localStorage.removeItem(REFRESH_TOKEN_NAME);
    setToken(null);
    setRefreshToken(null);
    setUser(null);
    setIsAuthenticated(false);
    setError(null);
    setTokenExpiry(null);
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      if (token) {
        await secureAxios.get(`/logout`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } catch (err) {
      console.warn("Logout error:", err);
    } finally {
      clearAuthState();
      router("/");
    }
  };

  // Handle login
  const handleLogin = async (credentials) => {
    try {
      setLoading(true);
      setError(null);

      const { email, password } = credentials;

      // Validate inputs
      if (!email || !password) {
        throw new Error("Email and password are required");
      }

      const response = await axios.post(`${API_URL}/clinic/login`, {
        email,
        password,
      });
      console.log(response);

      const { token: accessToken, refreshToken: newRefreshToken, user: userData } = response.data;

      // Store tokens and user data
      setTokens(accessToken, newRefreshToken);
      setUser(userData);
      setIsAuthenticated(true);

      return { success: true, user: userData };
    } catch (err) {
      console.error("Login error:", err);

      // Set appropriate error message
      const errorMessage = err.response?.data?.message ||
        "Login failed. Please check your credentials and try again.";

      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const validateToken = async () => {
    if (!token) return false;

    try {
      await secureAxios.get(`/validate-token`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return true;
    } catch (err) {
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        loading,
        error,
        isAuthenticated,
        login: handleLogin,
        logout: handleLogout,
        validateToken,
        refreshToken: refreshAccessToken,
        clearError: () => setError(null),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;