import axios from 'axios'

const BASE_API_URL = 'https://admindoggy.adsdigitalmedia.com/api'

export const fetchFlavours = async () => {
    try {
        const { data } = await axios.get(`${BASE_API_URL}/flavours?populate=*`)
        if (data.data) {
            const filterOut = data.data.filter((item) => item.active)
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
        const { data } = await axios.get(`${BASE_API_URL}/quantities`)
        if (data.data) {
            const filterOut = data.data.filter((item) => item.is_active)
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
        const { data } = await axios.get(`${BASE_API_URL}/design-datas?populate=*`)
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
        const { data } = await axios.get(`${BASE_API_URL}/clinics`)
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