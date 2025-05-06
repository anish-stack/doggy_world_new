import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const initialState = {
    service: [],
    serviceCount: 0,
    loading: false,
    error: null,
};

export const fetchService = createAsyncThunk(
    'service/fetchService',
    async (_, thunkApi) => {


        try {
            const { data } = await axios.get('https://admindoggy.adsdigitalmedia.com/api/v1/Doctors/Get-Services');

            return data.data;
        } catch (error) {
            return thunkApi.rejectWithValue(error);
        }
    }
);

const serviceSlice = createSlice({
    name: 'service',
    initialState: [],
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchService.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchService.fulfilled, (state, action) => {
                console.log("i am action", action)
                state.loading = false;
                state.service = action.payload;
                state.serviceCount = action.payload.length;
            })
            .addCase(fetchService.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || 'Something went wrong';
            });
    },
});

export default serviceSlice.reducer;
