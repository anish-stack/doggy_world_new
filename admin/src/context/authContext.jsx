import React, { createContext, useState, useEffect, useCallback } from "react";
import Cookies from "js-cookie";
import axios from "axios";
import { API_URL } from "@/constant/Urls";
import { useNavigate } from "react-router-dom";


// Create the Auth Context
const AuthContext = createContext();

// Cookie configuration for better security
const COOKIE_OPTIONS = {
  secure: false,
  sameSite: "strict",
  expires: 7,
  path: "/",
};

// Token names
const TOKEN_NAME = "_usertoken";
const REFRESH_TOKEN_NAME = "_refreshtoken";

export const AuthProvider = ({ children }) => {
  const router = useNavigate();
  const [token, setToken] = useState(Cookies.get(TOKEN_NAME) || null);
  const [refreshToken, setRefreshToken] = useState(Cookies.get(REFRESH_TOKEN_NAME) || null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
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

          handleLogout();
          return Promise.reject(refreshError);
        }
      }

      return Promise.reject(error);
    }
  );


  const setTokens = useCallback((accessToken, refresh = null) => {
    if (accessToken) {
      Cookies.set(TOKEN_NAME, accessToken, COOKIE_OPTIONS);
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
      Cookies.set(REFRESH_TOKEN_NAME, refresh, COOKIE_OPTIONS);
      setRefreshToken(refresh);
    }
  }, []);


  const loadUser = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {

      if (tokenExpiry && Date.now() > tokenExpiry) {

        if (refreshToken) {

          const refreshResponse = await axios.post(`${API_URL}/refresh-token`, {
            refreshToken,
          });

          setTokens(refreshResponse.data.token, refreshResponse.data.refreshToken);
        } else {
          throw new Error("Session expired");
        }
      }

      const response = await secureAxios.get(
        `/dashboard-user`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setUser(response.data.user);
      setIsAuthenticated(true);
      setError(null);
    } catch (err) {
      console.error("Authentication error:", err);
      setError(err.response?.data?.message || "Session expired. Please log in again.");

      // Clear authentication if token is invalid
      if (err.response?.status === 401) {
        clearAuthState();
      }
    } finally {
      setLoading(false);
    }
  }, [token, refreshToken, tokenExpiry, setTokens]);

  // Effect to load user on mount or token change
  useEffect(() => {
    loadUser();
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
      // If refresh fails, user needs to re-authenticate
      if (isAuthenticated) {
        handleLogout();
      }
    }
  };

  // Clear all auth state
  const clearAuthState = () => {
    Cookies.remove(TOKEN_NAME, { path: "/" });
    Cookies.remove(REFRESH_TOKEN_NAME, { path: "/" });
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
      // clearAuthState();
      // router("/");
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
      console.log(response)

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