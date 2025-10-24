# Trio by Maham Café - Backend API Documentation

## Overview

This is the complete backend REST API documentation for the Trio by Maham Café web portal. The API is built using Node.js, Express, TypeScript, and MongoDB.

**Base URL:** `http://localhost:5000`
**API Documentation:** `http://localhost:5000/api-docs`

---

## Table of Contents

1. [Authentication](#authentication)
2. [Admin Management](#admin-management)
3. [Categories](#categories)
4. [Products](#products)
5. [Product Images](#product-images)
6. [Product Variants](#product-variants)
7. [Reviews](#reviews)
8. [Orders](#orders)
9. [Subscriptions](#subscriptions)
10. [Sessions](#sessions)
11. [Analytics](#analytics)
12. [Error Handling](#error-handling)
13. [Data Models](#data-models)
14. [API Design Patterns](#api-design-patterns)
15. [Best Practices](#best-practices)

---

## Authentication

### Admin Login
- **POST** `/api/auth/login`
- **Body:**
  ```json
  {
    "email": "admin@triocafe.com",
    "password": "password123"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "message": "Login successful",
    "data": {
      "token": "jwt_token_here",
      "admin": {
        "id": "admin_id",
        "name": "Admin Name",
        "email": "admin@triocafe.com",
        "role": "admin"
      }
    }
  }
  ```

### Get Admin Profile
- **GET** `/api/auth/profile`
- **Headers:** `Authorization: Bearer {token}`
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "id": "admin_id",
      "name": "Admin Name",
      "email": "admin@triocafe.com",
      "role": "admin",
      "createdAt": "2025-01-15T10:30:00.000Z"
    }
  }
  ```

### Change Password
- **PUT** `/api/auth/change-password`
- **Headers:** `Authorization: Bearer {token}`
- **Body:**
  ```json
  {
    "currentPassword": "oldpassword",
    "newPassword": "newpassword123"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "message": "Password changed successfully"
  }
  ```

---

## Admin Management

**Note:** All admin management endpoints require Super Admin role.

### Create Admin
- **POST** `/api/admins`
- **Headers:** `Authorization: Bearer {token}`
- **Body:**
  ```json
  {
    "name": "New Admin",
    "email": "newadmin@triocafe.com",
    "password": "password123",
    "role": "admin"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "message": "Admin created successfully",
    "data": {
      "id": "admin_id",
      "name": "New Admin",
      "email": "newadmin@triocafe.com",
      "role": "admin",
      "createdAt": "2025-01-15T10:30:00.000Z"
    }
  }
  ```

### Get All Admins
- **GET** `/api/admins?page=1&limit=10`
- **Headers:** `Authorization: Bearer {token}`
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "admins": [
        {
          "id": "admin_id",
          "name": "Admin Name",
          "email": "admin@triocafe.com",
          "role": "admin",
          "createdAt": "2025-01-15T10:30:00.000Z"
        }
      ],
      "pagination": {
        "total": 5,
        "page": 1,
        "limit": 10,
        "totalPages": 1
      }
    }
  }
  ```

### Get Admin by ID
- **GET** `/api/admins/:id`
- **Headers:** `Authorization: Bearer {token}`
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "id": "admin_id",
      "name": "Admin Name",
      "email": "admin@triocafe.com",
      "role": "admin",
      "createdAt": "2025-01-15T10:30:00.000Z"
    }
  }
  ```

### Update Admin
- **PUT** `/api/admins/:id`
- **Headers:** `Authorization: Bearer {token}`
- **Body:**
  ```json
  {
    "name": "Updated Admin Name",
    "role": "super_admin"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "message": "Admin updated successfully",
    "data": {
      "id": "admin_id",
      "name": "Updated Admin Name",
      "email": "admin@triocafe.com",
      "role": "super_admin"
    }
  }
  ```

### Delete Admin
- **DELETE** `/api/admins/:id`
- **Headers:** `Authorization: Bearer {token}`
- **Response:**
  ```json
  {
    "success": true,
    "message": "Admin deleted successfully"
  }
  ```

---

## Categories

### Create Category (Admin Only)
- **POST** `/api/categories`
- **Headers:** `Authorization: Bearer {token}`
- **Body:**
  ```json
  {
    "name": "Coffee",
    "slug": "coffee",
    "description": "All coffee products",
    "parentId": null
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "message": "Category created successfully",
    "data": {
      "id": "category_id",
      "name": "Coffee",
      "slug": "coffee",
      "description": "All coffee products",
      "parentId": null,
      "createdAt": "2025-01-15T10:30:00.000Z"
    }
  }
  ```

### Get All Categories
- **GET** `/api/categories`
- **Query Params:**
  - `parentId`: Filter by parent category (use 'null' for root categories)
- **Response:**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "category_id",
        "name": "Coffee",
        "slug": "coffee",
        "description": "All coffee products",
        "parentId": null,
        "createdAt": "2025-01-15T10:30:00.000Z"
      }
    ]
  }
  ```

### Get Category by ID
- **GET** `/api/categories/:id`
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "id": "category_id",
      "name": "Coffee",
      "slug": "coffee",
      "description": "All coffee products",
      "parentId": null,
      "createdAt": "2025-01-15T10:30:00.000Z"
    }
  }
  ```

### Get Category by Slug
- **GET** `/api/categories/slug/:slug`
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "id": "category_id",
      "name": "Coffee",
      "slug": "coffee",
      "description": "All coffee products",
      "parentId": null,
      "createdAt": "2025-01-15T10:30:00.000Z"
    }
  }
  ```

### Update Category (Admin Only)
- **PUT** `/api/categories/:id`
- **Headers:** `Authorization: Bearer {token}`
- **Body:**
  ```json
  {
    "name": "Premium Coffee",
    "description": "High-quality coffee products"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "message": "Category updated successfully",
    "data": {
      "id": "category_id",
      "name": "Premium Coffee",
      "slug": "coffee",
      "description": "High-quality coffee products",
      "parentId": null
    }
  }
  ```

### Delete Category (Admin Only)
- **DELETE** `/api/categories/:id`
- **Headers:** `Authorization: Bearer {token}`
- **Response:**
  ```json
  {
    "success": true,
    "message": "Category deleted successfully"
  }
  ```

---

## Products

### Create Product (Admin Only)
- **POST** `/api/products`
- **Headers:** `Authorization: Bearer {token}`
- **Body:**
  ```json
  {
    "categoryId": "category_id",
    "name": "Espresso",
    "slug": "espresso",
    "description": "Strong Italian coffee",
    "price": 3.50,
    "discountPercent": 10,
    "quantity": 100,
    "productType": "coffee",
    "keywords": "coffee, espresso, strong",
    "features": "Rich flavor, High caffeine",
    "images": [
      {
        "url": "https://example.com/image1.jpg",
        "isPrimary": true
      }
    ],
    "variants": [
      {
        "name": "Size",
        "value": "Medium"
      }
    ]
  }
  ```

### Get All Products
- **GET** `/api/products?page=1&limit=12`
- **Query Params:**
  - `categoryId`: Filter by category
  - `productType`: Filter by type (coffee, drink, sandwich, dessert, flower, book)
  - `minPrice`, `maxPrice`: Price range
  - `search`: Search in name, keywords, description
  - `sort`: Sort by (price_asc, price_desc, rating, name)

### Get Product by ID
- **GET** `/api/products/:id`
- **Response includes:** product details, images, and variants

### Get Product by Slug
- **GET** `/api/products/slug/:slug`

### Update Product (Admin Only)
- **PUT** `/api/products/:id`
- **Headers:** `Authorization: Bearer {token}`

### Update Product Stock (Admin Only)
- **PUT** `/api/products/:id/stock`
- **Headers:** `Authorization: Bearer {token}`
- **Body:**
  ```json
  {
    "quantity": 50
  }
  ```

### Delete Product (Admin Only)
- **DELETE** `/api/products/:id`
- **Headers:** `Authorization: Bearer {token}`
- **Response:**
  ```json
  {
    "success": true,
    "message": "Product deleted successfully"
  }
  ```

---

## Product Images

Product images are uploaded to Cloudinary and stored as separate MongoDB documents linked to their product. Each product can have many images, but only one may be flagged as primary at a time. Responses expose a computed `publicUrl` that prefers Cloudinary’s `secure_url` while keeping the legacy `imageUrl` field populated for older clients.

### Upload image (Admin only)
- **POST** `/api/products/:productId/images/upload`
- **Headers:** `Authorization: Bearer {token}`
- **Body:** `multipart/form-data`
  - `file` (binary, required)
  - `isPrimary` (boolean, optional)
  - `alt` (string, optional, ≤255 chars)
  - `sort_order` (integer, optional)
- **Typical client flow:**
  1. Construct `FormData` and append `file` (e.g. `form.append('file', selectedFile)`).
  2. Optionally append `isPrimary`, `alt`, and `sort_order`.
  3. POST to `/images/upload` with the admin bearer token.
  4. Repeat for each gallery image—call once per file. The first request with `isPrimary=true` (or the first image when none are flagged) becomes the hero image.
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "_id": "675a12d3e9dcd6001234abcd",
      "productId": "675a12b8e9dcd6001234abca",
      "cloudinaryPublicId": "app/uploads/products/675a12b8e9dcd6001234abca/hero_x1yz",
      "secureUrl": "https://res.cloudinary.com/your-cloud/image/upload/v1698153600/app/uploads/products/675a12b8e9dcd6001234abca/hero_x1yz.webp",
      "imageUrl": "https://res.cloudinary.com/your-cloud/image/upload/v1698153600/app/uploads/products/675a12b8e9dcd6001234abca/hero_x1yz.webp",
      "format": "webp",
      "bytes": 284320,
      "width": 1280,
      "height": 720,
      "etag": "e2bd0f34c1234caab567890",
      "isPrimary": true,
      "alt": "Front hero shot",
      "sortOrder": 0,
      "publicUrl": "https://res.cloudinary.com/your-cloud/image/upload/v1698153600/app/uploads/products/675a12b8e9dcd6001234abca/hero_x1yz.webp",
      "createdAt": "2025-10-24T12:00:00.000Z",
      "updatedAt": "2025-10-24T12:00:00.000Z"
    }
  }
  ```

### List product images
- **GET** `/api/products/:productId/images?limit=20&cursor=`
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "items": [
        {
          "_id": "675a12d3e9dcd6001234abcd",
          "publicUrl": "https://res.cloudinary.com/.../hero_x1yz.webp",
          "isPrimary": true,
          "alt": "Front hero shot",
          "sortOrder": 0
        }
      ],
      "pagination": {
        "limit": 20,
        "nextCursor": null
      }
    }
  }
  ```

### Get product image by ID
- **GET** `/api/products/:productId/images/:imageId`

### Update metadata (Admin only)
- **PATCH** `/api/products/:productId/images/:imageId`
- **Body:**
  ```json
  {
    "alt": "Side angle",
    "isPrimary": false,
    "sort_order": 2
  }
  ```
- Setting `isPrimary` to `true` automatically clears the flag on sibling images within the same product.

### Delete image (Admin only)
- **DELETE** `/api/products/:productId/images/:imageId?deleteFile=true`
- When `deleteFile=true`, the backend also removes the corresponding Cloudinary asset if a `cloudinaryPublicId` is stored. Failures in Cloudinary deletion are logged but do not stop the metadata removal.

### Unsigned uploads (optional client flow)

If you prefer client-side uploads, create an unsigned Cloudinary `upload_preset` and expose it on the frontend. The backend still expects you to call `POST /images/upload` so metadata is stored and the single-primary invariant is enforced. The preset name can be provided through `CLOUDINARY_UPLOAD_PRESET`; it is informational only for the multer path described above.
- **DELETE** `/api/products/:productId/images/:imageId`
- **Headers:** `Authorization: Bearer {token}`
- **Response:**
  ```json
  {
    "success": true,
    "message": "Product image deleted successfully"
  }
  ```

---

## Product Variants

Product variants represent purchasable SKUs per product. Each variant tracks price, stock, status (`draft | active | archived`), and optional attribute pairs (e.g., Size, Colour). Responses expose the modern `variants` array while keeping `legacyVariantAttributes` for older clients still relying on name/value pairs.

### Create variant (Admin only)
- **POST** `/api/products/:productId/variants`
- **Headers:** `Authorization: Bearer {token}`
- **Body:**
  ```json
  {
    "sku": "HOUSE-BLEND-250G",
    "price": 12.5,
    "stock": 50,
    "status": "active",
    "attributes": [
      { "name": "Size", "value": "250g" },
      { "name": "Roast", "value": "Medium" }
    ]
  }
  ```

### List variants
- **GET** `/api/products/:productId/variants?sku=HOUSE&status=active&limit=20&cursor=`
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "items": [
        {
          "_id": "675a12f0e9dcd6001234abce",
          "sku": "HOUSE-BLEND-250G",
          "price": 12.5,
          "stock": 50,
          "status": "active",
          "attributes": [
            { "name": "Size", "value": "250g" },
            { "name": "Roast", "value": "Medium" }
          ],
          "createdAt": "2025-10-24T12:05:00.000Z",
          "updatedAt": "2025-10-24T12:05:00.000Z"
        }
      ],
      "pagination": {
        "limit": 20,
        "nextCursor": null
      }
    }
  }
  ```

### Get variant
- **GET** `/api/products/:productId/variants/:variantId`

### Update variant (Admin only)
- **PATCH** `/api/products/:productId/variants/:variantId`
- **Body:**
  ```json
  {
    "price": 13.0,
    "stock": 48,
    "status": "active",
    "attributes": [
      { "name": "Size", "value": "250g" },
      { "name": "Roast", "value": "Medium" },
      { "name": "Grind", "value": "Whole Bean" }
    ]
  }
  ```

### Delete variant (Admin only)
- **DELETE** `/api/products/:productId/variants/:variantId`

> **Note:** Legacy endpoints that stored simple attribute pairs continue to populate `legacyVariantAttributes` in product responses, but new writes should use the SKU-based CRUD above.

## Reviews

### Create Review (Admin Only)
- **POST** `/api/reviews`
- **Headers:** `Authorization: Bearer {token}`
- **Body:**
  ```json
  {
    "productId": "product_id",
    "rating": 5,
    "comment": "Excellent product!",
    "imageUrl": "https://example.com/review.jpg"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "message": "Review created successfully",
    "data": {
      "id": "review_id",
      "productId": "product_id",
      "rating": 5,
      "comment": "Excellent product!",
      "imageUrl": "https://example.com/review.jpg",
      "isApproved": false,
      "createdAt": "2025-01-15T10:30:00.000Z"
    }
  }
  ```

### Get Reviews by Product
- **GET** `/api/reviews/product/:productId?approved=true`
- **Query Params:**
  - `approved`: Filter by approval status (true/false)
- **Response:**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "review_id",
        "productId": "product_id",
        "rating": 5,
        "comment": "Excellent product!",
        "imageUrl": "https://example.com/review.jpg",
        "isApproved": true,
        "createdAt": "2025-01-15T10:30:00.000Z"
      }
    ]
  }
  ```

### Update Review (Admin Only)
- **PUT** `/api/reviews/:id`
- **Headers:** `Authorization: Bearer {token}`
- **Body:**
  ```json
  {
    "rating": 4,
    "comment": "Updated review comment",
    "isApproved": true
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "message": "Review updated successfully",
    "data": {
      "id": "review_id",
      "productId": "product_id",
      "rating": 4,
      "comment": "Updated review comment",
      "isApproved": true
    }
  }
  ```

### Delete Review (Admin Only)
- **DELETE** `/api/reviews/:id`
- **Headers:** `Authorization: Bearer {token}`
- **Response:**
  ```json
  {
    "success": true,
    "message": "Review deleted successfully"
  }
  ```

---

## Orders

### Create Order
- **POST** `/api/orders`
- **Body:**
  ```json
  {
    "sessionId": "session_token",
    "customerEmail": "customer@example.com",
    "customerPhone": "+1234567890",
    "shippingAddress": "123 Main St, City, Country",
    "items": [
      {
        "productId": "product_id",
        "quantity": 2
      }
    ],
    "paymentDetails": {
      "gateway": "placeholder",
      "transactionRef": "TXN123456"
    }
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "message": "Order created successfully",
    "data": {
      "id": "order_id",
      "sessionId": "session_token",
      "customerEmail": "customer@example.com",
      "customerPhone": "+1234567890",
      "shippingAddress": "123 Main St, City, Country",
      "totalAmount": 125.50,
      "paymentStatus": "pending",
      "deliveryStatus": "processing",
      "items": [
        {
          "productId": "product_id",
          "productName": "Espresso",
          "quantity": 2,
          "price": 3.50,
          "subtotal": 7.00
        }
      ],
      "createdAt": "2025-01-15T10:30:00.000Z"
    }
  }
  ```

### Get All Orders (Admin Only)
- **GET** `/api/orders?page=1&limit=10`
- **Headers:** `Authorization: Bearer {token}`
- **Query Params:**
  - `paymentStatus`: pending, paid, failed
  - `deliveryStatus`: processing, delivered, cancelled
  - `customerEmail`: Filter by email
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "orders": [
        {
          "id": "order_id",
          "customerEmail": "customer@example.com",
          "customerPhone": "+1234567890",
          "totalAmount": 125.50,
          "paymentStatus": "paid",
          "deliveryStatus": "processing",
          "createdAt": "2025-01-15T10:30:00.000Z"
        }
      ],
      "pagination": {
        "total": 45,
        "page": 1,
        "limit": 10,
        "totalPages": 5
      }
    }
  }
  ```

### Get Order by ID
- **GET** `/api/orders/:id`
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "id": "order_id",
      "sessionId": "session_token",
      "customerEmail": "customer@example.com",
      "customerPhone": "+1234567890",
      "shippingAddress": "123 Main St, City, Country",
      "totalAmount": 125.50,
      "paymentStatus": "paid",
      "deliveryStatus": "delivered",
      "items": [
        {
          "id": "item_id",
          "productId": "product_id",
          "productName": "Espresso",
          "quantity": 2,
          "price": 3.50,
          "subtotal": 7.00
        }
      ],
      "transactions": [
        {
          "id": "transaction_id",
          "gateway": "placeholder",
          "transactionRef": "TXN123456",
          "amount": 125.50,
          "status": "completed",
          "createdAt": "2025-01-15T10:30:00.000Z"
        }
      ],
      "createdAt": "2025-01-15T10:30:00.000Z",
      "updatedAt": "2025-01-15T11:00:00.000Z"
    }
  }
  ```

### Update Order Status (Admin Only)
- **PUT** `/api/orders/:id/status`
- **Headers:** `Authorization: Bearer {token}`
- **Body:**
  ```json
  {
    "paymentStatus": "paid",
    "deliveryStatus": "delivered"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "message": "Order status updated successfully",
    "data": {
      "id": "order_id",
      "paymentStatus": "paid",
      "deliveryStatus": "delivered",
      "updatedAt": "2025-01-15T11:00:00.000Z"
    }
  }
  ```

### Delete Order (Admin Only)
- **DELETE** `/api/orders/:id`
- **Headers:** `Authorization: Bearer {token}`
- **Response:**
  ```json
  {
    "success": true,
    "message": "Order deleted successfully"
  }
  ```

---

## Subscriptions

### Create Subscription Plan (Admin Only)
- **POST** `/api/subscriptions/plans`
- **Headers:** `Authorization: Bearer {token}`
- **Body:**
  ```json
  {
    "name": "Monthly Flower Subscription",
    "frequency": "monthly",
    "price": 29.99,
    "description": "Fresh flowers delivered monthly"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "message": "Subscription plan created successfully",
    "data": {
      "id": "plan_id",
      "name": "Monthly Flower Subscription",
      "frequency": "monthly",
      "price": 29.99,
      "description": "Fresh flowers delivered monthly",
      "isActive": true,
      "createdAt": "2025-01-15T10:30:00.000Z"
    }
  }
  ```

### Get All Subscription Plans
- **GET** `/api/subscriptions/plans?frequency=monthly`
- **Query Params:**
  - `frequency`: Filter by frequency (weekly, monthly, custom)
  - `isActive`: Filter by active status
- **Response:**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "plan_id",
        "name": "Monthly Flower Subscription",
        "frequency": "monthly",
        "price": 29.99,
        "description": "Fresh flowers delivered monthly",
        "isActive": true,
        "createdAt": "2025-01-15T10:30:00.000Z"
      }
    ]
  }
  ```

### Update Subscription Plan (Admin Only)
- **PUT** `/api/subscriptions/plans/:id`
- **Headers:** `Authorization: Bearer {token}`
- **Body:**
  ```json
  {
    "name": "Premium Monthly Flowers",
    "price": 39.99,
    "isActive": true
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "message": "Subscription plan updated successfully",
    "data": {
      "id": "plan_id",
      "name": "Premium Monthly Flowers",
      "frequency": "monthly",
      "price": 39.99,
      "isActive": true
    }
  }
  ```

### Delete Subscription Plan (Admin Only)
- **DELETE** `/api/subscriptions/plans/:id`
- **Headers:** `Authorization: Bearer {token}`
- **Response:**
  ```json
  {
    "success": true,
    "message": "Subscription plan deleted successfully"
  }
  ```

### Create Subscription
- **POST** `/api/subscriptions`
- **Body:**
  ```json
  {
    "planId": "plan_id",
    "sessionId": "session_token",
    "customerEmail": "customer@example.com",
    "customerPhone": "+1234567890",
    "giftFor": "John Doe",
    "deliveryAddress": "456 Oak Ave, City",
    "startDate": "2025-11-01"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "message": "Subscription created successfully",
    "data": {
      "id": "subscription_id",
      "planId": "plan_id",
      "sessionId": "session_token",
      "customerEmail": "customer@example.com",
      "customerPhone": "+1234567890",
      "giftFor": "John Doe",
      "deliveryAddress": "456 Oak Ave, City",
      "startDate": "2025-11-01T00:00:00.000Z",
      "status": "active",
      "recoveryToken": "unique_recovery_token_here",
      "createdAt": "2025-01-15T10:30:00.000Z"
    }
  }
  ```

### Get All Subscriptions (Admin Only)
- **GET** `/api/subscriptions?page=1&limit=10`
- **Headers:** `Authorization: Bearer {token}`
- **Query Params:**
  - `status`: active, cancelled, expired
  - `customerEmail`: Filter by email
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "subscriptions": [
        {
          "id": "subscription_id",
          "planId": "plan_id",
          "planName": "Monthly Flower Subscription",
          "customerEmail": "customer@example.com",
          "status": "active",
          "startDate": "2025-11-01T00:00:00.000Z",
          "createdAt": "2025-01-15T10:30:00.000Z"
        }
      ],
      "pagination": {
        "total": 25,
        "page": 1,
        "limit": 10,
        "totalPages": 3
      }
    }
  }
  ```

