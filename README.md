# Trio by Maham Café - Admin Panel

A fully functional, elegant Admin Panel for managing the Trio by Maham Café e-commerce platform. Built with React, TypeScript, and modern web technologies.

## Features

### Complete Management System
- **Dashboard Overview** - Real-time analytics, revenue stats, best sellers, and activity monitoring
- **Products Management** - Full CRUD operations with image support, stock control, and filtering
- **Categories Management** - Hierarchical category system with parent-child relationships
- **Orders Management** - View, filter, and update payment/delivery status
- **Reviews Management** - Approve or reject customer reviews
- **Subscriptions Management** - Manage subscription plans and active subscriptions
- **Admin Management** - Create and manage admin accounts (Super Admin only)
- **Settings/Profile** - Change password and view profile information

### Design & User Experience
- Light, modern café-inspired interface with purple-white floral theme
- Responsive design that works on mobile, tablet, and desktop
- Smooth animations and transitions
- Toast notifications for user feedback
- Loading states and error handling
- Accessible and intuitive navigation

### Technical Highlights
- **Framework**: React 18 with TypeScript
- **Routing**: React Router v6
- **State Management**: React hooks with context API
- **API Integration**: Axios with interceptors
- **Charts**: Recharts for analytics visualization
- **Styling**: Tailwind CSS with custom brand colors
- **Build Tool**: Vite for fast development

## Brand Colors

```css
Primary: #9268AF
Secondary: #775596
Accent: #DAC8ED
Text/Dark: #1E2934BA
Background: #F2DFFF
Muted Gray: #E5E5E5
```

## Getting Started

### Prerequisites
- Node.js 16+ and npm
- Backend API running at `http://localhost:5000`

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Build for production:
```bash
npm run build
```

## Project Structure

```
src/
├── components/
│   ├── layout/
│   │   ├── DashboardLayout.tsx
│   │   ├── Sidebar.tsx
│   │   └── Topbar.tsx
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   └── Table.tsx
│   └── ProtectedRoute.tsx
├── context/
│   └── AuthContext.tsx
├── pages/
│   ├── Dashboard.tsx
│   ├── Products.tsx
│   ├── Categories.tsx
│   ├── Orders.tsx
│   ├── Reviews.tsx
│   ├── Subscriptions.tsx
│   ├── Admins.tsx
│   ├── Settings.tsx
│   └── Login.tsx
├── services/
│   └── api.ts
├── types/
│   └── index.ts
├── utils/
│   └── toast.ts
├── App.tsx
└── main.tsx
```

## Authentication

The admin panel uses JWT-based authentication:

1. Admin logs in with email and password
2. JWT token is stored in sessionStorage
3. Token is automatically included in all API requests
4. Protected routes redirect to login if not authenticated

### Demo Credentials
Use the credentials from your backend `/api/auth/login` endpoint.

## API Integration

All API calls are centralized in `src/services/api.ts`:

- Automatic token injection
- Request/response interceptors
- Error handling with automatic logout on 401
- TypeScript type safety

### Example Usage

```typescript
import { api } from './services/api';

const products = await api.getProducts({ page: 1, limit: 10 });
```

## Key Features by Page

### Dashboard
- Total products, orders, subscriptions stats
- Revenue tracking
- Low stock alerts
- Best sellers chart (bar chart)
- Product distribution (pie chart)
- Recent activity feed

### Products
- Search and filter products
- Pagination support
- Create/edit/delete products
- Stock management
- Product type categorization
- Discount management

### Categories
- Hierarchical category structure
- Parent-child relationships
- Full CRUD operations

### Orders
- Filter by payment status (pending/paid/failed)
- Filter by delivery status (processing/delivered/cancelled)
- Search by customer email
- Update order status
- View order details

### Reviews
- Approve/unapprove reviews
- Delete inappropriate reviews
- View product ratings

### Subscriptions
- Manage subscription plans
- View active subscriptions
- Cancel subscriptions
- Filter by status

### Admins
- Super Admin only feature
- Create/edit/delete admin accounts
- Role management (admin/super_admin)

### Settings
- View profile information
- Change password
- System information

## Responsive Design

The admin panel is fully responsive with:

- Mobile-friendly navigation drawer
- Collapsible sidebar on tablets
- Optimized layouts for all screen sizes
- Touch-friendly controls

## Security Features

- JWT authentication with automatic token refresh
- Protected routes with authentication checks
- Session storage for tokens (not localStorage)
- CORS support with credentials
- Role-based access control

## Performance Optimizations

- Code splitting for faster initial load
- Lazy loading of images
- Debounced search inputs
- Pagination for large datasets
- Efficient re-rendering with React hooks

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### TypeScript

The project is fully typed with TypeScript for better development experience and fewer runtime errors.

## Deployment

1. Build the project:
```bash
npm run build
```

2. Deploy the `dist` folder to your hosting service

3. Ensure the backend API URL is configured correctly

## API Documentation

For detailed API documentation, refer to:
- `API_DOCUMENTATION.md` - Complete API reference
- `FRONTEND_INTEGRATION.md` - Integration guide

## Troubleshooting

### Common Issues

**Login not working:**
- Verify backend is running at `http://localhost:5000`
- Check CORS settings on backend
- Verify admin credentials

**API requests failing:**
- Check network tab for CORS errors
- Verify JWT token in sessionStorage
- Check backend API availability

**Build errors:**
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Update dependencies: `npm update`

## Contributing

This is a production-ready admin panel. For customization:

1. Update brand colors in Tailwind config and components
2. Modify API endpoints in `src/services/api.ts`
3. Add new pages following the existing structure
4. Update types in `src/types/index.ts`

## License

Proprietary - Trio by Maham Café

## Support

For support or questions, contact the development team.

---

**Version**: 1.0.0
**Last Updated**: October 2025
**Built with** React, TypeScript, and Tailwind CSS
