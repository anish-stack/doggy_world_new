import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_END_POINT_URL_LOCAL } from '../constant/constant';

const useSettingsHook = () => {
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await axios.get(`${API_END_POINT_URL_LOCAL}/api/v1/settings`);
                
                setSettings(response.data.data); 
            } catch (err) {
                setError(err.response?.data?.message || err.message || 'Failed to fetch settings');
            } finally {
                setLoading(false);
            }
        };

        fetchSettings();
    }, []);

    return { settings, loading, error };
};

export default useSettingsHook;
