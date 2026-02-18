"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCustomerAuth } from '../../../app/s/[slug]/api/auth';

// API
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

async function getStoreData(slug: string) {
    try {
        const res = await fetch(`${API_URL}/s/live/${slug}`, {
            next: { revalidate: 60 }
        });
        if (!res.ok) throw new Error('Failed to fetch store data');
        return await res.json();
    } catch (error) {
        console.error(error);
        return null;
    }
}

function ElectronicsContent({ storeSlug, data }: { storeSlug: string, data: any }) {
    const { customer, logout } = useCustomerAuth();
    const store = data?.data?.store || { name: 'Electro Hub', tagline: 'The Future Is Wireless' };
    const products = data?.data?.products || [];

    return (
        <div className="font-sans bg-[#0b0b0e] text-white min-h-screen w-full">
            {/* Navbar */}
            <nav className="flex justify-between items-center p-6 border-b border-white/10 backdrop-blur-md sticky top-0 z-50 bg-[#0b0b0e]/80">
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-xl">E</div>
                    <span className="text-xl font-bold tracking-tighter uppercase">{store.name}</span>
                </div>
                <div className="flex items-center gap-8 text-sm font-mono uppercase font-medium">
                    <Link href="#" className="text-blue-500">Products</Link>

                    {customer ? (
                        <div className="flex items-center gap-4">
                            <span className="text-gray-400">Hi, {customer.name}</span>
                            <button onClick={logout} className="hover:text-red-500">Logout</button>
                        </div>
                    ) : (
                        <>
                            <Link href={`/s/${storeSlug}/login`} className="hover:text-blue-500">Login</Link>
                            <Link href={`/s/${storeSlug}/signup`} className="bg-blue-600 px-5 py-2 rounded-md hover:bg-blue-700 transition">Get Started</Link>
                        </>
                    )}
                </div>
            </nav>

            {/* Hero */}
            <section className="max-w-7xl mx-auto py-20 px-4 grid md:grid-cols-2 gap-12 items-center">
                {/* ... rest of hero ... */}
                <div>
                    <span className="font-mono text-blue-500 text-sm mb-4 block">AVAILABLE NOW</span>
                    <h1 className="text-7xl font-bold leading-[0.95] mb-8">
                        {store.name} <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-cyan-400">
                            {store.tagline || 'REDEFINED'}
                        </span>
                    </h1>
                    <p className="text-gray-400 text-lg mb-10 max-w-md">
                        {store.description || 'Experience the next generation of technology.'}
                    </p>
                    <div className="flex gap-4">
                        <button className="bg-blue-600 px-8 py-4 rounded-xl font-bold hover:scale-105 transition shadow-lg shadow-blue-500/20">Pre-Order Now</button>
                        <button className="border border-white/20 px-8 py-4 rounded-xl font-bold hover:bg-white/5 transition">Learn More</button>
                    </div>
                </div>
                <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                    <div className="relative bg-[#16161d] p-10 rounded-2xl border border-white/5">
                        <img src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80" className="w-full mix-blend-lighten" alt="Hero" />
                    </div>
                </div>
            </section>

            {/* Grid */}
            <section className="max-w-7xl mx-auto py-20 px-4">
                <div className="flex justify-between items-end mb-12">
                    <h2 className="text-4xl font-bold">Latest Drops</h2>
                    <Link href="#" className="text-blue-500 font-mono text-sm underline">View all products</Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {products.length > 0 ? products.map((p: any) => (
                        <div key={p.id} className="bg-gradient-to-br from-white/5 to-transparent p-1 border border-white/5 rounded-3xl group overflow-hidden">
                            <div className="p-8 h-full bg-[#0b0b0e] rounded-[22px] transition group-hover:bg-[#16161d]">
                                <div className="aspect-square mb-4 overflow-hidden rounded-xl bg-zinc-900">
                                    <img src={p.images?.[0] || 'https://placehold.co/400'} className="w-full h-full object-contain mix-blend-lighten group-hover:scale-110 transition duration-500" alt={p.name} />
                                </div>
                                <h3 className="text-xl font-bold mb-1 font-mono truncate">{p.name}</h3>
                                <p className="text-blue-500 font-mono font-bold">${p.price}</p>
                                <button className="w-full mt-4 bg-blue-600/20 border border-blue-600/30 py-2 rounded-lg font-mono text-[10px] text-blue-400 hover:bg-blue-600 hover:text-white transition">BUY NOW</button>
                            </div>
                        </div>
                    )) : (
                        <div className="col-span-3 text-center text-gray-500 font-mono">No products found.</div>
                    )}
                </div>
            </section>

            <footer className="border-t border-white/5 text-center py-20 text-gray-600 text-sm font-mono">
                &copy; 2026 {store.name ? store.name.toUpperCase() : 'STORE'} // POWERED BY STORECRAFT
            </footer>
        </div>
    )
}

export default function ElectronicsTheme({ storeSlug }: { storeSlug: string }) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (storeSlug) {
            getStoreData(storeSlug).then(res => {
                setData(res);
                setLoading(false);
            });
        }
    }, [storeSlug]);

    if (loading) return <div className="min-h-screen bg-[#0b0b0e] text-white flex items-center justify-center">Loading Store...</div>;

    return (
        <ElectronicsContent storeSlug={storeSlug} data={data} />
    );
}
