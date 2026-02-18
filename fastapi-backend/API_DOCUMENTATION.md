# Backend API Documentation

This document describes the available API endpoints in the StoreCraft FastAPI backend.

## Base URL
`http://localhost:8000/api/v1`

## Authentication (`/auth`)

### 1. Send OTP
**Endpoint**: `POST /auth/send-otp`  
**Description**: Sends an OTP to the provided phone number. (Development: returns OTP in response)

**Request Body**:
```json
{
  "phone": "9876543210"
}
```

**Response**:
```json
{
  "success": true,
  "message": "OTP sent successfully (Dummy)",
  "debug_otp": "123456"
}
```

### 2. Verify OTP
**Endpoint**: `POST /auth/verify-otp`  
**Description**: Verifies the OTP.

**Request Body**:
```json
{
  "phone": "9876543210",
  "otp": "123456"
}
```

**Response**:
```json
{
  "success": true,
  "message": "OTP verified successfully"
}
```

### 3. Register User
**Endpoint**: `POST /auth/register`  
**Description**: Registers a new user.

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "strongpassword",
  "first_name": "John",
  "last_name": "Doe",
  "phone": "9876543210"
}
```

**Response**:
```json
{
  "success": true,
  "message": "User registered successfully",
  "user_id": "uuid-string"
}
```

### 4. Login
**Endpoint**: `POST /auth/login`  
**Description**: Authenticates a user and returns a JWT token.

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "strongpassword"
}
```

**Response**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1Ni...",
  "refresh_token": "def456...",
  "token_type": "bearer"
}
```

### 5. Get Current User
**Endpoint**: `GET /auth/me`  
**Headers**: `Authorization: Bearer <access_token>`  
**Description**: Returns the profile of the currently logged-in user.

**Response**:
```json
{
  "id": "uuid-string",
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "phone": "9876543210",
  "role": "MERCHANT"
}
```

## Store Payment - Razorpay (`/store/payment`)

These APIs handle the client-side subscription purchase flow.

### 1. Create Order
**Endpoint**: `POST /store/payment/create-order`  
**Description**: Creates a Razorpay order.

**Request Body**:
```json
{
  "amount": 999.00,
  "currency": "INR",
  "planName": "Silver Plan Monthly"
}
```

**Response**:
```json
{
  "order": {
    "id": "order_Kj8X2...",
    "amount": 99900,
    "currency": "INR",
    "status": "created"
  },
  "key": "rzp_test_..."
}
```

---

### 2. Verify Payment
**Endpoint**: `POST /store/payment/verify`  
**Description**: Verifies the Razorpay payment signature and records the transaction in the database.

**Request Body**:
```json
{
  "razorpay_order_id": "order_Kj8X2...",
  "razorpay_payment_id": "pay_Kj8Y9...",
  "razorpay_signature": "signature_hash...",
  "planId": "uuid-of-plan",
  "planName": "Silver Plan Monthly",
  "amount": 999.00,
  "currency": "INR",
  "storeId": "uuid-of-store",
  "storeSlug": "my-cool-store"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Payment verified and recorded successfully",
  "payment_id": "pay_Kj8Y9..."
}
```

---

## Platform Admin - User Management (`/platform`)


These APIs are used by the Super Admin to manage Merchants/Users.

### 1. List All Users (Merchants)
**Endpoint**: `GET /platform/users`  
**Description**: Returns a list of all registered users (merchants and admins).

**Query Parameters** (Optional):
| Parameter | Type | Description |
|-----------|------|-------------|
| skip | int | Number of records to skip (for pagination) |
| limit | int | Max records to return (default: 100) |
| search | string | Filter by name or email |

**Response**:
```json
{
  "items": [
    {
      "id": "uuid-string",
      "_id": "uuid-string",
      "email": "merchant@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "role": "merchant",
      "status": "active",
      "created_at": "2026-02-02T06:53:11.323271+00:00"
    }
  ],
  "total": 1
}
```

---

### 2. Create New Merchant
**Endpoint**: `POST /platform/users`  
**Description**: Creates a new merchant account.

**Request Body**:
```json
{
  "email": "newmerchant@example.com",
  "password": "SecurePassword123!",
  "first_name": "Kirtika",
  "last_name": "Sharma",
  "role": "merchant",
  "status": "active",
  "phone": "9876543210",
  "storeName": "Elegant Boutique",
  "storeSlug": "elegant-boutique",
  "address": {
    "line1": "123 Main Street",
    "city": "Mumbai",
    "state": "Maharashtra",
    "postalCode": "400001",
    "country": "India"
  }
}
```

**Response (Success - 200)**:
```json
{
  "id": "uuid-string",
  "_id": "uuid-string",
  "email": "newmerchant@example.com",
  "first_name": "Kirtika",
  "last_name": "Sharma",
  "role": "merchant",
  "status": "active",
  "created_at": "2026-02-02T07:00:00.000000+00:00"
}
```

**Response (Error - 400)**:
```json
{
  "detail": "Supabase Error: User already registered"
}
```

---

### 3. Get Single User by ID
**Endpoint**: `GET /platform/users/{user_id}`  
**Description**: Returns details of a specific user.

**Path Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| user_id | string (UUID) | The unique ID of the user |

**Response (Success - 200)**:
```json
{
  "id": "uuid-string",
  "_id": "uuid-string",
  "email": "merchant@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "role": "merchant",
  "status": "active",
  "created_at": "2026-02-02T06:53:11.323271+00:00"
}
```

**Response (Error - 404)**:
```json
{
  "detail": "User not found"
}
```

---

### 4. Update User (Edit Merchant)
**Endpoint**: `PUT /platform/users/{user_id}`  
**Description**: Updates an existing user's details.

**Path Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| user_id | string (UUID) | The unique ID of the user |

**Request Body** (All fields optional):
```json
{
  "email": "updated@example.com",
  "first_name": "Jane",
  "last_name": "Smith",
  "role": "merchant",
  "status": "suspended",
  "password": "NewPassword456!"
}
```

**Response (Success - 200)**:
```json
{
  "id": "uuid-string",
  "_id": "uuid-string",
  "email": "updated@example.com",
  "first_name": "Jane",
  "last_name": "Smith",
  "role": "merchant",
  "status": "suspended",
  "created_at": "2026-02-02T06:53:11.323271+00:00"
}
```

---

### 5. Delete User (Remove Merchant)
**Endpoint**: `DELETE /platform/users/{user_id}`  
**Description**: Permanently deletes a user account.

**Path Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| user_id | string (UUID) | The unique ID of the user |

**Response (Success - 200)**:
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

**Response (Error - 400)**:
```json
{
  "detail": "Supabase Error: User not found"
}
```

---

## System Admin (`/admin`)

*(Add Admin endpoints here as they are implemented)*
