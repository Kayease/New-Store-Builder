import { configureStore } from "@reduxjs/toolkit";
import { persistReducer, persistStore } from "redux-persist";
import authReducer from "./authSlice";

// Use no-op storage on server to avoid warnings
const createNoopStorage = () => {
  return {
    getItem(_key: string) {
      return Promise.resolve(null);
    },
    setItem(_key: string, value: any) {
      return Promise.resolve(value);
    },
    removeItem(_key: string) {
      return Promise.resolve();
    },
  } as unknown as Storage;
};
const storageImpl =
  typeof window !== "undefined"
    ? require("redux-persist/lib/storage").default
    : createNoopStorage();

const authPersistConfig = { key: "auth", storage: storageImpl };
const persistedAuth = persistReducer(
  authPersistConfig,
  authReducer as unknown as any
);

// Silence non-serializable checks for redux-persist actions
const {
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} = require("redux-persist/es/constants");

export const store = configureStore({
  reducer: { auth: persistedAuth },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});
export const persistor = persistStore(store);
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// ReduxProvider is exported from ./ReduxProvider to avoid JSX in a non-client module
