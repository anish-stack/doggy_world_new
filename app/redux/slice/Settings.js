import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// Initial state
const initialState = {
  settings: {}, 
  loading: false, 
  error: null, 
};


export const fetchSettings = createAsyncThunk(
  "settings/fetchSettings",
  async (_, thunkApi) => {
    try {
      console.log("Fetching settings from server...");
      const { data } = await axios.get("https://admindoggy.adsdigitalmedia.com/api/settings");
      return data.data[0];
    } catch (error) {
      return thunkApi.rejectWithValue(
        error.response?.data?.error?.message || "Failed to fetch settings"
      );
    }
  }
);


const settingsSlice = createSlice({
  name: "settings", 
  initialState,
  extraReducers: (builder) => {
    builder
   
      .addCase(fetchSettings.pending, (state) => {
        state.loading = true;
        state.error = null; 
      })
     
      .addCase(fetchSettings.fulfilled, (state, action) => {
        state.loading = false;
        state.settings = action.payload;
      })
   
      .addCase(fetchSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Something went wrong";
      });
  },
});


export default settingsSlice.reducer;
