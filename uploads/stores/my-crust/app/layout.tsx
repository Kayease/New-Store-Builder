
"use client";
import React, { useState, useEffect } from 'react'
import './globals.css'
import { AppProvider, useAppContext } from './context/AppContext'
import { ShoppingCart, Search, User, Menu, Phone, Mail, Facebook, Twitter, Instagram, ChevronDown } from 'lucide-react'
import KXIdentity from "./kx-identity";

function Header({ storeName }) {
    const { user, cart, logout } = useAppContext()
    const [search, setSearch] = useState('')

    const getBasePath = () => {
        if (typeof window === 'undefined') return ''
        const path = window.location.pathname
        if (path.includes('/out/')) {
            return path.split('/out/')[0] + '/out/'
        }
        return '/uploads/stores/my-crust/out/'
    }

    const handleNavigate = (target, params = {}) => {
        const url = new URL(window.location.href)
        url.pathname = getBasePath() + target
        url.search = ''
        url.searchParams.set('store', 'my-crust')
        Object.entries(params).forEach(([key, val]) => {
            url.searchParams.set(key, val)
        })
        window.location.href = url.pathname + url.search
    }

    return (
        <header>
            <div className="top-nav">
                <div className="container flex align-center justify-between">
                    <a href="#" onClick={(e) => { e.preventDefault(); handleNavigate('index.html'); }} className="logo-text" style={{ fontSize: '24px', fontWeight: 800, fontStyle: 'italic' }}>
                        {storeName || 'My Crust'}
                    </a>

                    <form className="search-bar" onSubmit={(e) => { e.preventDefault(); handleNavigate('products/index.html', { q: search }); }}>
                        <input type="text" placeholder="Search for products, brands and more" value={search} onChange={(e) => setSearch(e.target.value)} />
                        <button type="submit" className="search-btn"><Search size={20} /></button>
                    </form>

                    <div className="nav-links-right">
                        {(user && user.email && user.email !== 'guest@example.com') ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                                    <User size={20} />
                                    <span>Hi, {user.firstName || user.name?.split(' ')[0] || 'User'}</span>
                                </div>
                                <button onClick={() => { localStorage.clear(); window.location.reload(); }} style={{ background: 'transparent', border: '1px solid white', color: 'white', padding: '4px 10px', fontSize: '12px', cursor: 'pointer' }}>Logout</button>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <a href="#" onClick={(e) => { e.preventDefault(); handleNavigate('login/index.html'); }} style={{ background: 'white', color: 'var(--primary)', padding: '6px 20px', borderRadius: '2px', fontWeight: 600 }}>Login</a>
                                <a href="#" onClick={(e) => { e.preventDefault(); handleNavigate('signup/index.html'); }} style={{ background: 'rgba(255,255,255,0.2)', color: 'white', padding: '6px 20px', borderRadius: '2px', border: '1px solid white' }}>Sign Up</a>
                            </div>
                        )}

                        <a href="#" onClick={(e) => { e.preventDefault(); handleNavigate('cart/index.html'); }} className="flex align-center gap-1">
                            <ShoppingCart size={20} />
                            <span>Cart ({cart?.length || 0})</span>
                        </a>
                    </div>
                </div>
            </div>

            <div className="sub-nav">
                <div className="container flex gap-2 overflow-auto">
                    {['Electronics', 'Fashion', 'Home', 'Appliances', 'Beauty', 'Toys', 'Bikes'].map(cat => (
                        <a key={cat} href="#" onClick={(e) => { e.preventDefault(); handleNavigate('products/index.html', { category: cat.toLowerCase() }); }} className="category-link">{cat}</a>
                    ))}
                    <a href="#" onClick={(e) => { e.preventDefault(); handleNavigate('blog/index.html'); }} className="category-link" style={{ marginLeft: 'auto' }}>Blog</a>
                    <a href="#" onClick={(e) => { e.preventDefault(); handleNavigate('about/index.html'); }} className="category-link">About</a>
                </div>
            </div>
        </header>
    )
}

function Footer({ storeName }) {
    return (
        <footer className="footer">
            <div className="container">
                <div className="footer-grid">
                    <div className="footer-col">
                        <h4>ABOUT</h4>
                        <ul>
                            <li><a href="#" onClick={(e) => { e.preventDefault(); window.location.href = '/uploads/stores/my-crust/out/about/index.html'; }}>About Us</a></li>
                            <li><a href="#" onClick={(e) => { e.preventDefault(); window.location.href = '/uploads/stores/my-crust/out/contact/index.html'; }}>Contact Us</a></li>
                        </ul>
                    </div>
                    <div className="footer-col">
                        <h4>SOCIAL</h4>
                        <ul>
                            <li><a href="#"><Facebook size={16} /> Facebook</a></li>
                            <li><a href="#"><Instagram size={16} /> Instagram</a></li>
                        </ul>
                    </div>
                </div>
                <div className="footer-bottom">
                    <p>© 2024 {storeName || 'My Crust'}. All Rights Reserved.</p>
                </div>
            </div>
        </footer>
    )
}

export default function RootLayout({ children }) {
    const [storeName, setStoreName] = useState('My Crust')

    useEffect(() => {
        const fetchStore = async () => {
            try {
                const res = await fetch('http://localhost:8000/api/v1/s/live/my-crust')
                const json = await res.json()
                if (json.data && json.data.store) {
                    setStoreName(json.data.store.name)
                }
            } catch (e) { console.error(e) }
        }
        fetchStore()
    }, [])

    return (
        <html lang="en">
            <body>
                <AppProvider>
                    <div className="main-layout" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
                        <Header storeName={storeName} />
                        <main style={{ flex: 1 }}>{children}</main>
                        <Footer storeName={storeName} />
                    </div>
                </AppProvider>
                <KXIdentity />
            </body>
        </html>
    )
}
