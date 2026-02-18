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

function FashionContent({ storeSlug, data }: { storeSlug: string, data: any }) {
    const { customer, logout } = useCustomerAuth();
    const store = data?.data?.store || { name: 'Urban Vogue', tagline: 'Defining The Streets' };
    const products = data?.data?.products || [];

    return (
        <div className="font-sans bg-white text-black min-h-screen w-full">
            <nav className="p-8 flex justify-between items-center bg-black text-white sticky top-0 z-50">
                <div className="text-3xl font-black italic tracking-tighter uppercase">{store.name}</div>
                <div className="flex items-center space-x-10 text-xs font-bold uppercase hidden md:flex">
                    <Link href="#" className="hover:text-red-500">Shop</Link>

                    {customer ? (
                        <>
                            <span className="text-gray-300">Hi, {customer.name}</span>
                            <button onClick={logout} className="hover:text-red-500">Logout</button>
                        </>
                    ) : (
                        <>
                            <Link href={`/s/${storeSlug}/login`} className="hover:text-red-500">Account</Link>
                            <Link href={`/s/${storeSlug}/signup`} className="border-2 border-white px-6 py-2 hover:bg-white hover:text-black transition">Join the Club</Link>
                        </>
                    )}
                </div>
            </nav>

            <section className="flex flex-col md:flex-row min-h-[80vh]">
                <div className="md:w-1/2 bg-neutral-100 flex items-center justify-center p-20">
                    <div>
                        <h1 className="text-6xl md:text-8xl font-heading leading-none mb-10 uppercase">
                            {store.tagline ? store.tagline.split(' ')[0] : 'DEFINING'} <span className="text-red-500 underline">{store.tagline ? store.tagline.split(' ').slice(1).join(' ') : 'STYLE'}</span>
                        </h1>
                        <p className="text-lg max-w-md mb-12 text-neutral-600">
                            {store.description || 'Premium apparel for those who dare to stand out.'}
                        </p>
                        <button className="bg-black text-white px-12 py-5 text-xl font-bold hover:bg-red-500 transition-colors">SHOP NOW</button>
                    </div>
                </div>
                <div className="md:w-1/2 relative bg-black">
                    <img src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80" className="w-full h-full object-cover opacity-80" alt="Hero" />
                </div>
            </section>

            <section className="py-20 px-8">
                <h2 className="text-4xl font-black italic mb-12 text-center">NEW ARRIVALS</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {products.length > 0 ? products.map((p: any) => (
                        <div key={p.id} className="group cursor-pointer">
                            <div className="relative overflow-hidden mb-4 bg-gray-100 aspect-[3/4]">
                                <img src={p.images?.[0] || 'https://placehold.co/400'} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" alt={p.name} />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition"></div>
                                <button className="absolute bottom-4 left-4 right-4 bg-white text-black py-3 font-bold translate-y-full group-hover:translate-y-0 transition duration-300">ADD TO CART</button>
                            </div>
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-bold text-lg uppercase">{p.name}</h3>
                                    <p className="text-neutral-500 text-sm">{p.category_name || 'Apparel'}</p>
                                </div>
                                <span className="font-bold">${p.price}</span>
                            </div>
                        </div>
                    )) : (
                        <div className="col-span-4 text-center">Loading collection...</div>
                    )}
                </div>
            </section>

            <footer className="bg-black text-white py-20 px-8">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center">
                    <div className="text-2xl font-black italic mb-8 md:mb-0">{store.name}</div>
                    <div className="text-neutral-500 text-sm">&copy; 2026. All rights reserved.</div>
                </div>
            </footer>
        </div>
    )
}

export default function FashionTheme({ storeSlug }: { storeSlug: string }) {
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

    if (loading) return <div className="min-h-screen bg-white text-black flex items-center justify-center">Loading Store...</div>;

    return (
        <FashionContent storeSlug={storeSlug} data={data} />
    );
}
