import { configureStore } from '@reduxjs/toolkit';
// import authReducer from './slice/Login.slice';
import CartReducer from './slice/cartSlice'
import LabReducer from './slice/labTestCart'

import settingsReducer from './slice/Settings'
export const store = configureStore({
    reducer: {
        settings: settingsReducer,
        cart: CartReducer,
        labCart:LabReducer
    },
});