### Get Subscription by ID
- **GET** `/api/subscriptions/:id`
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "id": "subscription_id",
      "planId": "plan_id",
      "sessionId": "session_token",
      "customerEmail": "customer@example.com",
      "customerPhone": "+1234567890",
      "giftFor": "John Doe",
      "deliveryAddress": "456 Oak Ave, City",
      "startDate": "2025-11-01T00:00:00.000Z",
      "endDate": null,
      "status": "active",
      "recoveryToken": "unique_recovery_token_here",
      "plan": {
        "id": "plan_id",
        "name": "Monthly Flower Subscription",
        "frequency": "monthly",
        "price": 29.99
      },
      "createdAt": "2025-01-15T10:30:00.000Z"
    }
  }
  ```

### Get Subscription by Recovery Token
- **GET** `/api/subscriptions/token/:token`
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "id": "subscription_id",
      "customerEmail": "customer@example.com",
      "deliveryAddress": "456 Oak Ave, City",
      "status": "active",
      "startDate": "2025-11-01T00:00:00.000Z",
      "plan": {
        "name": "Monthly Flower Subscription",
        "frequency": "monthly"
      }
    }
  }
  ```

### Cancel Subscription
- **PUT** `/api/subscriptions/:id/cancel`
- **Response:**
  ```json
  {
    "success": true,
    "message": "Subscription cancelled successfully",
    "data": {
      "id": "subscription_id",
      "status": "cancelled",
      "endDate": "2025-01-15T10:30:00.000Z"
    }
  }
  ```

