import { createSlice } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';

const initialState = {
    labTests: [],
    labTestsCount: 0,
    loading: false,
    error: null,
};

const storeLabTests = async (labTests) => {
    try {
        await AsyncStorage.setItem('labTests', JSON.stringify(labTests));
    } catch (error) {
        console.log('Error storing lab test items:', error);
    }
};

const deleteTests = async () => {
    console.log("Hey i am calling delete")
    try {
        await AsyncStorage.removeItem('labTests');
    } catch (error) {
        console.log('Error storing lab test items:', error);
    }
};

const loadLabTests = async () => {
    try {
        const storedLabTests = await AsyncStorage.getItem('labTests');
        return storedLabTests ? JSON.parse(storedLabTests) : [];
    } catch (error) {
        console.log('Error loading lab test items:', error);
        return [];
    }
};

const LabTestsSlice = createSlice({
    name: 'labTests',
    initialState,
    reducers: {
        AddingStart: (state) => {
            state.loading = true;
            state.error = null;
        },
        AddingSuccess: (state, action) => {
            state.loading = false;

            const newLabTests = action.payload;
            console.log(newLabTests)
            newLabTests.forEach((newTest) => {
                const existingTest = state.labTests.find((test) => test.documentId === newTest.documentId);

                if (existingTest) {

                    existingTest.quantity += newTest.quantity;

                } else {
                    state.labTests.push(newTest);

                }
            });

            state.labTestsCount = state.labTests.length;
            storeLabTests(state.labTests);

            // Toast.show({
            //     type: 'success',
            //     text1: 'Lab test added successfully!',
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
        RemoveLabTest: (state, action) => {
            const { testIdToRemove } = action.payload;
            state.labTests = state.labTests.filter(test => test.documentId !== testIdToRemove);
            state.labTestsCount = state.labTests.length;
            storeLabTests(state.labTests);
        },
        UpdateLabTest: (state, action) => {
            const { TestId, quantity } = action.payload;

            const testIndex = state.labTests.findIndex(test => test.TestId === TestId);
            if (testIndex !== -1) {
                state.labTests[testIndex].quantity = quantity;
                if (state.labTests[testIndex].quantity === 0) {
                    state.labTests.splice(testIndex, 1);
                    state.labTestsCount = state.labTests.length;
                }
                storeLabTests(state.labTests);
            }
        },
        AllLabTestsRemove: (state) => {
            state.labTests = [];
            state.labTestsCount = 0;
            storeLabTests(state.labTests);
        },
        SetLabTests: (state, action) => {
            state.labTests = action.payload;
            state.labTestsCount = action.payload.length;
            storeLabTests(state.labTests);
        },
    },
});

export const {
    AddingStart,
    AddingSuccess,
    AddingFailure,
    RemoveLabTest,
    UpdateLabTest,
    SetLabTests,
    AllLabTestsRemove,
} = LabTestsSlice.actions;

export const loadLabTestsFromStorage = () => async (dispatch) => {
    const labTests = await loadLabTests();
    dispatch(SetLabTests(labTests));
};

export default LabTestsSlice.reducer;
