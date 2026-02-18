
"use client";
import React, { useState } from 'react';
import { useCustomerAuth } from '../../../app/s/[slug]/api/auth';
import { CustomerService } from '../../../app/s/[slug]/api/client';
import { useRouter } from "next/navigation";
import Link from 'next/link';

export default function ElectronicsSignup({ slug }: { slug: string }) {
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
            if (!storeId) throw new Error("Store Invalid");

            const res = await CustomerService.register(name, email, password, storeId);
            if (res.success) {
                localStorage.setItem(`customer_token_${storeId}`, res.token);
                localStorage.setItem(`customer_data_${storeId}`, JSON.stringify(res.customer));
                router.push(`/s/${slug}/live`);
            } else {
                setError(res.detail || "Registration Failed");
            }
        } catch (err: any) {
            setError(err.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0b0b0e] flex items-center justify-center p-6 font-mono">
            <div className="w-full max-w-md relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-2xl blur opacity-25"></div>

                <div className="relative bg-[#16161d] border border-white/10 p-10 rounded-2xl text-white text-center">
                    <div className="mb-8">
                        <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center font-bold text-3xl mb-4 mx-auto">E</div>
                        <h2 className="text-xl font-bold uppercase tracking-widest">Initialization : New User</h2>
                    </div>

                    {error && <div className="mb-6 p-3 bg-red-900/30 border border-red-500/50 text-red-400 text-[10px] uppercase tracking-widest animate-pulse">! {error}</div>}

                    <form onSubmit={handleSignup} className="space-y-5 text-left">
                        <div>
                            <label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1">Full Name</label>
                            <input type="text" required className="w-full bg-black/50 border border-white/5 px-4 py-3 rounded-xl focus:border-blue-500 outline-none text-white transition-all" value={name} onChange={e => setName(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1">Frequency Email</label>
                            <input type="email" required className="w-full bg-black/50 border border-white/5 px-4 py-3 rounded-xl focus:border-blue-500 outline-none text-white transition-all" value={email} onChange={e => setEmail(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1">Encrypted Cipher</label>
                            <input type="password" required className="w-full bg-black/50 border border-white/5 px-4 py-3 rounded-xl focus:border-blue-500 outline-none text-white transition-all" value={password} onChange={e => setPassword(e.target.value)} />
                        </div>
                        <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg border-none cursor-pointer uppercase text-xs tracking-widest">
                            {loading ? "Allocating..." : "Create Node"}
                        </button>
                    </form>

                    <div className="mt-8">
                        <Link href={`/s/${slug}/login`} className="text-[10px] text-gray-500 hover:text-blue-500 transition-colors uppercase tracking-widest">
                            Already Authenticated? Login
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
