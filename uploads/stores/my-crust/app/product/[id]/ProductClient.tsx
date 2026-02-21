"use client"

import React from 'react'
import { useParams } from 'next/navigation'
import { useAppContext } from '../../context/AppContext'
import { Star, ShoppingCart, Zap, ShieldCheck, Truck, RotateCcw } from 'lucide-react'

export default function ProductClient() {
    const { id } = useParams()
    const { addToCart } = useAppContext()
    const [product, setProduct] = React.useState<any>(null)

    React.useEffect(() => {
        const all = [
            { id: 'p1', name: 'Nexus Ultra 5G Smartphone', price: 54999, oldPrice: 69999, image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=1780', rating: 4.5, reviews: 342, desc: 'Experience the next generation of mobile connectivity.' },
            { id: 'p2', name: 'Premium Noise Cancelling Headphones', price: 12999, oldPrice: 19999, image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=2070', rating: 4.8, reviews: 1205, desc: 'Immerse yourself in crystal clear sound.' },
            { id: 'p4', name: 'Luxury Cotton Formal Shirt', price: 1499, oldPrice: 2999, image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=1976', rating: 4.0, reviews: 56, desc: 'Stylish and comfortable formal wear.' },
            { id: 'p5', name: 'Running Performance Shoes', price: 3999, oldPrice: 5999, image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=2070', rating: 4.7, reviews: 2311, desc: 'Engineered for speed and comfort.' },
            { id: 'p7', name: 'MacBook Pro Clone M3', price: 145000, oldPrice: 160000, image: 'https://images.unsplash.com/photo-1517336710b11-d1018ad29fa4?q=80&w=1974', rating: 4.9, reviews: 45, desc: 'Powerful workspace on the go.' },
            { id: 'p8', name: 'Wireless Charging Pad', price: 1299, oldPrice: 2499, image: 'https://images.unsplash.com/photo-1586816829396-9321f92e92c2?q=80&w=2070', rating: 4.1, reviews: 88, desc: 'Fast wireless charging for all devices.' },
            { id: 'p9', name: 'Designer Wrist Watch', price: 8999, oldPrice: 15999, image: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?q=80&w=1999', rating: 4.6, reviews: 112, desc: 'Elegant timekeeping for professionals.' },
            { id: 'p10', name: 'Modern Velvet Sofa', price: 45000, oldPrice: 55000, image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=2070', rating: 4.4, reviews: 89, desc: 'Add luxury to your living room.' },
            { id: 'p11', name: 'Mountain Terrain Bike', price: 25000, oldPrice: 32000, image: 'https://images.unsplash.com/photo-1485965120184-e220f15ef99a?q=80&w=2070', rating: 4.7, reviews: 156, desc: 'Conquer any trail with ease.' },
            { id: 'p12', name: 'Remote Control Supercar', price: 4500, oldPrice: 6500, image: 'https://images.unsplash.com/photo-1581235720704-06d3acfc13bc?q=80&w=1780', rating: 4.3, reviews: 42, desc: 'Fun and speed in your hands.' },
            { id: 'p13', name: 'Organic Face Serum', price: 1200, oldPrice: 1800, image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=1974', rating: 4.2, reviews: 210, desc: 'Revitalize your skin naturally.' },
            { id: 'p14', name: 'Smart Kitchen Mixer', price: 6500, oldPrice: 8900, image: 'https://images.unsplash.com/photo-1594212699903-ec8a3ecc50f1?q=80&w=2071', rating: 4.5, reviews: 34, desc: 'Make cooking easy and fun.' }
        ]
        const found = all.find(p => p.id === id) || all[0]
        setProduct(found)
    }, [id])

    if (!product) return <div className="container" style={{ padding: '5rem' }}>Loading product details...</div>

    return (
        <div className="container" style={{ marginTop: '2rem' }}>
            <div className="card" style={{ display: 'grid', gridTemplateColumns: '450px 1fr', gap: '40px', padding: '24px' }}>
                <div style={{ position: 'sticky', top: '140px', height: 'fit-content' }}>
                    <div style={{ border: '1px solid var(--border)', padding: '10px', height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img src={product.image} style={{ maxWidth: '100%', maxHeight: '100%' }} alt={product.name} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '16px' }}>
                        <button
                            onClick={() => addToCart(product)}
                            className="btn-auth"
                            style={{ background: '#ff9f00', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '16px', height: '56px' }}
                        >
                            <ShoppingCart size={20} /> ADD TO CART
                        </button>
                        <button
                            onClick={() => { addToCart(product); window.location.href = '/checkout' }}
                            className="btn-auth"
                            style={{ background: '#fb641b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '16px', height: '56px' }}
                        >
                            <Zap size={20} /> BUY NOW
                        </button>
                    </div>
                </div>

                <div>
                    <nav style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                        Home {'>'} Electronics {'>'} Smartphones {'>'} {product.name}
                    </nav>
                    <h1 style={{ fontSize: '20px', fontWeight: 400, marginBottom: '8px' }}>{product.name}</h1>
                    <div className="flex align-center gap-2 mb-2">
                        <span className="p-rating">{product.rating} <Star size={10} fill="white" /></span>
                        <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{product.reviews} Ratings & Reviews</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem' }}>
                        <span style={{ fontSize: '28px', fontWeight: 600 }}>₹{product.price.toLocaleString()}</span>
                        <span style={{ textDecoration: 'line-through', color: 'var(--text-muted)', fontSize: '16px' }}>₹{product.oldPrice.toLocaleString()}</span>
                        <span style={{ color: 'var(--success)', fontWeight: 600, fontSize: '16px' }}>{Math.round((1 - product.price / product.oldPrice) * 100)}% off</span>
                    </div>
                    <div className="mt-2">
                        <h4 style={{ marginBottom: '8px' }}>Product Description</h4>
                        <p style={{ color: '#212121', lineHeight: '1.6' }}>{product.desc}</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
