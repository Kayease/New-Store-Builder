/**
 * Centralized API Routes Configuration
 * 
 * This file contains all the API endpoint paths used in the application.
 * Changing a path here will update it throughout the application.
 */

export const API_ROUTES = {
    AUTH: {
        LOGIN: "/auth/login",
        REGISTER: "/auth/register",
        SEND_OTP: "/auth/send-otp",
        VERIFY_OTP: "/auth/verify-otp",
        ME: "/auth/me",
        REFRESH: "/auth/refresh",
        LOGOUT: "/auth/logout",
        LOGOUT_ALL: "/auth/logout-all",
        CHECK_PHONE: "/auth/check-phone",
        FORGOT_PASSWORD: "/auth/forgot-password",
        RESET_PASSWORD: "/auth/reset-password",
    },
    STORE: {
        ROOT: "/store",
        INIT: "/store/init",
        PRODUCTS: "/store/products",
        CATEGORIES: "/store/categories",
        CART_SYNC: "/store/cart/sync",
        CHECKOUT_INIT: "/store/checkout/init",
        CHECKOUT_VERIFY: "/store/checkout/verify",
        CUSTOMER_LOGIN: "/store/customer/login",
        CUSTOMER_REGISTER: "/store/customer/register",
        MY_ORDERS: "/store/customer/orders",
    },
    ADMIN: {
        DASHBOARD_STATS: "/admin/dashboard/stats",
        STORES: "/admin/stores",
        PLANS: "/admin/plans",
        PAYMENTS: "/admin/payments",
        SUBSCRIPTIONS: "/admin/subscriptions",
        INVOICES: "/admin/invoices",
        NOTICES: "/admin/notices",
        SETTINGS: "/admin/settings",
        AUDIT_LOGS: "/admin/audit-logs",
    },
    MANAGER: {
        ANALYTICS: "/manager/analytics",
        PRODUCTS: "/manager/products",
        CATEGORIES: "/manager/categories",
        ORDERS: "/manager/orders",
        CUSTOMERS: "/manager/customers",
        TEAM: "/manager/team",
        CONFIG: "/manager/config",
        THEMES: "/manager/themes",
        COUPONS: "/manager/coupons",
        SMART_BANNERS: "/manager/smartbanners",
        BLOGS: "/manager/blogs",
        REVIEWS: "/manager/reviews",
    },
    PAYMENTS: {
        HISTORY: "/payments/history",
        SUBSCRIPTION: "/payments/subscription",
        RAZORPAY_ORDER: "/payments/razorpay/order",
        RAZORPAY_VERIFY: "/payments/razorpay/verify",
    },
    UPLOAD: {
        ROOT: "/upload",
    }
};
