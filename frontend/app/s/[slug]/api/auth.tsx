
"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CustomerService } from "./client";

type Customer = {
    id: string;
    name: string;
    email: string;
    store_id: string;
};

type CustomerAuthContextType = {
    customer: Customer | null;
    loading: boolean;
    login: (email: string, pass: string, storeId: string) => Promise<boolean>;
    signup: (name: string, email: string, pass: string, storeId: string) => Promise<boolean>;
    logout: () => void;
    isAuthenticated: boolean;
};

const CustomerAuthContext = createContext<CustomerAuthContextType>({
    customer: null,
    loading: true,
    login: async () => false,
    signup: async () => false,
    logout: () => { },
    isAuthenticated: false,
});

export const useCustomerAuth = () => useContext(CustomerAuthContext);

export const CustomerAuthProvider = ({ children, storeId }: { children: React.ReactNode, storeId: string }) => {
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    // Store-specific keys for multi-store support
    const DATA_KEY = `customer_data_${storeId}`;
    const TOKEN_KEY = `customer_token_${storeId}`;

    useEffect(() => {
        if (typeof window !== "undefined" && storeId) {
            const stored = localStorage.getItem(DATA_KEY);
            if (stored) {
                try {
                    const parsed = JSON.parse(stored);
                    setCustomer(parsed);
                } catch (e) {
                    console.error("Invalid customer data", e);
                }
            }
            setLoading(false);
        }
    }, [storeId, DATA_KEY]);

    const login = async (email: string, pass: string, sid: string) => {
        try {
            setLoading(true);
            const res = await CustomerService.login(email, pass, sid);
            if (res.success && res.token) {
                localStorage.setItem(`customer_token_${sid}`, res.token);
                localStorage.setItem(`customer_data_${sid}`, JSON.stringify(res.customer));
                setCustomer(res.customer);
                return true;
            }
            return false;
        } catch (e) {
            console.error("Login failed", e);
            return false;
        } finally {
            setLoading(false);
        }
    };

    const signup = async (name: string, email: string, pass: string, sid: string) => {
        try {
            setLoading(true);
            const res = await CustomerService.register(name, email, pass, sid);
            if (res.success && res.token) {
                localStorage.setItem(`customer_token_${sid}`, res.token);
                localStorage.setItem(`customer_data_${sid}`, JSON.stringify(res.customer));
                setCustomer(res.customer);
                return true;
            }
            return false;
        } catch (e) {
            console.error("Signup failed", e);
            return false;
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(DATA_KEY);
        setCustomer(null);
        router.refresh();
    };

    return (
        <CustomerAuthContext.Provider value={{ customer, loading, login, signup, logout, isAuthenticated: !!customer }}>
            {children}
        </CustomerAuthContext.Provider>
    );
};
