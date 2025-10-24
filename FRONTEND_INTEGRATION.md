# Frontend Integration Guide

Quick reference for frontend developers integrating with the Trio by Maham Café backend API.

## Base Configuration

```javascript
const API_BASE_URL = 'http://localhost:5000';

const config = {
  headers: {
    'Content-Type': 'application/json'
  },
  credentials: 'include' // Important for cookies
};
```

## Authentication Flow

### 1. Admin Login

```javascript
const login = async (email, password) => {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    ...config,
    body: JSON.stringify({ email, password })
  });

  const data = await response.json();

  if (data.success) {
    // Store token in secure storage (NOT localStorage)
    sessionStorage.setItem('token', data.data.token);
    return data.data;
  }
  throw new Error(data.message);
};
```

### 2. Authenticated Requests

```javascript
const authConfig = (token) => ({
  ...config,
  headers: {
    ...config.headers,
    'Authorization': `Bearer ${token}`
  }
});

const getProfile = async (token) => {
  const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
    method: 'GET',
    ...authConfig(token)
  });
  return response.json();
};
```

## Guest Session Management

### Create Session for Guest Checkout

```javascript
const createSession = async () => {
  const response = await fetch(`${API_BASE_URL}/api/sessions`, {
    method: 'POST',
    ...config
  });

  const data = await response.json();
  // Session token is automatically stored in HTTP-only cookie
  return data.data.sessionId;
};
```

## Product Operations

### Fetch Products with Filters

```javascript
const getProducts = async (filters = {}) => {
  const params = new URLSearchParams({
    page: filters.page || 1,
    limit: filters.limit || 12,
    ...(filters.categoryId && { categoryId: filters.categoryId }),
    ...(filters.productType && { productType: filters.productType }),
    ...(filters.search && { search: filters.search }),
    ...(filters.sort && { sort: filters.sort })
  });

  const response = await fetch(
    `${API_BASE_URL}/api/products?${params}`,
    { method: 'GET', ...config }
  );

  return response.json();
};
```

### Get Single Product

```javascript
const getProductBySlug = async (slug) => {
  const response = await fetch(
    `${API_BASE_URL}/api/products/slug/${slug}`,
    { method: 'GET', ...config }
  );
  const data = await response.json();

  if (data.success) {
    // Each product now includes:
    // - images[] where each image has { publicUrl, alt, sortOrder, isPrimary, ... }
    // - variants[] for SKU-based options
    // - legacyVariantAttributes[] for older attribute pairs (name/value)
    return data.data;
  }

  throw new Error(data.message);
};
```

### Upload Product Images (Admin only)

Cloudinary uploads happen server-side via `POST /api/products/:productId/images/upload`. Send one request per image.

```javascript
const uploadProductImage = async ({ token, productId, file, isPrimary = false, alt, sortOrder }) => {
  const form = new FormData();
  form.append('file', file); // File object from <input type="file">

  if (isPrimary) form.append('isPrimary', 'true');
  if (alt) form.append('alt', alt);
  if (typeof sortOrder === 'number') form.append('sort_order', String(sortOrder));

  const response = await fetch(`${API_BASE_URL}/api/products/${productId}/images/upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: form
  });

  const payload = await response.json();
  if (!payload.success) {
    throw new Error(payload.message);
  }

  return payload.data; // Contains publicUrl, cloudinaryPublicId, isPrimary, etc.
};

// Example: upload hero + gallery images
const uploadGallery = async ({ token, productId, files }) => {
  let index = 0;
  for (const file of files) {
    await uploadProductImage({
      token,
      productId,
      file,
      isPrimary: index === 0, // mark first upload as primary
      sortOrder: index,
      alt: file.name.replace(/\.[^.]+$/, '')
    });
    index += 1;
  }
};
```

### Manage Product Variants (Admin only)

Variants expose SKU-level CRUD endpoints. Use them to manage options like size, colour, etc.

```javascript
const createVariant = async ({ token, productId, payload }) => {
  const response = await fetch(`${API_BASE_URL}/api/products/${productId}/variants`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  if (!data.success) {
    throw new Error(data.message);
  }
  return data.data;
};

const listVariants = async ({ token, productId, filters = {} }) => {
  const params = new URLSearchParams({
    limit: String(filters.limit || 20),
    ...(filters.cursor && { cursor: filters.cursor }),
    ...(filters.sku && { sku: filters.sku }),
    ...(filters.status && { status: filters.status })
  });

  const response = await fetch(
    `${API_BASE_URL}/api/products/${productId}/variants?${params.toString()}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  return response.json();
};

const updateVariant = async ({ token, productId, variantId, payload }) => {
  const response = await fetch(
    `${API_BASE_URL}/api/products/${productId}/variants/${variantId}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    }
  );
  return response.json();
};

