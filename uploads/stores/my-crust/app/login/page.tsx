
"use client";
import React, { useState } from 'react';

export default function LoginPage() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const email = fd.get('email');
        const password = fd.get('password');

        setLoading(true);
        setError('');
        try {
            const res = await fetch('http://localhost:8000/api/v1/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const json = await res.json();
            if (res.ok) {
                console.log("📦 LOGIN_SUCCESS_RESPONSE:", json);
                const user = json.data.user;
                localStorage.setItem('user_data', JSON.stringify(user));
                localStorage.setItem('token', json.data.token);

                const userRole = (user.role || '').toLowerCase();
                const storeSlug = user.storeSlug || 'my-crust';

                console.log("🕵️ ROLE_FOUND:", userRole);

                // NEW: Use postMessage to notify the parent window (Platform) to handle redirect
                if (window.parent && window.parent !== window) {
                    const isManager = (userRole === 'merchant' || userRole === 'admin');
                    window.parent.postMessage({
                        type: 'AUTH_SUCCESS',
                        token: json.data.token,
                        profile: user,
                        storeId: user.storeId || 'my-crust',
                        openInNewTab: isManager, // Open in new tab if manager
                        redirect: isManager
                            ? `/manager/${storeSlug}/home`
                            : `/s/${storeSlug}/live`
                    }, '*');
                } else {
                    // Fallback for direct access
                    if (userRole === 'merchant' || userRole === 'admin') {
                        window.open(`http://localhost:3000/manager/${storeSlug}/home`, '_blank');
                    } else {
                        window.location.href = '/uploads/stores/my-crust/out/index.html';
                    }
                }
            } else {
                console.error("❌ LOGIN_FAILED:", json);
                setError(json.detail || 'Invalid credentials');
            }
        } catch (err) { setError('Connection error'); }
        finally { setLoading(false); }
    };

    return (
        <div className="auth-wrapper">
            <div className="card auth-card">
                <div className="auth-sidebar">
                    <h2>Login to My Crust</h2>
                    <p>Enter your credentials to continue</p>
                </div>
                <div className="auth-main">
                    <form onSubmit={handleLogin}>
                        {error && <p style={{ color: 'red', fontSize: '12px' }}>{error}</p>}
                        <div className="input-field">
                            <input type="email" name="email" placeholder="Email Address" required />
                        </div>
                        <div className="input-field">
                            <input type="password" name="password" placeholder="Password" required />
                        </div>
                        <button type="submit" disabled={loading} className="btn-auth">
                            {loading ? 'LOGGING IN...' : 'LOGIN'}
                        </button>
                        <a href="/uploads/stores/my-crust/out/signup/index.html" style={{ display: 'block', textAlign: 'center', marginTop: '16px' }}>New User? Create Account</a>
                    </form>
                </div>
            </div>
        </div>
    );
}
