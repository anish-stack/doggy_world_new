import React, { createContext, useState, useEffect } from "react";
import Cookies from "js-cookie";
import axios from "axios";
import { API_URL } from "@/constant/Urls";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(Cookies.get("_usertoken") || null);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        const loadUser = async () => {
            console.log("Checking token:", token);

            if (!token) {
                setLoading(false);
                return;
            }

            try {
                const response = await axios.get(`${API_URL}/auth/dashboard-user?token=${token}`);

                console.log("User data loaded:", response.data);
                setUser(response.data.user);
                setIsAuthenticated(true);
            } catch (err) {
                console.error("Authentication error:", err);
                setError(err.response?.data?.message || "Session expired. Please log in again.");

            } finally {
                setLoading(false);
            }
        };

        loadUser();
    }, [token]);

    const handleLogout = async () => {
        try {
            await axios.get(`${API_URL}/auth/logout`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                withCredentials: true,
            });
            window.location.href = "/";
        } catch (err) {
            console.warn("Logout error:", err);
        } finally {
            Cookies.remove("_usertoken");
            setToken(null);
            setUser(null);
            setIsAuthenticated(false);
            setError(null);
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
                logout: handleLogout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
