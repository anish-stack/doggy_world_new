import axios from 'axios'
import { API_END_POINT_URL_LOCAL } from '../../../../constant/constant'



export const fetchFlavours = async () => {
    try {
        const { data } = await axios.get(`${API_END_POINT_URL_LOCAL}/api/v1/cake-flavours`)
        if (data.data) {
            
            const filterOut = data.data.filter((item) => item.isActive)
             
            return filterOut
        } else {
            return []
        }
    } catch (error) {
        console.error('Error fetching flavours:', error)
        throw new Error(error.response.data)
    }
}


export const fetchQunatity = async () => {
    try {
        const { data } = await axios.get(`${API_END_POINT_URL_LOCAL}/api/v1/cake-sizes`)
        if (data.data) {
            const filterOut = data.data.filter((item) => item.isActive)
            return filterOut
        } else {
            return []
        }
    } catch (error) {
        console.error('Error fetching Qunatity:', error)
        throw new Error(error.response.data)
    }
}

export const fetchCakeDesign = async () => {
    try {
        const { data } = await axios.get(`${API_END_POINT_URL_LOCAL}/api/v1/cake-design`)
        if (data.data) {
            const filterOut = data.data.filter((item) => item.is_active)
            return filterOut
        } else {
            return []
        }
    } catch (error) {
        console.error('Error fetching Cake Design:', error)
        throw new Error(error.response.data)
    }
}


export const fetchClinics = async () => {
    try {
        const { data } = await axios.get(`${API_END_POINT_URL_LOCAL}/api/v1/clinic/get-all-clinic`)
        if (data.data) {
            return data.data;
        }
        else {
            return [];
        }
    } catch (err) {
        console.log("error", error)
        throw new Error(err.response.data);

    }
};