// Mock Firebase functions to prevent actual Firebase initialization
export const firestore = {};
export const doc = jest.fn();
export const setDoc = jest.fn();
export const deleteDoc = jest.fn();
export const updateDoc = jest.fn();
export const onSnapshot = jest.fn();
export const collection = jest.fn();
export const addDoc = jest.fn();
export const serverTimestamp = jest.fn();
export const getDoc = jest.fn();
export const increment = jest.fn(() => 1);
