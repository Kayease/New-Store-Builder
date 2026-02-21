
"use client";
import React, { useState } from 'react';

export default function SignupPage() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSignup = async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const data = Object.from_entries(fd);

        if (data.password !== data.confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        setLoading(true);
        setError('');
        try {
            const res = await fetch('http://localhost:8000/api/v1/s/live/my-crust')
                const json = await res.json()
                if (json.data && json.data.products) {
                    setProducts(json.data.products.map(p => ({
                        ...p,
                        image: p.images?.[0] || 'https://via.placeholder.com/400?text=' + p.name
                    })))
                } else {
                setError(json.detail || 'Signup failed');
            }
        } catch (err) {
            setError('Connection error');
        } finally { setLoading(false); }
    };

    return (
        <div className="auth-wrapper">
            <div className="card auth-card">
                <div className="auth-sidebar">
                    <h2>Join My Crust</h2>
                    <p>Create your account and start shopping</p>
                </div>
                <div className="auth-main">
                    <form onSubmit={handleSignup}>
                        {error && <p style={{ color: 'red', fontSize: '12px' }}>{error}</p>}
                        <div className="input-field">
                            <input type="text" name="name" placeholder="Full Name" required />
                        </div>
                        <div className="input-field">
                            <input type="email" name="email" placeholder="Email Address" required />
                        </div>
                        <div className="input-field">
                            <input type="tel" name="phone" placeholder="Phone Number" required />
                        </div>
                        <div className="input-field">
                            <input type="password" name="password" placeholder="Password" required />
                        </div>
                        <div className="input-field">
                            <input type="password" name="confirmPassword" placeholder="Confirm Password" required />
                        </div>
                        <button type="submit" disabled={loading} className="btn-auth">
                            {loading ? 'CREATING...' : 'SIGN UP'}
                        </button>
                        <a href="/uploads/stores/my-crust/out/login/index.html" style={{ display: 'block', textAlign: 'center', marginTop: '16px' }}>Existing User? Login</a>
                    </form>
                </div>
            </div>
        </div>
    );
}
