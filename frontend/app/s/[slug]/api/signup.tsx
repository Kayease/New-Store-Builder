
"use client";
import React, { useState } from 'react';
import { useRouter } from "next/navigation";
import Link from 'next/link';
import { CustomerService } from "./client";
import { useCustomerAuth } from './auth';

export default function SignupForm({ slug }: { slug: string }) {
    const { signup } = useCustomerAuth();
    const router = useRouter();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const storeRes = await CustomerService.getStoreBySlug(slug);
            const storeId = storeRes.data?.store?.id;
            if (!storeId) throw new Error("Store Not Found");

            const success = await signup(name, email, password, storeId);
            if (success) {
                router.push(`/s/${slug}/live`);
            } else {
                setError("Registration Failed. Please try again.");
            }
        } catch (err: any) {
            const msg = err.response?.data?.detail || err.message || "Something went wrong";
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-gray-900">Create Account</h2>
                    <p className="text-gray-500 mt-2">Join our store community today</p>
                </div>
                {error && <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">⚠️ {error}</div>}
                <form onSubmit={handleSignup} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        <input type="text" required className="w-full px-4 py-3 rounded-lg border border-gray-200 outline-none" value={name} onChange={e => setName(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input type="email" required className="w-full px-4 py-3 rounded-lg border border-gray-200 outline-none" value={email} onChange={e => setEmail(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                        <input type="password" required className="w-full px-4 py-3 rounded-lg border border-gray-200 outline-none" value={password} onChange={e => setPassword(e.target.value)} />
                    </div>
                    <button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-lg transition-all shadow-lg border-none cursor-pointer">
                        {loading ? "Creating Account..." : "Create Account"}
                    </button>
                </form>
                <div className="mt-8 text-center text-sm text-gray-500">
                    Already have an account? <Link href={`/s/${slug}/login`} className="text-indigo-600 font-bold hover:underline">Sign In</Link>
                </div>
            </div>
        </div>
    );
}
