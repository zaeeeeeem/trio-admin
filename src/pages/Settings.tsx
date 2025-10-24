import { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { toast } from '../utils/toast';
import { User, Lock, Mail, Shield } from 'lucide-react';

export function Settings() {
  const { admin } = useAuth();
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    try {
      setLoading(true);
      await api.changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      toast.success('Password changed successfully');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#1E2934BA] mb-2">Settings</h1>
        <p className="text-[#775596]">Manage your account settings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Profile Information">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-gradient-to-br from-[#9268AF] to-[#775596] rounded-full flex items-center justify-center">
                <User size={32} className="text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#1E2934BA]">{admin?.name}</h3>
                <p className="text-[#775596]">{admin?.email}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-[#F2DFFF] bg-opacity-30 rounded-lg">
                <Mail size={20} className="text-[#775596]" />
                <div>
                  <p className="text-sm text-[#775596]">Email</p>
                  <p className="font-medium text-[#1E2934BA]">{admin?.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-[#F2DFFF] bg-opacity-30 rounded-lg">
                <Shield size={20} className="text-[#775596]" />
                <div>
                  <p className="text-sm text-[#775596]">Role</p>
                  <p className="font-medium text-[#1E2934BA] capitalize">
                    {admin?.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-[#F2DFFF] bg-opacity-30 rounded-lg">
                <User size={20} className="text-[#775596]" />
                <div>
                  <p className="text-sm text-[#775596]">Member Since</p>
                  <p className="font-medium text-[#1E2934BA]">
                    {admin?.createdAt
                      ? new Date(admin.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })
                      : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card title="Change Password">
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <Lock size={20} className="text-blue-600" />
              <p className="text-sm text-blue-800">
                Choose a strong password with at least 6 characters
              </p>
            </div>

            <Input
              label="Current Password"
              type="password"
              value={passwordForm.currentPassword}
              onChange={(e) =>
                setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
              }
              placeholder="Enter current password"
            />

            <Input
              label="New Password"
              type="password"
              value={passwordForm.newPassword}
              onChange={(e) =>
                setPasswordForm({ ...passwordForm, newPassword: e.target.value })
              }
              placeholder="Enter new password"
            />

            <Input
              label="Confirm New Password"
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(e) =>
                setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
              }
              placeholder="Confirm new password"
            />

            <Button
              onClick={handleChangePassword}
              loading={loading}
              disabled={
                !passwordForm.currentPassword ||
                !passwordForm.newPassword ||
                !passwordForm.confirmPassword
              }
              className="w-full"
            >
              Change Password
            </Button>
          </div>
        </Card>
      </div>

      <Card title="About Trio Café Admin Panel">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-[#F2DFFF] bg-opacity-30 rounded-lg text-center">
              <p className="text-sm text-[#775596] mb-1">Version</p>
              <p className="text-xl font-bold text-[#1E2934BA]">1.0.0</p>
            </div>
            <div className="p-4 bg-[#F2DFFF] bg-opacity-30 rounded-lg text-center">
              <p className="text-sm text-[#775596] mb-1">Environment</p>
              <p className="text-xl font-bold text-[#1E2934BA]">Production</p>
            </div>
            <div className="p-4 bg-[#F2DFFF] bg-opacity-30 rounded-lg text-center">
              <p className="text-sm text-[#775596] mb-1">Status</p>
              <p className="text-xl font-bold text-green-600">Active</p>
            </div>
          </div>

          <div className="p-4 bg-gradient-to-r from-[#9268AF] to-[#775596] rounded-lg text-white">
            <h4 className="font-bold mb-2">Trio by Maham Café</h4>
            <p className="text-sm opacity-90">
              A complete admin panel for managing your café's products, orders, subscriptions, and more.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
