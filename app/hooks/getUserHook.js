import { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import { API_END_POINT_URL } from "../constant/constant";
import { useToken } from "./useToken";

export const getUser = () => {
    const { isLoggedIn, token } = useToken();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [orderData, setOrderData] = useState(null);
    
    // References to store last fetched data hashes for comparison
    const lastUserHash = useRef(null);
    const lastOrdersHash = useRef(null);
    const lastFetchTime = useRef(null);
    
    // Minimum time between refetches (5 minutes instead of every minute)
    const REFRESH_INTERVAL = 300000; // 5 minutes
    
    // Simple hash function to compare objects
    const hashObject = (obj) => {
        if (!obj) return '';
        return JSON.stringify(obj);
    };

    const getUserOrders = useCallback(async (userId) => {
        if (!userId) return;
        
        console.log("Fetching orders for user ID:", userId);
        setLoading(true);
        
        try {
            const response = await axios.get(`${API_END_POINT_URL}/api/findMyAllOrders?id=${userId}`);
            const newOrders = response.data.orders;
            const ordersHash = hashObject(newOrders);
            
            // Only update state if orders have changed
            if (ordersHash !== lastOrdersHash.current) {
                setOrderData(newOrders);
                lastOrdersHash.current = ordersHash;
            }
        } catch (err) {
            console.error("Error fetching orders:", err?.response?.data?.error?.message || err.message);
            setError(err?.response?.data?.error?.message || "Failed to fetch orders");
        } finally {
            setLoading(false);
        }
    }, []);

    const getUserFnc = useCallback(async (forceRefresh = false) => {
        // Don't fetch if token is missing
        if (!token) {
            return;
        }
        
        // Don't fetch if we've fetched recently, unless forced
        const now = Date.now();
        if (!forceRefresh && 
            lastFetchTime.current && 
            now - lastFetchTime.current < REFRESH_INTERVAL) {
            return;
        }
        
        setLoading(true);
        setError(null);
        console.log("Fetching user data...");
        
        try {
            const response = await axios.get(`${API_END_POINT_URL}/api/auth/me`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            
            const userData = response?.data?.data || {};
            const userHash = hashObject(userData);
            
            // Only update if user data has changed
            if (userHash !== lastUserHash.current) {
                console.log("User data updated");
                setUser(userData);
                lastUserHash.current = userHash;
                
                // Only fetch orders if user ID exists and has changed
                if (userData?.id) {
                    await getUserOrders(userData.id);
                }
            }
            
            // Update last fetch time
            lastFetchTime.current = now;
        } catch (err) {
            console.error("Error fetching user:", err?.response);
            setError(err?.response?.data?.error?.message || "An error occurred");
        } finally {
            setLoading(false);
        }
    }, [token, getUserOrders]);

    useEffect(() => {
        let interval;
        
        // Clear previous data when login state changes
        if (!isLoggedIn || !token) {
            setUser(null);
            setOrderData(null);
            lastUserHash.current = null;
            lastOrdersHash.current = null;
            lastFetchTime.current = null;
            return;
        }
        
        // Initial fetch with force refresh
        getUserFnc(true);
        
        // Set up interval with longer duration
        interval = setInterval(() => {
            getUserFnc();
        }, REFRESH_INTERVAL);
        
        return () => clearInterval(interval);
    }, [isLoggedIn, token, getUserFnc]);

    return { 
        getUserFnc: () => getUserFnc(true),
        user, 
        orderData, 
        loading, 
        error 
    };
};