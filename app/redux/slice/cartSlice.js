import { createSlice } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';

const initialState = {
    CartItems: [],
    CartCount: 0,
    loading: false,
    error: null,
};

const storeCartItems = async (cartItems) => {
    try {
        await AsyncStorage.setItem('CartItems', JSON.stringify(cartItems));
    } catch (error) {
        console.log('Error storing cart items:', error);
    }
};

// Function to retrieve cart items from AsyncStorage
const loadCartItems = async () => {
    try {
        const cartItems = await AsyncStorage.getItem('CartItems');
        return cartItems ? JSON.parse(cartItems) : [];
    } catch (error) {
        console.log('Error loading cart items:', error);
        return [];
    }
};

const CartSlice = createSlice({
    name: 'cart',
    initialState,
    reducers: {
        AddingStart: (state) => {
            state.loading = true;
            state.error = null;
        },
        AddingSuccess: (state, action) => {
            state.loading = false;

            const newCartItems = action.payload.Cart;
            newCartItems.forEach((newItem) => {
                const existingItem = state.CartItems.find((item) => item.ProductId === newItem.ProductId);

                if (existingItem) {
                    // If the product already exists, increase the quantity
                    existingItem.quantity += newItem.quantity;
                    // Toast.show({
                    //     type: 'success',
                    //     text1: 'Quantity updated in cart!',
                    // });
                } else {
                    // If the product is new, add it to the cart
                    state.CartItems.push(newItem);
                }
            });

            state.CartCount = state.CartItems.length;
            storeCartItems(state.CartItems);

            // Toast.show({
            //     type: 'success',
            //     text1: 'Item added to cart!',
            // });
        },


        AddingFailure: (state, action) => {
            state.loading = false;
            state.error = action.payload;
            Toast.show({
                type: 'error',
                text1: action.payload,
            });
        },
        RemoveCartItem: (state, action) => {
            console.log(" action.payload", action.payload)
            const { ProductId } = action.payload;
            state.CartItems = state.CartItems.filter(item => item.ProductId !== ProductId);
            state.CartCount = state.CartItems.length;
            storeCartItems(state.CartItems);
           
        },

        UpdateCartItem: (state, action) => {
            const { ProductId, quantity } = action.payload;

            const itemIndex = state.CartItems.findIndex(item => item.ProductId === ProductId);
            if (itemIndex !== -1) {
                state.CartItems[itemIndex].quantity = quantity;
                if (state.CartItems[itemIndex].quantity === 0) {
                    state.CartItems.splice(itemIndex, 1);
                    state.CartCount = state.CartItems.length;
                 
                }
                storeCartItems(state.CartItems);
               
            }
        },
        AllItemRemove: (state, action) => {
            state.CartItems = action.payload;
            state.CartCount = action.payload.length;
            storeCartItems(state.CartItems);
        },
        SetCartItems: (state, action) => {
            state.CartItems = action.payload;
            state.CartCount = action.payload.length;
            storeCartItems(state.CartItems);
        },
    },
}); 

export const { AddingStart, AddingSuccess, AddingFailure, RemoveCartItem, UpdateCartItem, SetCartItems, AllItemRemove } = CartSlice.actions;

// Function to load cart items when the app starts (use in the component lifecycle)
export const loadCart = () => async (dispatch) => {
    const cartItems = await loadCartItems();
    dispatch(SetCartItems(cartItems));
};

export default CartSlice.reducer;
