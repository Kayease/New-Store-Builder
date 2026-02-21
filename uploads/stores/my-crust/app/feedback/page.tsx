"use client"

import React, { useState } from 'react'
import { Star, Smile, Frown, Meh, Heart } from 'lucide-react'

export default function FeedbackPage() {
    const [rating, setRating] = useState(0)
    const [submitted, setSubmitted] = useState(false)

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitted(true)
    }

    return (
        <div className="container" style={{ padding: '4rem 0' }}>
            <div className="card form-card" style={{ textAlign: 'center' }}>
                {submitted ? (
                    <div style={{ padding: '3rem 0' }}>
                        <div style={{ background: '#e8f5e9', color: '#2e7d32', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                            <Heart fill="#2e7d32" />
                        </div>
                        <h2>Thank You for Your Feedback!</h2>
                        <p className="mt-1" style={{ color: 'var(--text-muted)' }}>Your insights help us improve the My Crust experience for everyone.</p>
                        <button onClick={() => setSubmitted(false)} className="btn-auth mt-2" style={{ width: 'auto', padding: '10px 40px' }}>Give More Feedback</button>
                    </div>
                ) : (
                    <>
                        <h1 style={{ marginBottom: '1rem' }}>We Value Your Opinion</h1>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '3rem' }}>How was your experience shopping with My Crust today?</p>

                        <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
                            <div style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
                                <p style={{ fontWeight: 600, marginBottom: '1rem' }}>Rate your overall experience:</p>
                                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                                    {[1, 2, 3, 4, 5].map(star => (
                                        <Star
                                            key={star}
                                            size={40}
                                            fill={star <= rating ? '#ff9f00' : 'none'}
                                            color={star <= rating ? '#ff9f00' : '#ccc'}
                                            cursor="pointer"
                                            onClick={() => setRating(star)}
                                        />
                                    ))}
                                </div>
                                <div className="flex justify-between" style={{ maxWidth: '240px', margin: '8px auto', fontSize: '12px', color: 'var(--text-muted)' }}>
                                    <span>Very Poor</span>
                                    <span>Excellent</span>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>What did you like the most?</label>
                                <select>
                                    <option>Product Variety</option>
                                    <option>Pricing & Discounts</option>
                                    <option>Delivery Speed</option>
                                    <option>App Interface</option>
                                    <option>Customer Support</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Any specific suggestions for improvement?</label>
                                <textarea rows={4} placeholder="Tell us how we can do better..."></textarea>
                            </div>

                            <button type="submit" disabled={rating === 0} className="btn-auth" style={{ opacity: rating === 0 ? 0.5 : 1 }}>
                                SUBMIT FEEDBACK
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    )
}
