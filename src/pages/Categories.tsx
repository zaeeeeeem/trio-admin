import { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Table } from '../components/ui/Table';
import { Modal } from '../components/ui/Modal';
import { api } from '../services/api';
import { toast } from '../utils/toast';
import { Plus, Edit, Trash2 } from 'lucide-react';
import type { Category } from '../types';

export function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    parentId: '',
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await api.getCategories();
      if (response.success) {
        setCategories(response.data ?? []);
      }
    } catch (error) {
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const payload = {
        ...formData,
        parentId: formData.parentId || null,
      };

      if (editingCategory) {
        const categoryId = editingCategory.id ?? editingCategory._id;
        if (!categoryId) {
          toast.error('Unable to determine category identifier');
          return;
        }
        await api.updateCategory(categoryId, payload);
        toast.success('Category updated successfully');
      } else {
        await api.createCategory(payload);
        toast.success('Category created successfully');
      }
      setShowModal(false);
      resetForm();
      fetchCategories();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save category');
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      parentId: category.parentId || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;

    try {
      await api.deleteCategory(id);
      toast.success('Category deleted successfully');
      fetchCategories();
    } catch (error: any) {
      toast.error('Failed to delete category');
    }
  };

  const resetForm = () => {
    setEditingCategory(null);
    setFormData({ name: '', slug: '', description: '', parentId: '' });
  };

  const getParentName = (parentId?: string) => {
    if (!parentId) return 'Root';
    const parent = categories.find((c) => (c.id ?? c._id) === parentId);
    return parent?.name || 'Unknown';
  };

  const columns = [
    { header: 'Name', accessor: 'name' as keyof Category },
    { header: 'Slug', accessor: 'slug' as keyof Category },
    {
      header: 'Description',
      accessor: (row: Category) => row.description || 'N/A',
    },
    {
      header: 'Parent Category',
      accessor: (row: Category) => getParentName(row.parentId),
    },
    {
      header: 'Actions',
      accessor: (row: Category) => (
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={() => handleEdit(row)}>
            <Edit size={16} />
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => {
              const categoryId = row.id ?? row._id;
              if (categoryId) {
                handleDelete(categoryId);
              } else {
                toast.error('Unable to determine category identifier');
              }
            }}
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
          <h1 className="text-3xl font-bold text-[#1E2934BA] mb-2">Categories</h1>
          <p className="text-[#775596]">Organize your product categories</p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
        >
          <Plus size={20} className="mr-2" />
          Add Category
        </Button>
      </div>

      <Card>
        <Table
          data={categories}
          columns={columns}
          loading={loading}
          emptyMessage="No categories found"
        />
      </Card>

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          resetForm();
        }}
        title={editingCategory ? 'Edit Category' : 'Add New Category'}
      >
        <div className="space-y-4">
          <Input
            label="Category Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <Input
            label="Slug"
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
            required
          />

          <div>
            <label className="block text-sm font-medium text-[#1E2934BA] mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9268AF]"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1E2934BA] mb-1">
              Parent Category (Optional)
            </label>
            <select
              value={formData.parentId}
              onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
              className="w-full px-4 py-2 border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9268AF]"
            >
              <option value="">None (Root Category)</option>
              {categories
                .filter((c) => (c.id ?? c._id) !== (editingCategory?.id ?? editingCategory?._id))
                .map((cat) => (
                  <option key={cat.id ?? cat._id ?? cat.name} value={cat.id ?? cat._id ?? ''}>
                    {cat.name}
                  </option>
                ))}
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
              {editingCategory ? 'Update' : 'Create'} Category
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
