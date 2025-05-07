import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_END_POINT_URL_LOCAL } from '../constant/constant';

const usePetType = () => {
    const [petTypes, setPetTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchPetTypes = async () => {
            try {
                const response = await axios.get(`${API_END_POINT_URL_LOCAL}/api/v1/get-pet-type`);
                setPetTypes(response.data.data);
            } catch (err) {

                setError(err.message);
                throw new Error(err.response?.data.message)
            } finally {
                setLoading(false);
            }
        };

        fetchPetTypes();
    }, []);

    return { petTypes, loading, error };
};

export default usePetType;