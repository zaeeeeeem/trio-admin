import { LogOut, Menu, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useState } from 'react';

interface TopbarProps {
  onMenuClick?: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const { admin, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <header className="bg-white border-b border-[#F2DFFF] px-6 py-4 sticky top-0 z-40">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 hover:bg-[#F2DFFF] rounded-lg transition-colors"
          >
            <Menu size={24} className="text-[#1E2934BA]" />
          </button>
          <h2 className="text-xl font-semibold text-[#1E2934BA]">
            Welcome back, {admin?.name || 'Admin'}
          </h2>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-[#F2DFFF] transition-colors"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-[#9268AF] to-[#775596] rounded-full flex items-center justify-center">
              <User size={20} className="text-white" />
            </div>
            <div className="text-left hidden md:block">
              <p className="text-sm font-medium text-[#1E2934BA]">{admin?.name}</p>
              <p className="text-xs text-[#775596]">{admin?.role}</p>
            </div>
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-[#F2DFFF] py-2">
              <button
                onClick={() => {
                  setShowDropdown(false);
                  logout();
                }}
                className="w-full flex items-center gap-2 px-4 py-2 text-left text-sm text-[#1E2934BA] hover:bg-[#F2DFFF] transition-colors"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
