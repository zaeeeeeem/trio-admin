import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingCart,
  Star,
  Calendar,
  Users,
  Settings,
  Coffee,
} from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/products', icon: Package, label: 'Products' },
  { to: '/categories', icon: FolderTree, label: 'Categories' },
  { to: '/orders', icon: ShoppingCart, label: 'Orders' },
  { to: '/reviews', icon: Star, label: 'Reviews' },
  { to: '/subscriptions', icon: Calendar, label: 'Subscriptions' },
  { to: '/admins', icon: Users, label: 'Admins' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export function Sidebar() {
  return (
    <aside className="w-64 bg-white border-r border-[#F2DFFF] h-screen sticky top-0 flex flex-col">
      <div className="p-6 border-b border-[#F2DFFF]">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-[#9268AF] to-[#775596] p-2 rounded-lg">
            <Coffee size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#1E2934BA]">Trio Café</h1>
            <p className="text-xs text-[#775596]">by Maham</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-[#9268AF] to-[#775596] text-white shadow-md'
                      : 'text-[#1E2934BA] hover:bg-[#F2DFFF]'
                  }`
                }
              >
                <item.icon size={20} />
                <span className="font-medium">{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t border-[#F2DFFF]">
        <div className="text-xs text-[#1E2934BA] opacity-60 text-center">
          Admin Panel v1.0.0
        </div>
      </div>
    </aside>
  );
}
