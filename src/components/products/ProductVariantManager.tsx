import { useEffect, useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { Table } from '../ui/Table';
import { api } from '../../services/api';
import { toast } from '../../utils/toast';
import { Plus, Edit, Trash2 } from 'lucide-react';
import type { ProductVariant, VariantAttribute, VariantStatus } from '../../types';

interface ProductVariantManagerProps {
  productId: string;
}

type VariantFormState = {
  sku: string;
  price: number;
  stock: number;
  status: VariantStatus;
  attributes: VariantAttribute[];
  attributeName: string;
  attributeValue: string;
};

const defaultFormState: VariantFormState = {
  sku: '',
  price: 0,
  stock: 0,
  status: 'active',
  attributes: [],
  attributeName: '',
  attributeValue: '',
};

const statusOptions: VariantStatus[] = ['draft', 'active', 'archived'];

export function ProductVariantManager({ productId }: ProductVariantManagerProps) {
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null);
  const [formData, setFormData] = useState<VariantFormState>(defaultFormState);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchVariants();
  }, [productId]);

  const fetchVariants = async () => {
    try {
      setLoading(true);
      const response = await api.getProductVariants(productId, { limit: 50 });
      if (response.success) {
        setVariants(response.data?.items ?? []);
      }
    } catch (error) {
      toast.error('Failed to load variants');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData(defaultFormState);
    setEditingVariant(null);
    setSubmitting(false);
  };

  const handleAddAttribute = () => {
    if (!formData.attributeName.trim() || !formData.attributeValue.trim()) {
      toast.error('Provide both attribute name and value');
      return;
    }

    setFormData((prev) => ({
      ...prev,
      attributes: [
        ...prev.attributes,
        {
          name: prev.attributeName.trim(),
          value: prev.attributeValue.trim(),
        },
      ],
      attributeName: '',
      attributeValue: '',
    }));
  };

  const handleRemoveAttribute = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      attributes: prev.attributes.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async () => {
    if (!formData.sku.trim()) {
      toast.error('SKU is required');
      return;
    }

    setSubmitting(true);

    const attributes = formData.attributes.filter((attribute) => attribute.name && attribute.value);

    const payload = {
      sku: formData.sku.trim(),
      price: Number.isFinite(formData.price) ? formData.price : 0,
      stock: Number.isFinite(formData.stock) ? formData.stock : 0,
      status: formData.status,
      attributes,
    };

    try {
      if (editingVariant) {
        await api.updateProductVariant(productId, editingVariant._id, payload);
        toast.success('Variant updated successfully');
      } else {
        await api.createProductVariant(productId, payload);
        toast.success('Variant created successfully');
      }
      setShowModal(false);
      resetForm();
      fetchVariants();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save variant');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (variant: ProductVariant) => {
    if (!confirm('Are you sure you want to delete this variant?')) return;

    try {
      await api.deleteProductVariant(productId, variant._id);
      toast.success('Variant deleted successfully');
      fetchVariants();
    } catch (error: any) {
      toast.error('Failed to delete variant');
    }
  };

  const handleEdit = (variant: ProductVariant) => {
    setEditingVariant(variant);
    setFormData({
      sku: variant.sku,
      price: variant.price,
      stock: variant.stock,
      status: variant.status,
      attributes: variant.attributes ?? [],
      attributeName: '',
      attributeValue: '',
    });
    setShowModal(true);
  };

  const columns = [
    { header: 'SKU', accessor: 'sku' as keyof ProductVariant },
    {
      header: 'Price',
      accessor: (row: ProductVariant) => `$${row.price.toFixed(2)}`,
    },
    { header: 'Stock', accessor: (row: ProductVariant) => row.stock },
    {
      header: 'Status',
      accessor: (row: ProductVariant) => (
        <span
          className={`px-2 py-1 rounded-full text-xs ${
            row.status === 'active'
              ? 'bg-green-100 text-green-700'
              : row.status === 'draft'
              ? 'bg-yellow-100 text-yellow-700'
              : 'bg-gray-100 text-gray-700'
          }`}
        >
          {row.status}
        </span>
      ),
    },
    {
      header: 'Attributes',
      accessor: (row: ProductVariant) => (
        <div className="flex flex-wrap gap-2">
          {(row.attributes ?? []).length === 0 && (
            <span className="text-xs text-[#775596]">None</span>
          )}
          {(row.attributes ?? []).map((attribute, index) => (
            <span
              key={`${attribute.name}-${attribute.value}-${index}`}
              className="px-2 py-1 bg-[#F2DFFF] text-[#775596] rounded-full text-xs"
            >
              {attribute.name}: {attribute.value}
            </span>
          ))}
        </div>
      ),
    },
    {
      header: 'Actions',
      accessor: (row: ProductVariant) => (
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={() => handleEdit(row)}>
            <Edit size={16} />
          </Button>
          <Button size="sm" variant="danger" onClick={() => handleDelete(row)}>
            <Trash2 size={16} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-4 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-[#1E2934BA]">Product Variants</h3>
          <p className="text-sm text-[#775596]">Manage SKU-level pricing and inventory.</p>
        </div>
        <Button
          size="sm"
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
        >
          <Plus size={16} className="mr-2" />
          Add Variant
        </Button>
      </div>

      <Table
        data={variants}
        columns={columns}
        loading={loading}
        emptyMessage="No variants yet"
      />

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          resetForm();
        }}
        title={editingVariant ? 'Edit Variant' : 'Add New Variant'}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="SKU"
              placeholder="e.g., HOUSE-BLEND-250G"
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              required
            />
            <Input
              label="Price"
              type="number"
              step="0.01"
              value={formData.price}
              onChange={(e) => {
                const value = parseFloat(e.target.value);
                setFormData({ ...formData, price: Number.isNaN(value) ? 0 : value });
              }}
              required
            />
            <Input
              label="Stock"
              type="number"
              value={formData.stock}
              onChange={(e) => {
                const value = parseInt(e.target.value, 10);
                setFormData({ ...formData, stock: Number.isNaN(value) ? 0 : value });
              }}
              required
            />
            <div>
              <label className="block text-sm font-medium text-[#1E2934BA] mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value as VariantStatus })
                }
                className="w-full px-4 py-2 border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9268AF]"
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium text-[#1E2934BA]">Variant Attributes</p>
            {formData.attributes.length === 0 && (
              <p className="text-xs text-[#775596]">
                Add descriptive attributes like Size, Roast, or Flavor to help customers choose the right option.
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              {formData.attributes.map((attribute, index) => (
                <span
                  key={`${attribute.name}-${attribute.value}-${index}`}
                  className="px-2 py-1 bg-[#F2DFFF] text-[#775596] rounded-full text-xs flex items-center gap-2"
                >
                  {attribute.name}: {attribute.value}
                  <button
                    type="button"
                    className="text-[#9268AF] hover:text-[#775596]"
                    onClick={() => handleRemoveAttribute(index)}
                    aria-label="Remove attribute"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
              <Input
                label="Attribute Name"
                placeholder="e.g., Size"
                value={formData.attributeName}
                onChange={(e) => setFormData({ ...formData, attributeName: e.target.value })}
              />
              <Input
                label="Attribute Value"
                placeholder="e.g., Medium"
                value={formData.attributeValue}
                onChange={(e) => setFormData({ ...formData, attributeValue: e.target.value })}
              />
              <Button variant="secondary" onClick={handleAddAttribute}>
                <Plus size={16} className="mr-2" />
                Add Attribute
              </Button>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[#F2DFFF]">
            <Button
              variant="ghost"
              onClick={() => {
                setShowModal(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} loading={submitting}>
              {editingVariant ? 'Update Variant' : 'Create Variant'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
