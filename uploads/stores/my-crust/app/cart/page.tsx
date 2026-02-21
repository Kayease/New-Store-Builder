"use client"

import React from 'react'
import { useAppContext } from '../context/AppContext'
import Link from 'next/link'
import { Trash2, ShieldCheck } from 'lucide-react'

export default function CartPage() {
    const { cart, removeFromCart, updateQuantity } = useAppContext()

    const totalPrice = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0)
    const totalOldPrice = cart.reduce((acc, item) => acc + ((item.oldPrice || item.price * 1.5) * item.quantity), 0)

    if (cart.length === 0) {
        return (
            <div className="container" style={{ textAlign: 'center', padding: '100px 0' }}>
                <img src="https://m.media-amazon.com/images/G/31/cart/empty/kettle-desaturated._CB424647133_.svg" alt="Empty Cart" style={{ width: '200px', marginBottom: '20px' }} />
                <h2>Your shopping bag is empty!</h2>
                <p className="mt-1">Add items to it now.</p>
                <a href="/uploads/themes/nexus-mall/out/products/" className="btn-auth" style={{ display: 'inline-block', width: 'auto', padding: '12px 60px', marginTop: '20px' }}>Shop Now</a>
            </div>
        )
    }

    return (
        <div className="container cart-layout">
            {/* Items List */}
            <div className="card">
                <div style={{ padding: '24px', borderBottom: '1px solid var(--border)' }}>
                    <h3>My Cart ({cart.length})</h3>
                </div>
                {cart.map(item => (
                    <div key={item.id} className="cart-item">
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <img src={item.image} alt={item.name} />
                            <div className="qty-controls">
                                <button className="qty-btn" onClick={() => updateQuantity(item.id, -1)}>-</button>
                                <span style={{ border: '1px solid var(--border)', padding: '2px 14px', borderRadius: '2px' }}>{item.quantity}</span>
                                <button className="qty-btn" onClick={() => updateQuantity(item.id, 1)}>+</button>
                            </div>
                        </div>
                        <div style={{ flex: 1 }}>
                            <h4 style={{ fontSize: '16px', fontWeight: 400 }}>{item.name}</h4>
                            <div style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>Seller: NexusRetail</div>
                            <div className="p-price-row mt-2" style={{ gap: '12px' }}>
                                <span className="old-price">₹{((item.oldPrice || item.price * 1.2) * item.quantity).toLocaleString()}</span>
                                <span style={{ fontSize: '18px', fontWeight: 600 }}>₹{(item.price * item.quantity).toLocaleString()}</span>
                                <span className="discount">{Math.round((1 - item.price / (item.oldPrice || item.price * 1.2)) * 100)}% Off</span>
                            </div>
                            <div className="mt-2 flex gap-2">
                                <button onClick={() => removeFromCart(item.id)} className="flex align-center gap-1" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)', background: 'none' }}>
                                    REMOVE
                                </button>
                            </div>
                        </div>
                        <div style={{ fontSize: '14px' }}>
                            Delivery in 2 days | <span style={{ color: 'var(--success)' }}>Free</span>
                        </div>
                    </div>
                ))}
                <div style={{ padding: '16px 24px', textAlign: 'right', background: 'white', position: 'sticky', bottom: 0, boxShadow: '0 -2px 10px rgba(0,0,0,0.1)' }}>
                    <a href="/uploads/themes/nexus-mall/out/checkout/" className="btn-auth" style={{ display: 'inline-block', width: 'auto', padding: '12px 60px', background: 'var(--secondary)' }}>PLACE ORDER</a>
                </div>
            </div>

            {/* Price Details Sidebar */}
            <aside className="card" style={{ height: 'fit-content' }}>
                <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                    <h4 style={{ fontWeight: 600 }}>PRICE DETAILS</h4>
                </div>
                <div style={{ padding: '24px' }}>
                    <div className="flex justify-between mb-2">
                        <span>Price ({cart.length} items)</span>
                        <span>₹{totalOldPrice.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                        <span>Discount</span>
                        <span style={{ color: 'var(--success)' }}>- ₹{(totalOldPrice - totalPrice).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                        <span>Delivery Charges</span>
                        <span style={{ color: 'var(--success)' }}>FREE</span>
                    </div>
                    <hr className="mt-2 mb-2" />
                    <div className="flex justify-between" style={{ fontSize: '18px', fontWeight: 600 }}>
                        <span>Total Amount</span>
                        <span>₹{totalPrice.toLocaleString()}</span>
                    </div>
                    <hr className="mt-2 mb-2" />
                    <div style={{ color: 'var(--success)', fontWeight: 600, fontSize: '14px' }}>
                        You will save ₹{(totalOldPrice - totalPrice).toLocaleString()} on this order
                    </div>
                </div>
                <div style={{ padding: '16px 24px', display: 'flex', gap: '8px', color: 'var(--text-muted)', fontSize: '13px' }}>
                    <ShieldCheck size={32} />
                    Safe and Secure Payments. 100% Authentic products.
                </div>
            </aside>
        </div>
    )
}
