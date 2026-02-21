
"use client"
import React, { useState, useEffect } from 'react'
import { useAppContext } from './context/AppContext'
import { Star, Zap } from 'lucide-react'

export default function Home() {
    const [products, setProducts] = useState([])
    const [storeName, setStoreName] = useState('My Crust')
    const { addToCart } = useAppContext()

    useEffect(() => {
        const fetchStoreProducts = async () => {
            try {
                const res = await fetch(`http://localhost:8000/api/v1/s/live/my-crust`)
                const json = await res.json()
                if (json.data) {
                    setStoreName(json.data.store.name)
                    if (json.data.products) {
                        setProducts(json.data.products.map(p => ({
                            ...p,
                            image: p.images?.[0] || 'https://via.placeholder.com/400?text=' + p.name
                        })))
                    }
                }
            } catch (e) { console.error(e) }
        }
        fetchStoreProducts()
    }, [])

    return (
        <div className="home-content">
            <div className="hero-slider card" style={{ background: 'linear-gradient(90deg, #1e3c72 0%, #2a5298 100%)', display: 'flex', alignItems: 'center', padding: '0 5%' }}>
                <div style={{ color: 'white', maxWidth: '500px' }}>
                    <h1 style={{ color: 'white', fontSize: '3rem', marginBottom: '1rem' }}>Welcome to {storeName}!</h1>
                    <p style={{ fontSize: '1.2rem', marginBottom: '2rem' }}>Experience the handpicked collection of our best items.</p>
                </div>
            </div>
            <div className="container">
                <div className="product-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                    {products.map((p) => (
                        <div key={p.id} className="card product-item">
                            <img src={p.image} alt={p.name} />
                            <h3 className="p-title">{p.name}</h3>
                            <span className="curr-price">₹{(p.price || 0).toLocaleString()}</span>
                            <button onClick={() => addToCart(p)} className="btn-auth" style={{ marginTop: '12px' }}>Add to Bag</button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
