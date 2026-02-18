"use client";
import React, { useEffect } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import { StoreProvider } from "../contexts/StoreContext";
import { AuthProvider } from "../contexts/AuthContext";
import { ReactQueryProvider } from "./ReactQueryProvider";
import ReduxProvider from "../store/ReduxProvider";
import { LoadingProvider } from "../contexts/LoadingContext";
import { GlobalLoadingOverlay } from "../components/ui/GlobalLoadingOverlay";
import { refreshAuthHeaders } from "../lib/api";

const theme = createTheme({
  palette: {
    primary: { main: "#0057FF" },
    secondary: { main: "#00B2FF" },
    background: { default: "#FAFBFC" },
  },
  typography: { fontFamily: "Inter, system-ui, Arial, sans-serif" },
});

export function AppProviders({ children }: { children: React.ReactNode }) {
  // Refresh auth headers on app load
  useEffect(() => {
    refreshAuthHeaders();
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ReduxProvider>
        <AuthProvider>
          <StoreProvider>
            <LoadingProvider>
              <ReactQueryProvider>
                {children}
                <GlobalLoadingOverlay />
                <ToastContainer
                  position="top-right"
                  autoClose={2500}
                  newestOnTop
                  closeOnClick
                  pauseOnFocusLoss={false}
                  draggable
                  pauseOnHover
                  theme="colored"
                />
              </ReactQueryProvider>
            </LoadingProvider>
          </StoreProvider>
        </AuthProvider>
      </ReduxProvider>
    </ThemeProvider>
  );
}
