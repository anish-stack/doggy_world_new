import { useEffect, useState } from 'react';
import axios from 'axios';
import { useToken } from './useToken';
import { API_END_POINT_URL_LOCAL } from '../constant/constant';

axios.defaults.withCredentials = true;

const useUserAddress = () => {
    const { token } = useToken();
    const [address, setAddress] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const getAddress = async (userId) => {
        
        if (!token) {
            setError('Authentication token missing');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get(`${API_END_POINT_URL_LOCAL}/api/v1/addresses`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
    
    
            setAddress(response.data.data || []);
        } catch (err) {
            console.error("Error fetching address:", err);
            setError(err.message || 'Failed to fetch address');
        } finally {
            setLoading(false);
        }
    };
    

    const createAddress = async (newAddress) => {
        if (!token) {
            setError('Authentication token missing');
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const response = await axios.post(
                `${API_END_POINT_URL_LOCAL}/api/v1/addresses/`,
                newAddress,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            setAddress(response.data.data); // Adjust as per actual response
        } catch (err) {
            setError(err.message || 'Failed to create address');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
      
        getAddress()
    
    }, [token])

    return {
        address,
        loading,
        error,
        getAddress,
        createAddress,
    };
};

export default useUserAddress;
