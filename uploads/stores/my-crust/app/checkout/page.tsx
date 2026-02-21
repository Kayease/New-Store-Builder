"use client"

import React from 'react'
import { useAppContext } from '../context/AppContext'
import Link from 'next/link'
import { ShieldCheck, CheckCircle2, CreditCard, Landmark, Wallet, Zap } from 'lucide-react'

export default function CheckoutPage() {
    const { cart, user } = useAppContext()
    const [step, setStep] = React.useState(1) // 1: Address, 2: Payment, 3: Success
    const [formData, setFormData] = React.useState({ name: user?.name || '', phone: '', pincode: '', address: '', city: '', state: '' })

    const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0)

    if (step === 3) {
        return (
            <div className="container" style={{ textAlign: 'center', padding: '100px 0' }}>
                <CheckCircle2 size={80} color="var(--success)" style={{ margin: '0 auto 24px' }} />
                <h1 style={{ fontSize: '32px' }}>Order Placed Successfully!</h1>
                <p className="mt-1" style={{ fontSize: '18px', color: 'var(--text-muted)' }}>Thank you for shopping with My Crust. Your order ID is #NEX-{Math.floor(Math.random() * 900000 + 100000)}</p>
                <p className="mt-1">A confirmation email has been sent to {user?.email || 'your email'}.</p>
                <a href="/uploads/themes/nexus-mall/out/" className="btn-auth" style={{ display: 'inline-block', width: 'auto', padding: '12px 60px', marginTop: '32px' }}>Continue Shopping</a>
            </div>
        )
    }

    return (
        <div className="container cart-layout" style={{ marginTop: '2rem' }}>
            <div className="steps-container flex flex-col gap-2">
                {/* Step 1: Login & Address */}
                <div className="card">
                    <div style={{ background: 'var(--primary)', color: 'white', padding: '12px 24px', display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <span style={{ background: 'white', color: 'var(--primary)', width: '20px', height: '20px', borderRadius: '2px', textAlign: 'center', fontSize: '13px', lineHeight: '20px', fontWeight: 700 }}>1</span>
                        <span style={{ fontWeight: 600 }}>DELIVERY ADDRESS</span>
                    </div>
                    {step === 1 ? (
                        <div style={{ padding: '24px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div className="form-group"><label>Name</label><input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} /></div>
                                <div className="form-group"><label>10-digit mobile number</label><input type="text" /></div>
                                <div className="form-group"><label>Pincode</label><input type="text" /></div>
                                <div className="form-group"><label>Locality</label><input type="text" /></div>
                            </div>
                            <div className="form-group"><label>Address (Area and Street)</label><textarea rows={3}></textarea></div>
                            <button onClick={() => setStep(2)} className="btn-auth" style={{ background: 'var(--secondary)', width: '250px' }}>SAVE AND DELIVER HERE</button>
                        </div>
                    ) : (
                        <div style={{ padding: '12px 24px', fontSize: '14px' }}>
                            <strong>{formData.name}</strong> • {formData.city || 'Home Address'}...
                        </div>
                    )}
                </div>

                {/* Step 2: Payment */}
                <div className="card">
                    <div style={{ background: step === 2 ? 'var(--primary)' : '#f5f7fa', color: step === 2 ? 'white' : 'var(--text-muted)', padding: '12px 24px', display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <span style={{ background: step === 2 ? 'white' : 'transparent', border: step === 2 ? 'none' : '1px solid var(--border)', color: step === 2 ? 'var(--primary)' : 'var(--text-muted)', width: '20px', height: '20px', borderRadius: '2px', textAlign: 'center', fontSize: '13px', lineHeight: '20px', fontWeight: 700 }}>2</span>
                        <span style={{ fontWeight: 600 }}>PAYMENT OPTIONS</span>
                    </div>
                    {step === 2 && (
                        <div style={{ padding: '0 24px 24px' }}>
                            {[
                                { id: 'upi', name: 'UPI', icon: <Zap size={18} color="#9c27b0" /> },
                                { id: 'card', name: 'Credit / Debit / ATM Card', icon: <CreditCard size={18} color="#3f51b5" /> },
                                { id: 'net', name: 'Net Banking', icon: <Landmark size={18} color="#ff9800" /> },
                                { id: 'cod', name: 'Cash on Delivery', icon: <Wallet size={18} color="#4caf50" /> }
                            ].map(opt => (
                                <div key={opt.id} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '20px 0', borderBottom: '1px solid var(--border)' }}>
                                    <input type="radio" name="payment" id={opt.id} defaultChecked={opt.id === 'upi'} />
                                    <label htmlFor={opt.id} className="flex align-center gap-2" style={{ fontWeight: 500, flex: 1 }}>
                                        {opt.icon} {opt.name}
                                    </label>
                                </div>
                            ))}
                            <button onClick={() => setStep(3)} className="btn-auth" style={{ background: 'var(--secondary)', width: '250px', marginTop: '24px' }}>CONFIRM ORDER</button>
                        </div>
                    )}
                </div>
            </div>

            {/* Summary side */}
            <aside>
                <div className="card">
                    <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                        <h4 style={{ fontWeight: 600 }}>PRICE DETAILS</h4>
                    </div>
                    <div style={{ padding: '24px' }}>
                        <div className="flex justify-between mb-2"><span>Price ({cart.length} items)</span><span>₹{(total * 1.2).toLocaleString()}</span></div>
                        <div className="flex justify-between mb-2"><span>Delivery Charges</span><span style={{ color: 'var(--success)' }}>FREE</span></div>
                        <hr className="mt-2 mb-2" />
                        <div className="flex justify-between" style={{ fontSize: '18px', fontWeight: 600 }}><span>Total Payable</span><span>₹{total.toLocaleString()}</span></div>
                    </div>
                </div>
                <div className="flex gap-2 mt-2" style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '12px' }}>
                    <ShieldCheck size={24} /> <span>Safe and Secure Payments. Easy returns. 100% Authentic products.</span>
                </div>
            </aside>
        </div>
    )
}
