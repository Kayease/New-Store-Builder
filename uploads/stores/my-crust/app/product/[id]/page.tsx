import React, { Suspense } from 'react'
import ProductClient from './ProductClient'

// This is required for static export (output: export)
export function generateStaticParams() {
    // List of product IDs used as mock data
    return [
        { id: '1' }, // Support numeric fallback
        { id: 'p1' }, { id: 'p2' }, { id: 'p4' }, { id: 'p5' },
        { id: 'p7' }, { id: 'p8' }, { id: 'p9' }, { id: 'p10' },
        { id: 'p11' }, { id: 'p12' }, { id: 'p13' }, { id: 'p14' }
    ]
}

export default function ProductDetailPage() {
    return (
        <Suspense fallback={<div className="container" style={{ padding: '5rem', textAlign: 'center' }}>Loading...</div>}>
            <ProductClient />
        </Suspense>
    )
}
