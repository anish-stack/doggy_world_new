import { useState, useCallback } from 'react';
import axios from 'axios';
import { API_END_POINT_URL_LOCAL } from '../constant/constant';



const useGetBannersHook = () => {
    const [sliders, setSliders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchBanners = useCallback(async (type) => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_END_POINT_URL_LOCAL}/api/v1/service-banner/${type}`);

            if (response?.data?.success) {
                const banner = response?.data?.data?.imageUrl
                    .filter((item) => item.isActive)
                    .sort((a, b) => Number(a.position) - Number(b.position));

                setSliders(banner);
            }
            setError(null);
        } catch (err) {
            setError('Failed to load banners');
            console.error('Error fetching banners:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    return { sliders, loading, error, fetchBanners };
};

export default useGetBannersHook;