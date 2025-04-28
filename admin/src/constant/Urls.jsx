import axios from "axios";
export const API_URL = "http://localhost:8000/api/v1";

export const fetcher = async (url) => {
    try {
        const response = await axios.get(url);
        return response.data; 
    } catch (error) {
        console.error("Error fetching data:", error);
        throw error; 
    }
};