const deleteVariant = async ({ token, productId, variantId }) => {
  const response = await fetch(
    `${API_BASE_URL}/api/products/${productId}/variants/${variantId}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );
  return response.json();
};
```

### Working with Product Images in the UI

- Always render `image.publicUrl` for the display URL. The legacy `imageUrl` remains for backward compatibility but `publicUrl` already points at the secure Cloudinary asset (or falls back to the legacy URL).
- `alt` and `sortOrder` are optional helpers for accessibility and gallery ordering.
- To reorder a gallery item, call `PATCH /api/products/:productId/images/:imageId` with a new `sort_order`.
- To toggle the hero image, call the same endpoint with `{ "isPrimary": true }`—the backend clears other primaries automatically.

## Order Processing

### Create Order

```javascript
const createOrder = async (orderData) => {
  const response = await fetch(`${API_BASE_URL}/api/orders`, {
    method: 'POST',
    ...config,
    body: JSON.stringify({
      sessionId: orderData.sessionId,
      customerEmail: orderData.email,
      customerPhone: orderData.phone,
      shippingAddress: orderData.address,
      items: orderData.items.map(item => ({
        productId: item.id,
        quantity: item.quantity
      })),
      paymentDetails: {
        gateway: 'placeholder',
        transactionRef: 'TXN' + Date.now()
      }
    })
  });

  return response.json();
};
```

## Subscription Flow

### Get Subscription Plans

```javascript
const getSubscriptionPlans = async (frequency) => {
  const params = frequency ? `?frequency=${frequency}` : '';
  const response = await fetch(
    `${API_BASE_URL}/api/subscriptions/plans${params}`,
    { method: 'GET', ...config }
  );
  return response.json();
};
```

### Create Subscription

```javascript
const createSubscription = async (subscriptionData) => {
  const response = await fetch(`${API_BASE_URL}/api/subscriptions`, {
    method: 'POST',
    ...config,
    body: JSON.stringify({
      planId: subscriptionData.planId,
      sessionId: subscriptionData.sessionId,
      customerEmail: subscriptionData.email,
      customerPhone: subscriptionData.phone,
      giftFor: subscriptionData.giftFor, // optional
      deliveryAddress: subscriptionData.address,
      startDate: subscriptionData.startDate
    })
  });

  return response.json();
};
```

## Categories

### Get All Categories

```javascript
const getCategories = async () => {
  const response = await fetch(`${API_BASE_URL}/api/categories`, {
    method: 'GET',
    ...config
  });
  return response.json();
};
```

## Reviews

### Get Product Reviews

```javascript
const getProductReviews = async (productId) => {
  const response = await fetch(
    `${API_BASE_URL}/api/reviews/product/${productId}?approved=true`,
    { method: 'GET', ...config }
  );
  return response.json();
};
```

## Error Handling

```javascript
const handleApiError = (error, data) => {
  if (!error.ok) {
    switch (error.status) {
      case 400:
        return { error: 'Invalid request', details: data.message };
      case 401:
        return { error: 'Unauthorized', details: 'Please login' };
      case 403:
        return { error: 'Forbidden', details: 'Insufficient permissions' };
      case 404:
        return { error: 'Not found', details: data.message };
      case 500:
        return { error: 'Server error', details: 'Please try again later' };
      default:
        return { error: 'Unknown error', details: data.message };
    }
  }
};

// Usage
const fetchWithErrorHandling = async (url, options) => {
  try {
    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) {
      throw handleApiError(response, data);
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};
```

## React Example - Custom Hook

```javascript
import { useState, useEffect } from 'react';

const useProducts = (filters) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await getProducts(filters);

        if (response.success) {
          setProducts(response.data.products);
          setPagination(response.data.pagination);
        } else {
          setError(response.message);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [filters]);

  return { products, loading, error, pagination };
};

// Usage in component
const ProductList = () => {
  const { products, loading, error } = useProducts({
    page: 1,
    limit: 12,
    sort: 'rating'
  });

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {products.map(product => (
        <ProductCard key={product._id} product={product} />
      ))}
    </div>
  );
};
```

## State Management Example (Redux Toolkit)

```javascript
// productsSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export const fetchProducts = createAsyncThunk(
  'products/fetchProducts',
  async (filters) => {
    const response = await getProducts(filters);
    return response.data;
  }
);

const productsSlice = createSlice({
  name: 'products',
  initialState: {
    items: [],
    loading: false,
    error: null,
    pagination: {}
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.products;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  }
});

export default productsSlice.reducer;
```

## TypeScript Types

```typescript
// types.ts
export interface Product {
  _id: string;
  categoryId: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  discountPercent: number;
  discountedPrice: number;
  quantity: number;
  rating: number;
  totalRatings: number;
  productType: 'coffee' | 'drink' | 'sandwich' | 'dessert' | 'flower' | 'book';
  keywords?: string;
  features?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  sessionId: string;
  customerEmail: string;
  customerPhone?: string;
  shippingAddress: string;
  items: OrderItem[];
  paymentDetails?: {
    gateway: string;
    transactionRef: string;
  };
}

export interface OrderItem {
  productId: string;
  quantity: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: any[];
}
```

## Important Notes

1. **CORS**: Make sure your backend `CORS_ORIGIN` includes your frontend URL
2. **Cookies**: Use `credentials: 'include'` for session management
3. **Security**: Never store sensitive data in localStorage
4. **Tokens**: Store JWT tokens in sessionStorage or secure HTTP-only cookies
5. **Error Handling**: Always handle API errors gracefully
6. **Loading States**: Show loading indicators for better UX
7. **Validation**: Validate inputs on frontend before sending to API

## Testing with Postman/Insomnia

1. Import the OpenAPI spec from: `http://localhost:5000/api-docs.json`
2. Or manually test endpoints using the examples above

## Common Pitfalls

❌ **Don't** expose JWT tokens in URLs or localStorage
✅ **Do** use HTTP-only cookies or sessionStorage

❌ **Don't** forget to include `credentials: 'include'`
✅ **Do** configure CORS and credentials properly

❌ **Don't** send passwords in GET requests
✅ **Do** use POST with proper body encoding

❌ **Don't** ignore error responses
✅ **Do** implement comprehensive error handling

## Performance Tips

1. **Cache static data** (categories, subscription plans)
2. **Debounce search** inputs
3. **Implement pagination** for large lists
4. **Use lazy loading** for images
5. **Optimize bundle size** by code splitting

## Support

- Full API Documentation: http://localhost:5000/api-docs
- Detailed Guide: See `API_DOCUMENTATION.md`
- Setup Instructions: See `SETUP_GUIDE.md`

---

**Ready to build an amazing frontend!** 🎨
