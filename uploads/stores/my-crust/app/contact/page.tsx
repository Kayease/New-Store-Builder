"use client"

import React, { useState } from 'react'
import { Mail, Phone, MapPin, Send } from 'lucide-react'

export default function ContactPage() {
    const [submitted, setSubmitted] = useState(false)

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitted(true)
    }

    return (
        <div className="container" style={{ padding: '4rem 0' }}>
            <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                <h1>Get in Touch</h1>
                <p style={{ color: 'var(--text-muted)' }}>We'd love to hear from you. Our team is always here to help.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '64px' }}>
                <div>
                    <div className="flex gap-2 mb-4">
                        <div style={{ background: 'var(--primary)', color: 'white', padding: '12px', borderRadius: '8px' }}><Mail /></div>
                        <div>
                            <h4 style={{ fontSize: '16px' }}>Email Us</h4>
                            <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>support@nexusmall.com</p>
                        </div>
                    </div>
                    <div className="flex gap-2 mb-4">
                        <div style={{ background: 'var(--primary)', color: 'white', padding: '12px', borderRadius: '8px' }}><Phone /></div>
                        <div>
                            <h4 style={{ fontSize: '16px' }}>Call Us</h4>
                            <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>+1 (800) 123-4567</p>
                        </div>
                    </div>
                    <div className="flex gap-2 mb-4">
                        <div style={{ background: 'var(--primary)', color: 'white', padding: '12px', borderRadius: '8px' }}><MapPin /></div>
                        <div>
                            <h4 style={{ fontSize: '16px' }}>Office</h4>
                            <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>123 Commerce Way, Tech City, IN 560001</p>
                        </div>
                    </div>
                </div>

                <div className="card" style={{ padding: '40px' }}>
                    {submitted ? (
                        <div style={{ textAlign: 'center', padding: '2rem' }}>
                            <h2 style={{ color: 'var(--success)' }}>Message Sent!</h2>
                            <p className="mt-1">We've received your inquiry and will get back to you within 24 hours.</p>
                            <button onClick={() => setSubmitted(false)} className="btn-auth mt-2" style={{ width: 'auto', padding: '10px 40px' }}>Send Another</button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div className="form-group">
                                    <label>Full Name</label>
                                    <input type="text" placeholder="John Doe" required />
                                </div>
                                <div className="form-group">
                                    <label>Email Address</label>
                                    <input type="email" placeholder="john@example.com" required />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Subject</label>
                                <input type="text" placeholder="Issue with my order" />
                            </div>
                            <div className="form-group">
                                <label>How can we help?</label>
                                <textarea rows={5} placeholder="Type your message here..." required></textarea>
                            </div>
                            <button type="submit" className="btn-auth" style={{ background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                <Send size={18} /> SEND MESSAGE
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    )
}
