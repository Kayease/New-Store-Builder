from fastapi import APIRouter  # v2 live_store
from app.api.v1.endpoints import (
    stores, 
    auth, 
    platform_users, 
    subscription_plans, 
    platform_stores, 
    platform_payments,
    razorpay as rzp_router,
    dashboard,
    platform_subscriptions,
    platform_themes,
    public,
    merchant_dashboard,
    onboarding,
    upload,
    domains,
    products,
    categories,
    orders,
    customers,
    live_store,
    reviews,
    notices,
    brands,
    team
)

api_router = APIRouter()

# Include individual endpoint routers
api_router.include_router(domains.router, prefix="/store", tags=["domains"])
api_router.include_router(products.router, prefix="/store/products", tags=["products"])
api_router.include_router(categories.router, prefix="/store/categories", tags=["categories"])
api_router.include_router(orders.router, prefix="/store/orders", tags=["orders"])
api_router.include_router(customers.router, prefix="/store/customers", tags=["customers"])
api_router.include_router(reviews.router, prefix="/store/reviews", tags=["reviews"])
api_router.include_router(notices.router, prefix="/notices", tags=["notices"])
api_router.include_router(brands.router, prefix="/store/brands", tags=["brands"])
api_router.include_router(team.router, prefix="/store/team", tags=["team"])
api_router.include_router(stores.router, prefix="/store", tags=["stores"])

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(platform_users.router, prefix="/platform", tags=["platform-users"])
api_router.include_router(subscription_plans.router, prefix="/platform", tags=["subscription-plans"])
api_router.include_router(platform_stores.router, prefix="/platform", tags=["platform-stores"])
api_router.include_router(platform_payments.router, prefix="/platform", tags=["platform-payments"])
api_router.include_router(platform_subscriptions.router, prefix="/platform", tags=["platform-subscriptions"])
api_router.include_router(platform_themes.router, prefix="/platform", tags=["platform-themes"])
api_router.include_router(rzp_router.router, prefix="/payments/razorpay", tags=["razorpay"])
api_router.include_router(dashboard.router, prefix="/platform/dashboard", tags=["dashboard"])
api_router.include_router(merchant_dashboard.router, prefix="/merchant/dashboard", tags=["merchant-dashboard"])
api_router.include_router(onboarding.router, prefix="/onboarding", tags=["onboarding"])
api_router.include_router(upload.router, prefix="/upload", tags=["upload"])

# Public endpoints (no auth required)
api_router.include_router(public.router, prefix="", tags=["public"])
api_router.include_router(live_store.router, prefix="/s", tags=["live-store"])






