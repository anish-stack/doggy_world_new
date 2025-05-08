import { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import { API_END_POINT_URL_LOCAL } from '../constant/constant';



const useClinic = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [clinics, setClinics] = useState([]);

    const getClinics = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await axios.get(`${API_END_POINT_URL_LOCAL}/api/v1/clinic/get-all-clinic`);
            if (response.data && response.data.success) {
                setClinics(response.data.data || []);
            } else {
                setError('Failed to fetch clinic details');
            }
        } catch (error) {
            setError('Error connecting to server');
            console.error('Error fetching clinics:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        getClinics()
    }, [])

    return { loading, error, clinics, getClinics };
};

export default useClinic;