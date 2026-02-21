"use client"

import React from 'react'
import { ShieldCheck, Truck, Clock, Headphones } from 'lucide-react'

export default function AboutPage() {
    return (
        <div>
            <div className="page-header" style={{ textAlign: 'center', background: 'var(--primary)', color: 'white' }}>
                <h1 style={{ color: 'white' }}>About My Crust</h1>
                <p className="mt-1" style={{ fontSize: '18px' }}>Empowering millions of users to shop better, every day.</p>
            </div>

            <div className="container" style={{ padding: '4rem 0' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'center' }}>
                    <div>
                        <h2>The Vision</h2>
                        <p className="mt-2" style={{ lineHeight: '1.8', fontSize: '16px' }}>
                            My Crust started with a simple idea: to make premium shopping accessible to everyone. Today, we stand as one of the fastest-growing marketplaces, connecting thousands of sellers with millions of customers across the globe.
                        </p>
                        <p className="mt-1" style={{ lineHeight: '1.8', fontSize: '16px' }}>
                            Our commitment is to quality, authenticity, and speed. We believe that technology can bridge the gap between people and the products they love.
                        </p>
                    </div>
                    <img
                        src="https://images.unsplash.com/photo-1521737711867-e3b97375f902?q=80&w=1974"
                        alt="About"
                        style={{ width: '100%', borderRadius: '8px', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}
                    />
                </div>

                <div style={{ marginTop: '6rem', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
                    {[
                        { icon: <ShieldCheck size={40} />, title: '100% Authentic', desc: 'Every product is verified by our experts.' },
                        { icon: <Truck size={40} />, title: 'Fast Delivery', desc: 'Next day delivery in 100+ cities.' },
                        { icon: <Clock size={40} />, title: 'Easy Returns', desc: 'No questions asked 7-day replacement.' },
                        { icon: <Headphones size={40} />, title: '24/7 Support', desc: 'Human assistance whenever you need.' }
                    ].map(item => (
                        <div key={item.title} className="card" style={{ padding: '32px', textAlign: 'center' }}>
                            <div style={{ color: 'var(--primary)', marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>{item.icon}</div>
                            <h3 style={{ marginBottom: '8px' }}>{item.title}</h3>
                            <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{item.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
