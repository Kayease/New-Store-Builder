
"use client";
import React, { useState } from 'react';
import { useRouter } from "next/navigation";
import Link from 'next/link';
import { CustomerService } from "./client";
import { useCustomerAuth } from './auth';

export default function LoginForm({ slug }: { slug: string }) {
    const { login } = useCustomerAuth();
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const storeRes = await CustomerService.getStoreBySlug(slug);
            const storeId = storeRes.data?.store?.id;
            if (!storeId) throw new Error("Store Not Found");

            const success = await login(email, password, storeId);
            if (success) {
                router.push(`/s/${slug}/live`);
            } else {
                setError("Login Failed. Check your credentials.");
            }
        } catch (err: any) {
            const msg = err.response?.data?.detail || err.message || "Invalid credentials";
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-gray-900">Welcome Back</h2>
                    <p className="text-gray-500 mt-2">Sign in to your account</p>
                </div>
                {error && <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">⚠️ {error}</div>}
                <form onSubmit={handleLogin} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input type="email" required className="w-full px-4 py-3 rounded-lg border border-gray-200 outline-none" value={email} onChange={e => setEmail(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                        <input type="password" required className="w-full px-4 py-3 rounded-lg border border-gray-200 outline-none" value={password} onChange={e => setPassword(e.target.value)} />
                    </div>
                    <button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-lg transition-all shadow-lg border-none cursor-pointer">
                        {loading ? "Signing In..." : "Sign In"}
                    </button>
                </form>
                <div className="mt-8 text-center text-sm text-gray-500">
                    Don't have an account? <Link href={`/s/${slug}/signup`} className="text-indigo-600 font-bold hover:underline">Create Account</Link>
                </div>
            </div>
        </div>
    );
}