---

## Sessions

Sessions are used for guest checkout functionality, allowing customers to make purchases without creating an account.

### Create Session
- **POST** `/api/sessions`
- **Body:** Empty (optional)
- **Response:** Sets `session_token` HTTP-only cookie
  ```json
  {
    "success": true,
    "message": "Session created successfully",
    "data": {
      "sessionId": "unique_session_id",
      "expiresAt": "2025-01-16T10:30:00.000Z"
    }
  }
  ```

### Get Current Session
- **GET** `/api/sessions`
- **Requires:** `session_token` cookie
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "sessionId": "unique_session_id",
      "createdAt": "2025-01-15T10:30:00.000Z",
      "expiresAt": "2025-01-16T10:30:00.000Z",
      "isActive": true
    }
  }
  ```

### Expire Session
- **DELETE** `/api/sessions`
- **Requires:** `session_token` cookie
- **Response:** Clears `session_token` cookie
  ```json
  {
    "success": true,
    "message": "Session expired successfully"
  }
  ```

---

## Analytics

**Note:** All analytics endpoints require admin authentication.

### Dashboard Stats
- **GET** `/api/analytics/dashboard`
- **Headers:** `Authorization: Bearer {token}`
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "totalProducts": 150,
      "totalOrders": 320,
      "totalSubscriptions": 45,
      "lowStockProducts": 12,
      "totalRevenue": 15430.50,
      "pendingOrders": 8
    }
  }
  ```

