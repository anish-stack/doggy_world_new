import { useState, useEffect } from "react";
import * as SecureStore from "expo-secure-store";

export const useToken = () => {
    const TOKEN_KEY = "user_token";
    const [token, setToken] = useState(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    const getToken = async () => {
        try {
            const storedToken = await SecureStore.getItemAsync(TOKEN_KEY);
            
            setToken(storedToken);
            setIsLoggedIn(!!storedToken); 
            
          

            return storedToken;
        } catch (error) {
            console.error("Error getting token:", error);
            setToken(null);
            setIsLoggedIn(false);
            return null;
        }
    };

    const saveToken = async (newToken) => {
        try {
            await SecureStore.setItemAsync(TOKEN_KEY, newToken);
            setToken(newToken);
            setIsLoggedIn(true);
        } catch (error) {
            console.error("Error saving token:", error);
        }
    };

    const deleteToken = async () => {
        try {
            await SecureStore.deleteItemAsync(TOKEN_KEY);
            setToken(null);
            setIsLoggedIn(false);
        } catch (error) {
            console.error("Error deleting token:", error);
        }
    };

    useEffect(() => {
        getToken();
    }, []);

    return { token, getToken, saveToken, deleteToken, isLoggedIn };
};
