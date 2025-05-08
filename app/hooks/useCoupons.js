import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_END_POINT_URL_LOCAL } from '../constant/constant';

const useCoupons = (type) => {
    const [coupons, setCoupons] = useState([]);
    const [cloading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchCoupons = async () => {
            try {
                setLoading(true);
                const response = await axios.get(`${API_END_POINT_URL_LOCAL}/api/v1/get-coupons?type=${type}`);
                setCoupons(response.data.data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (type) {
            fetchCoupons();
        }
    }, [type]);

    return { coupons, cloading, error };
};

export default useCoupons;