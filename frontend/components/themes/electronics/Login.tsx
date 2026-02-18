
"use client";
import React, { useState } from 'react';
import { useCustomerAuth } from '../../../app/s/[slug]/api/auth';
import { CustomerService } from '../../../app/s/[slug]/api/client';
import { useRouter } from "next/navigation";
import Link from 'next/link';

export default function ElectronicsLogin({ slug }: { slug: string }) {
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
                setError("Invalid hardware key or credentials");
            }
        } catch (err: any) {
            setError(err.message || "Connection failure");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0b0b0e] flex items-center justify-center p-6 font-mono selection:bg-blue-500">
            <div className="w-full max-w-md relative group">
                {/* Neon Glow Effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>

                <div className="relative bg-[#16161d] border border-white/10 p-10 rounded-2xl text-white">
                    <div className="mb-10 flex flex-col items-center">
                        <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center font-bold text-3xl mb-4 shadow-lg shadow-blue-500/50">E</div>
                        <h2 className="text-2xl font-bold tracking-tighter uppercase">Protocol : Access</h2>
                        <div className="h-1 w-20 bg-blue-500 mt-2"></div>
                    </div>

                    {error && (
                        <div className="mb-6 p-3 bg-red-900/30 border border-red-500/50 text-red-400 text-xs uppercase tracking-widest text-center animate-pulse">
                            &gt; Error: {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1 ml-1">Identity Endpoint</label>
                            <input
                                type="email"
                                required
                                className="w-full bg-black/50 border border-white/5 px-4 py-3 rounded-xl focus:border-blue-500 outline-none transition-all placeholder:text-gray-700"
                                placeholder="USER@TERMINAL.NET"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1 ml-1">Access Cipher</label>
                            <input
                                type="password"
                                required
                                className="w-full bg-black/50 border border-white/5 px-4 py-3 rounded-xl focus:border-blue-500 outline-none transition-all placeholder:text-gray-700"
                                placeholder="••••••••"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-500/20 active:scale-95 border-none cursor-pointer uppercase text-xs tracking-[0.2em]"
                        >
                            {loading ? "Decrypting..." : "Execute Login"}
                        </button>
                    </form>

                    <div className="mt-10 text-center">
                        <Link href={`/s/${slug}/signup`} className="text-[10px] text-gray-500 hover:text-blue-500 transition-colors uppercase tracking-widest">
                            No credentials? Request Access Node
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
