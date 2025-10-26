import { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Table } from '../components/ui/Table';
import { Modal } from '../components/ui/Modal';
import { api } from '../services/api';
import { toast } from '../utils/toast';
import { Plus, Edit, Trash2, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import type { Admin } from '../types';

export function Admins() {
  const { admin: currentAdmin } = useAuth();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'admin',
  });

  const isSuperAdmin = currentAdmin?.role === 'super_admin';

  useEffect(() => {
    if (isSuperAdmin) {
      fetchAdmins();
    }
  }, [page, isSuperAdmin]);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const response = await api.getAdmins(page, 10);
      if (response.success) {
        setAdmins(response.data?.admins ?? []);
        setTotalPages(response.data?.pagination?.totalPages ?? 1);
      }
    } catch (error) {
      toast.error('Failed to load admins');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      if (editingAdmin) {
        const updateData: any = {
          name: formData.name,
          email: formData.email,
          role: formData.role,
        };
        if (formData.password) {
          updateData.password = formData.password;
        }
        const adminId = editingAdmin.id ?? editingAdmin._id;
        if (!adminId) {
          toast.error('Unable to determine admin identifier');
          return;
        }
        await api.updateAdmin(adminId, updateData);
        toast.success('Admin updated successfully');
      } else {
      await api.createAdmin(formData);
        toast.success('Admin created successfully');
      }
      setShowModal(false);
      resetForm();
      fetchAdmins();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save admin');
    }
  };

  const handleEdit = (admin: Admin) => {
    setEditingAdmin(admin);
    setFormData({
      name: admin.name,
      email: admin.email,
      password: '',
      role: admin.role,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this admin?')) return;

    try {
      await api.deleteAdmin(id);
      toast.success('Admin deleted successfully');
      fetchAdmins();
    } catch (error) {
      toast.error('Failed to delete admin');
    }
  };

  const resetForm = () => {
    setEditingAdmin(null);
    setFormData({ name: '', email: '', password: '', role: 'admin' });
  };

  if (!isSuperAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center max-w-md">
          <Shield size={48} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-[#1E2934BA] mb-2">Access Denied</h2>
          <p className="text-[#775596]">
            Only Super Admins can manage admin accounts.
          </p>
        </div>
      </div>
    );
  }

  const columns = [
    { header: 'Name', accessor: 'name' as keyof Admin },
    { header: 'Email', accessor: 'email' as keyof Admin },
    {
      header: 'Role',
      accessor: (row: Admin) => (
        <span
          className={`px-2 py-1 rounded-full text-xs ${
            row.role === 'super_admin'
              ? 'bg-purple-100 text-purple-700'
              : 'bg-blue-100 text-blue-700'
          }`}
        >
          {row.role === 'super_admin' ? 'Super Admin' : 'Admin'}
        </span>
      ),
    },
    {
      header: 'Created',
      accessor: (row: Admin) => new Date(row.createdAt).toLocaleDateString(),
    },
    {
      header: 'Actions',
      accessor: (row: Admin) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleEdit(row)}
            disabled={(row.id ?? row._id) === (currentAdmin?.id ?? currentAdmin?._id)}
          >
            <Edit size={16} />
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => {
              const adminId = row.id ?? row._id;
              if (adminId) {
                handleDelete(adminId);
              } else {
                toast.error('Unable to determine admin identifier');
              }
            }}
            disabled={(row.id ?? row._id) === (currentAdmin?.id ?? currentAdmin?._id)}
          >
            <Trash2 size={16} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#1E2934BA] mb-2">Admin Management</h1>
          <p className="text-[#775596]">Manage administrator accounts</p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
        >
          <Plus size={20} className="mr-2" />
          Add Admin
        </Button>
      </div>

      <Card>
        <Table data={admins} columns={columns} loading={loading} emptyMessage="No admins found" />

        {totalPages > 1 && (
          <div className="mt-6 flex justify-center gap-2">
            <Button variant="ghost" disabled={page === 1} onClick={() => setPage(page - 1)}>
              Previous
            </Button>
            <span className="px-4 py-2 text-[#1E2934BA]">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="ghost"
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </Card>

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          resetForm();
        }}
        title={editingAdmin ? 'Edit Admin' : 'Add New Admin'}
      >
        <div className="space-y-4">
          <Input
            label="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />

          <Input
            label={editingAdmin ? 'Password (leave blank to keep current)' : 'Password'}
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required={!editingAdmin}
          />

          <div>
            <label className="block text-sm font-medium text-[#1E2934BA] mb-1">Role</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-4 py-2 border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9268AF]"
            >
              <option value="admin">Admin</option>
              <option value="super_admin">Super Admin</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="ghost"
              onClick={() => {
                setShowModal(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {editingAdmin ? 'Update' : 'Create'} Admin
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