### Best Sellers
- **GET** `/api/analytics/best-sellers?limit=10`
- **Headers:** `Authorization: Bearer {token}`
- **Query Params:**
  - `limit`: Number of products to return (default: 10)
- **Response:**
  ```json
  {
    "success": true,
    "data": [
      {
        "productId": "product_id",
        "productName": "Espresso",
        "totalSold": 450,
        "revenue": 1575.00,
        "category": "Coffee"
      }
    ]
  }
  ```

### Revenue Stats
- **GET** `/api/analytics/revenue?period=monthly`
- **Headers:** `Authorization: Bearer {token}`
- **Query Params:**
  - `period`: daily, monthly, yearly
  - `startDate`: Optional start date for custom range
  - `endDate`: Optional end date for custom range
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "period": "monthly",
      "totalRevenue": 45230.50,
      "orderCount": 320,
      "averageOrderValue": 141.34,
      "breakdown": [
        {
          "date": "2025-01",
          "revenue": 15430.50,
          "orders": 110
        },
        {
          "date": "2025-02",
          "revenue": 16800.00,
          "orders": 120
        },
        {
          "date": "2025-03",
          "revenue": 13000.00,
          "orders": 90
        }
      ]
    }
  }
  ```

### Product Stats
- **GET** `/api/analytics/products`
- **Headers:** `Authorization: Bearer {token}`
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "totalProducts": 150,
      "activeProducts": 142,
      "lowStockProducts": 12,
      "outOfStockProducts": 3,
      "productsByType": {
        "coffee": 45,
        "drink": 30,
        "sandwich": 25,
        "dessert": 20,
        "flower": 15,
        "book": 15
      }
    }
  }
  ```

