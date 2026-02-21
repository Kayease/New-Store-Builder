"use client"

import React from 'react'
import Link from 'next/link'
import { Calendar, User, ArrowRight } from 'lucide-react'

const BLOG_POSTS = [
    {
        id: 1,
        title: 'Top 10 Tech Gadgets for 2024',
        excerpt: 'Discover the latest must-have tech gadgets that will revolutionize your daily life this year...',
        author: 'Admin',
        date: 'Oct 24, 2024',
        image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=2070',
        category: 'Technology'
    },
    {
        id: 2,
        title: 'Essential Fashion Tips for Summer',
        excerpt: 'Stay cool and stylish with our curated list of essential summer fashion trends for every wardrobe...',
        author: 'Sara J.',
        date: 'Oct 22, 2024',
        image: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=2070',
        category: 'Lifestyle'
    },
    {
        id: 3,
        title: 'How to Build Your Dream Home Office',
        excerpt: 'Remote work is here to stay. Learn how to design a workspace that boosts productivity and comfort...',
        author: 'Mike Ross',
        date: 'Oct 15, 2024',
        image: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?q=80&w=2069',
        category: 'Home Office'
    }
]

export default function BlogPage() {
    return (
        <div className="container" style={{ padding: '3rem 0' }}>
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                <h1 style={{ fontSize: '36px' }}>My Crust Editorial</h1>
                <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>Guides, News and Insights for the modern shopper.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '32px' }}>
                {BLOG_POSTS.map(post => (
                    <article key={post.id} className="card" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                        <img src={post.image} alt={post.title} style={{ width: '100%', height: '240px', objectFit: 'cover' }} />
                        <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                            <span style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase' }}>{post.category}</span>
                            <h3 style={{ margin: '12px 0', fontSize: '20px' }}>{post.title}</h3>
                            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '16px' }}>{post.excerpt}</p>

                            <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                                <div className="flex align-center gap-1" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                    <Calendar size={14} /> {post.date}
                                </div>
                                <a href="#" className="flex align-center gap-1" style={{ fontWeight: 600, color: 'var(--primary)' }}>
                                    Read More <ArrowRight size={14} />
                                </a>
                            </div>
                        </div>
                    </article>
                ))}
            </div>
        </div>
    )
}
