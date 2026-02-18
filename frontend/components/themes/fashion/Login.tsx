
"use client";
import React, { useState } from 'react';
import { useCustomerAuth } from '../../../app/s/[slug]/api/auth';
import { CustomerService } from '../../../app/s/[slug]/api/client';
import { useRouter } from "next/navigation";
import Link from 'next/link';

export default function FashionLogin({ slug }: { slug: string }) {
    const { login } = useCustomerAuth();
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const storeRes = await CustomerService.getStoreBySlug(slug);
            const storeId = storeRes.data?.store?.id;
            if (!storeId) throw new Error("Store Not Found");

            const success = await login(email, password, storeId);
            if (success) router.push(`/s/${slug}/live`);
            else setError("Access Denied. Check your details.");
        } catch (err: any) {
            setError(err.message || "Failed to enter the club.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white flex flex-col md:flex-row">
            {/* Dark Visual Side */}
            <div className="md:w-1/2 bg-black flex items-center justify-center p-12 text-white relative overflow-hidden">
                <div className="absolute inset-0 opacity-40 bg-[url('https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&q=80')] bg-cover bg-center"></div>
                <div className="relative z-10 text-center">
                    <h1 className="text-7xl font-black italic tracking-tighter leading-none mb-4 uppercase">Urban<br />Vogue</h1>
                    <p className="font-bold text-xs tracking-[0.5em] text-red-500 uppercase">Members Only</p>
                </div>
            </div>

            {/* Login Side */}
            <div className="md:w-1/2 flex items-center justify-center p-12 bg-white">
                <div className="w-full max-w-sm">
                    <div className="mb-12">
                        <h2 className="text-4xl font-black italic uppercase mb-2">Welcome Back</h2>
                        <p className="text-neutral-400 text-sm font-bold">Sign in to your style profile.</p>
                    </div>

                    {error && <div className="mb-8 font-bold text-red-500 text-xs border-l-4 border-red-500 pl-4 uppercase italic">{error}</div>}

                    <form onSubmit={handleLogin} className="space-y-8">
                        <div className="group border-b-2 border-neutral-200 focus-within:border-black transition-all pb-2">
                            <label className="block text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-1">Email Address</label>
                            <input
                                type="email"
                                required
                                className="w-full bg-transparent border-none outline-none font-bold text-lg"
                                placeholder="name@vogue.com"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                            />
                        </div>

                        <div className="group border-b-2 border-neutral-200 focus-within:border-black transition-all pb-2">
                            <label className="block text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-1">Password</label>
                            <input
                                type="password"
                                required
                                className="w-full bg-transparent border-none outline-none font-bold text-lg"
                                placeholder="••••••••"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-black text-white font-black py-5 text-lg hover:bg-neutral-800 transition active:scale-[0.98] cursor-pointer border-none uppercase tracking-widest italic"
                        >
                            {loading ? "AUTHENTICATING..." : "ENTER THE STORE"}
                        </button>
                    </form>

                    <div className="mt-12 text-center">
                        <span className="text-neutral-400 text-xs font-bold mr-2 uppercase">Not a member?</span>
                        <Link href={`/s/${slug}/signup`} className="text-black font-black text-xs uppercase hover:underline">Join the club</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