### Top Rated Products
- **GET** `/api/analytics/top-rated?limit=10`
- **Headers:** `Authorization: Bearer {token}`
- **Query Params:**
  - `limit`: Number of products to return (default: 10)
- **Response:**
  ```json
  {
    "success": true,
    "data": [
      {
        "productId": "product_id",
        "productName": "Espresso",
        "averageRating": 4.8,
        "reviewCount": 124,
        "category": "Coffee"
      }
    ]
  }
  ```

---

## Error Handling

All API responses follow a consistent format across all endpoints:

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {}
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "errors": []
}
```

### HTTP Status Codes
- `200` - Success
- `201` - Resource created
- `400` - Bad request / Validation error
- `401` - Unauthorized / Authentication required
- `403` - Forbidden / Insufficient permissions
- `404` - Resource not found
- `500` - Internal server error

---

## Data Models

### Product Types
- `coffee`
- `drink`
- `sandwich`
- `dessert`
- `flower`
- `book`

### Order Payment Status
- `pending`
- `paid`
- `failed`

### Order Delivery Status
- `processing`
- `delivered`
- `cancelled`

### Subscription Status
- `active`
- `cancelled`
- `expired`

### Subscription Frequency
- `weekly`
- `monthly`
- `custom`

### Admin Roles
- `admin`
- `super_admin`

---

## Environment Variables

Required environment variables:

```env
NODE_ENV=development
PORT=5000

