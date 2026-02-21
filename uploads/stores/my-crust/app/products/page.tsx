
"use client"
import React, { useState, useEffect, Suspense } from 'react'
import { useAppContext } from '../context/AppContext'
import { Star, Filter, SlidersHorizontal } from 'lucide-react'
import { useSearchParams } from 'next/navigation'

function ProductsContent() {
    const { addToCart } = useAppContext()
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const searchParams = useSearchParams()

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const res = await fetch(`http://localhost:8000/api/v1/s/live/my-crust`)
                const json = await res.json()
                if (json.data && json.data.products) {
                    setProducts(json.data.products.map(p => ({
                        ...p,
                        image: p.images?.[0] || 'https://via.placeholder.com/400?text=' + p.name
                    })))
                }
            } catch (e) { console.error(e) }
            setLoading(false)
        }
        fetchAll()
    }, [])

    return (
        <div className="container py-2">
            <h1>Our Catalog</h1>
            <div className="product-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                {products.map((p) => (
                    <div key={p.id} className="card product-item">
                        <img src={p.image} alt={p.name} />
                        <h3 className="p-title">{p.name}</h3>
                        <span className="curr-price">₹{(p.price || 0).toLocaleString()}</span>
                        <button onClick={() => addToCart(p)} className="btn-auth">Add to Bag</button>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default function ProductsPage() {
    return (
        <Suspense fallback={<div>Loading catalog...</div>}>
            <ProductsContent />
        </Suspense>
    )
}
