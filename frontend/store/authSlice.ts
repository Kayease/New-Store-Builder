"use client";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type AuthUser = { id?: string; email: string; role?: string; firstName?: string; lastName?: string };
export type AuthState = { token: string | null; user: AuthUser | null };

const initialState: AuthState = { token: null, user: null };

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<{ token: string; user: AuthUser }>) {
      state.token = action.payload.token;
      state.user = action.payload.user;
    },
    clearCredentials(state) {
      state.token = null;
      state.user = null;
    },
  },
});

export const { setCredentials, clearCredentials } = authSlice.actions;
export default authSlice.reducer;


