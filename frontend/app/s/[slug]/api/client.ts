
import axios from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1';

export const customerApi = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const CustomerService = {
    // 1. Get Store ID by Slug
    getStoreBySlug: async (slug: string) => {
        const res = await customerApi.get(`/s/live/${slug}`);
        return res.data;
    },

    // 2. Login
    login: async (email: string, pass: string, storeId: string) => {
        const res = await customerApi.post(`/store/customers/login`, {
            email,
            password: pass,
            store_id: storeId,
        });
        return res.data;
    },

    // 3. Register
    register: async (name: string, email: string, pass: string, storeId: string) => {
        const res = await customerApi.post(`/store/customers/register`, {
            name,
            email,
            password: pass,
            store_id: storeId,
        });
        return res.data;
    }
};
