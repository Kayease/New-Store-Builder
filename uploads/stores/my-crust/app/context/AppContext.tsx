"use client"

import React, { createContext, useContext } from 'react'

interface CartItem {
    id: string | number
    name: string
    price: number
    oldPrice?: number
    image: string
    quantity: number
}

interface User {
    name: string
    email: string
}

interface AppContextType {
    cart: CartItem[]
    user: User | null
    addToCart: (product: any) => void
    removeFromCart: (id: string | number) => void
    updateQuantity: (id: string | number, delta: number) => void
    login: (userData: User) => void
    logout: () => void
    isCartOpen: boolean
    setIsCartOpen: (open: boolean) => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: React.ReactNode }) {
    const [cart, setCart] = React.useState<CartItem[]>([])
    const [user, setUser] = React.useState<User | null>(null)
    const [isCartOpen, setIsCartOpen] = React.useState(false)

    // Load state on mount
    React.useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedCart = localStorage.getItem('nexus_cart')
            const savedUser = localStorage.getItem('nexus_user')
            if (savedCart) setCart(JSON.parse(savedCart))
            if (savedUser) setUser(JSON.parse(savedUser))
        }
    }, [])

    // Save changes
    React.useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('nexus_cart', JSON.stringify(cart))
        }
    }, [cart])

    const addToCart = (product: any) => {
        setCart(prev => {
            const exists = prev.find(item => item.id === product.id)
            if (exists) {
                return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item)
            }
            return [...prev, { ...product, quantity: 1 }]
        })
        setIsCartOpen(true)
    }

    const removeFromCart = (id: string | number) => {
        setCart(prev => prev.filter(item => item.id !== id))
    }

    const updateQuantity = (id: string | number, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.id === id) {
                const newQty = Math.max(1, item.quantity + delta)
                return { ...item, quantity: newQty }
            }
            return item
        }))
    }

    const login = (userData: User) => {
        setUser(userData)
        localStorage.setItem('nexus_user', JSON.stringify(userData))
    }

    const logout = () => {
        setUser(null)
        localStorage.removeItem('nexus_user')
    }

    return (
        <AppContext.Provider value={{
            cart, user, addToCart, removeFromCart, updateQuantity, login, logout, isCartOpen, setIsCartOpen
        }}>
            {children}
        </AppContext.Provider>
    )
}

export function useAppContext() {
    const context = useContext(AppContext)
    if (context === undefined) throw new Error('useAppContext must be used within AppProvider')
    return context
}
