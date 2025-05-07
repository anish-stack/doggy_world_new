import { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import { API_END_POINT_URL_LOCAL } from "../constant/constant";
import { useToken } from "./useToken";

export const getUser = () => {
    const { isLoggedIn, token } = useToken();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const lastUserHash = useRef(null);
    const lastFetchTime = useRef(null);

    const REFRESH_INTERVAL = 300000; // 5 minutes

    const hashObject = (obj) => {
        if (!obj) return '';
        return JSON.stringify(obj);
    };

    const fetchUser = useCallback(async (forceRefresh = false) => {
        // Don't fetch if token is missing
        if (!token) return;

        // Don't fetch if we've fetched recently, unless forced
        const now = Date.now();
        if (
            !forceRefresh &&
            lastFetchTime.current &&
            now - lastFetchTime.current < REFRESH_INTERVAL
        ) {
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await axios.get(
                `${API_END_POINT_URL_LOCAL}/api/v1/pet-profile`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const userData = response?.data?.data || {};
            const userHash = hashObject(userData);

            if (userHash !== lastUserHash.current) {
                setUser(userData);
                lastUserHash.current = userHash;
            }

            lastFetchTime.current = now;
        } catch (err) {
            const errorMessage = err?.response?.data?.error?.message || "An error occurred";
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        let interval;

        // Clear previous data when login state changes
        if (!isLoggedIn || !token) {
            setUser(null);
            lastUserHash.current = null;
            lastFetchTime.current = null;
            return;
        }

        // Initial fetch
        fetchUser(true);

        // Set up interval for periodic fetches
        interval = setInterval(() => {
            fetchUser();
        }, REFRESH_INTERVAL);

        return () => clearInterval(interval);
    }, [isLoggedIn, token, fetchUser]);

    return {
        refreshUser: () => fetchUser(true),
        user,
        loading,
        error
    };
};