MONGODB_URI=your_mongodb_connection_string

JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=24h

SESSION_SECRET=your_session_secret
SESSION_COOKIE_MAX_AGE=86400000

CORS_ORIGIN=http://localhost:5173
```

---

## Authentication Flow

1. **Admin Login:** POST to `/api/auth/login` with credentials
2. **Receive Token:** Get JWT token in response
3. **Use Token:** Include token in `Authorization: Bearer {token}` header for protected routes
4. **Guest Sessions:** Create session via `/api/sessions` for guest checkout

---

## API Design Patterns

### Naming Conventions
- **Endpoints:** Use plural nouns for resources (`/api/products`, `/api/categories`)
- **Query Parameters:** Use camelCase (`customerEmail`, `productType`)
- **Response Fields:** Use camelCase for all JSON properties
- **IDs:** All entity IDs use the format `{entity}_id` (e.g., `product_id`, `order_id`)

### Consistent Response Structure
All endpoints return responses in the following format:
```json
{
  "success": true | false,
  "message": "Optional message",
  "data": {} | [],
  "errors": [] // Only present on validation errors
}
```

### Pagination Pattern
Endpoints returning lists use consistent pagination:
```json
{
  "success": true,
  "data": {
    "items": [],
    "pagination": {
      "total": 100,
      "page": 1,
      "limit": 10,
      "totalPages": 10
    }
  }
}
```

### Nested Resources
Related resources use nested URL patterns:
- `/api/products/:productId/images` - Product images
- `/api/products/:productId/variants` - Product variant attributes
- `/api/reviews/product/:productId` - Reviews for a product

### Filter and Query Parameters
- **Filtering:** Use query parameters for filtering (`?status=active`)
- **Pagination:** Use `page` and `limit` parameters
- **Search:** Use `search` parameter for text search
- **Sorting:** Use `sort` parameter with values like `price_asc`, `price_desc`

---

## Best Practices

1. **Always validate input** on the frontend before sending requests
2. **Handle errors gracefully** and display user-friendly messages
3. **Use HTTPS** in production
4. **Store JWT tokens securely** (not in localStorage, use httpOnly cookies or secure storage)
5. **Implement request rate limiting** on frontend
6. **Cache frequently accessed data** (categories, product lists)
7. **Implement loading states** for all API calls
8. **Use pagination** for large data sets
9. **Follow naming conventions** consistently across your frontend application
10. **Handle HTTP-only cookies** properly for session management

---

## Swagger Documentation

Interactive API documentation is available at:
- **Local:** `http://localhost:5000/api-docs`
- **JSON Spec:** `http://localhost:5000/api-docs.json`

The Swagger documentation provides:
- Complete endpoint descriptions
- Request/response schemas
- Interactive testing interface
- Authentication testing

---

## Support

For any questions or issues, contact: support@triocafe.com

---

**Version:** 1.0.0
**Last Updated:** October 2025
