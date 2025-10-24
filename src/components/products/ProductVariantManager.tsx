import { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { Table } from '../ui/Table';
import { api } from '../../services/api';
import { toast } from '../../utils/toast';
import { Plus, Edit, Trash2, Layers } from 'lucide-react';

interface ProductVariant {
  id: string;
  productId: string;
  attributeName: string;
  attributeValue: string;
}

interface ProductVariantManagerProps {
  productId: string;
  onClose: () => void;
}

export function ProductVariantManager({ productId, onClose }: ProductVariantManagerProps) {
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null);
  const [formData, setFormData] = useState({ attributeName: '', attributeValue: '' });
  const [bulkVariants, setBulkVariants] = useState([
    { attributeName: '', attributeValue: '' },
  ]);

  useEffect(() => {
    fetchVariants();
  }, [productId]);

  const fetchVariants = async () => {
    try {
      setLoading(true);
      const response = await api.getProductVariants(productId);
      if (response.success) {
        setVariants(response.data || []);
      }
    } catch (error) {
      toast.error('Failed to load variants');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.attributeName || !formData.attributeValue) {
      toast.error('Please fill all fields');
      return;
    }

    try {
      if (editingVariant) {
        await api.updateProductVariant(productId, editingVariant.id, formData);
        toast.success('Variant updated successfully');
      } else {
        await api.createProductVariant(productId, formData);
        toast.success('Variant created successfully');
      }
      setShowModal(false);
      resetForm();
      fetchVariants();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save variant');
    }
  };

  const handleBulkCreate = async () => {
    const validVariants = bulkVariants.filter(
      (v) => v.attributeName && v.attributeValue
    );

    if (validVariants.length === 0) {
      toast.error('Please add at least one variant');
      return;
    }

    try {
      await api.bulkCreateProductVariants(productId, { variants: validVariants });
      toast.success(`${validVariants.length} variants created successfully`);
      setShowBulkModal(false);
      setBulkVariants([{ attributeName: '', attributeValue: '' }]);
      fetchVariants();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create variants');
    }
  };

  const handleDelete = async (variantId: string) => {
    if (!confirm('Are you sure you want to delete this variant?')) return;

    try {
      await api.deleteProductVariant(productId, variantId);
      toast.success('Variant deleted successfully');
      fetchVariants();
    } catch (error) {
      toast.error('Failed to delete variant');
    }
  };

  const handleEdit = (variant: ProductVariant) => {
    setEditingVariant(variant);
    setFormData({
      attributeName: variant.attributeName,
      attributeValue: variant.attributeValue,
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingVariant(null);
    setFormData({ attributeName: '', attributeValue: '' });
  };

  const addBulkVariantRow = () => {
    setBulkVariants([...bulkVariants, { attributeName: '', attributeValue: '' }]);
  };

  const removeBulkVariantRow = (index: number) => {
    setBulkVariants(bulkVariants.filter((_, i) => i !== index));
  };

  const updateBulkVariant = (index: number, field: string, value: string) => {
    const updated = [...bulkVariants];
    updated[index] = { ...updated[index], [field]: value };
    setBulkVariants(updated);
  };

  const columns = [
    { header: 'Attribute Name', accessor: 'attributeName' as keyof ProductVariant },
    { header: 'Attribute Value', accessor: 'attributeValue' as keyof ProductVariant },
    {
      header: 'Actions',
      accessor: (row: ProductVariant) => (
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={() => handleEdit(row)}>
            <Edit size={16} />
          </Button>
          <Button size="sm" variant="danger" onClick={() => handleDelete(row.id)}>
            <Trash2 size={16} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-4 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-[#1E2934BA]">Product Variants</h3>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={() => setShowBulkModal(true)}>
            <Layers size={16} className="mr-2" />
            Bulk Add
          </Button>
          <Button size="sm" onClick={() => setShowModal(true)}>
            <Plus size={16} className="mr-2" />
            Add Variant
          </Button>
        </div>
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
      >
        <div className="space-y-4">
          <Input
            label="Attribute Name"
            placeholder="e.g., Size, Color, Flavor"
            value={formData.attributeName}
            onChange={(e) => setFormData({ ...formData, attributeName: e.target.value })}
            required
          />
          <Input
            label="Attribute Value"
            placeholder="e.g., Medium, Red, Vanilla"
            value={formData.attributeValue}
            onChange={(e) => setFormData({ ...formData, attributeValue: e.target.value })}
            required
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => { setShowModal(false); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {editingVariant ? 'Update' : 'Create'} Variant
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showBulkModal}
        onClose={() => {
          setShowBulkModal(false);
          setBulkVariants([{ attributeName: '', attributeValue: '' }]);
        }}
        title="Bulk Add Variants"
        size="lg"
      >
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-blue-800">
              Add multiple variants at once. Perfect for adding sizes, colors, or other variations.
            </p>
          </div>
          {bulkVariants.map((variant, index) => (
            <div key={index} className="flex gap-3 items-end">
              <Input
                label={index === 0 ? 'Attribute Name' : ''}
                placeholder="e.g., Size"
                value={variant.attributeName}
                onChange={(e) => updateBulkVariant(index, 'attributeName', e.target.value)}
              />
              <Input
                label={index === 0 ? 'Attribute Value' : ''}
                placeholder="e.g., Small"
                value={variant.attributeValue}
                onChange={(e) => updateBulkVariant(index, 'attributeValue', e.target.value)}
              />
              {bulkVariants.length > 1 && (
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => removeBulkVariantRow(index)}
                >
                  <Trash2 size={16} />
                </Button>
              )}
            </div>
          ))}
          <Button variant="secondary" onClick={addBulkVariantRow} className="w-full">
            <Plus size={16} className="mr-2" />
            Add Another Variant
          </Button>
          <div className="flex justify-end gap-3 pt-4 border-t border-[#F2DFFF]">
            <Button
              variant="ghost"
              onClick={() => {
                setShowBulkModal(false);
                setBulkVariants([{ attributeName: '', attributeValue: '' }]);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleBulkCreate}>
              Create {bulkVariants.filter(v => v.attributeName && v.attributeValue).length} Variants
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
