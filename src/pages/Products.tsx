import { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Table } from '../components/ui/Table';
import { Modal } from '../components/ui/Modal';
import { api } from '../services/api';
import { toast } from '../utils/toast';
import { Plus, Search, Edit, Trash2, Image as ImageIcon, Layers } from 'lucide-react';
import { ProductImageManager } from '../components/products/ProductImageManager';
import { ProductVariantManager } from '../components/products/ProductVariantManager';
import type { Product, Category } from '../types';

type ProductFormState = {
  categoryId: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  discountPercent: number;
  quantity: number;
  productType: string;
  keywords: string;
  features: string;
};

export function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [managingImagesProduct, setManagingImagesProduct] = useState<Product | null>(null);
  const [managingVariantsProduct, setManagingVariantsProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<ProductFormState>({
    categoryId: '',
    name: '',
    slug: '',
    description: '',
    price: 0,
    discountPercent: 0,
    quantity: 0,
    productType: 'coffee',
    keywords: '',
    features: '',
  });

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [page, search]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await api.getProducts({ page, limit: 10, search: search.trim() || undefined });
      if (response.success) {
        const data = response.data;
        setProducts(data?.products ?? []);
        setTotalPages(data?.pagination?.totalPages ?? 1);
      }
    } catch (error: any) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.getCategories();
      if (response.success) {
        setCategories(response.data ?? []);
      }
    } catch (error) {
      console.error('Failed to load categories');
    }
  };

  const handleSubmit = async () => {
    const keywords = formData.keywords
      .split(',')
      .map((keyword) => keyword.trim())
      .filter(Boolean);

    const features = formData.features
      .split(',')
      .map((feature) => feature.trim())
      .filter(Boolean);

    const payload = {
      categoryId: formData.categoryId || null,
      name: formData.name.trim(),
      slug: formData.slug.trim(),
      description: formData.description.trim() || undefined,
      price: Number.isFinite(formData.price) ? formData.price : 0,
      discountPercent: Number.isFinite(formData.discountPercent)
        ? formData.discountPercent
        : 0,
      quantity: Number.isFinite(formData.quantity) ? formData.quantity : 0,
      productType: formData.productType,
      keywords: Array.isArray(keywords)
        ? keywords.join(', ')
        : (keywords as string) ?? '',
      features: Array.isArray(features)
        ? features.join(', ')
        : (features as string) ?? '',
    };

    try {
      if (editingProduct) {
        const productId = editingProduct.id ?? editingProduct._id;
        if (!productId) {
          toast.error('Unable to determine product identifier');
          return;
        }
        await api.updateProduct(productId, payload);
        toast.success('Product updated successfully');
      } else {
        await api.createProduct(payload);
        toast.success('Product created successfully');
      }
      setShowModal(false);
      resetForm();
      fetchProducts();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save product');
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      categoryId: product.categoryId ?? '',
      name: product.name,
      slug: product.slug,
      description: product.description ?? '',
      price: product.price ?? 0,
      discountPercent: product.discountPercent ?? 0,
      quantity: product.quantity ?? 0,
      productType: product.productType ?? 'coffee',
      keywords: Array.isArray(product.keywords)
        ? product.keywords.join(', ')
        : (product.keywords as string) ?? '',
      features: Array.isArray(product.features)
        ? product.features.join(', ')
        : (product.features as string) ?? '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      await api.deleteProduct(id);
      toast.success('Product deleted successfully');
      fetchProducts();
    } catch (error: any) {
      toast.error('Failed to delete product');
    }
  };

  const resetForm = () => {
    setEditingProduct(null);
    setFormData({
      categoryId: '',
      name: '',
      slug: '',
      description: '',
      price: 0,
      discountPercent: 0,
      quantity: 0,
      productType: 'coffee',
      keywords: '',
      features: '',
    });
  };

  const handleManageImages = (product: Product) => {
    setManagingImagesProduct(product);
  };

  const handleManageVariants = (product: Product) => {
    setManagingVariantsProduct(product);
  };

  const columns = [
    {
      header: 'Name',
      accessor: (row: Product) => (
        <div>
          <p className="font-medium">{row.name}</p>
          <p className="text-xs text-[#775596]">{row.productType}</p>
        </div>
      ),
    },
    {
      header: 'Price',
      accessor: (row: Product) =>
        typeof row.price === 'number' ? `$${row.price.toFixed(2)}` : 'N/A',
    },
    {
      header: 'Discount',
      accessor: (row: Product) =>
        typeof row.discountPercent === 'number' ? `${row.discountPercent}%` : 'N/A',
    },
    {
      header: 'Stock',
      accessor: (row: Product) => {
        const quantity = row.quantity ?? 0;
        const badgeClass =
          quantity < 10
            ? 'bg-red-100 text-red-700'
            : quantity < 50
            ? 'bg-yellow-100 text-yellow-700'
            : 'bg-green-100 text-green-700';

        return (
          <span className={`px-2 py-1 rounded-full text-xs ${badgeClass}`}>{quantity}</span>
        );
      },
    },
    {
      header: 'Rating',
      accessor: (row: Product) =>
        typeof row.rating === 'number'
          ? `${row.rating.toFixed(1)} (${row.totalRatings ?? 0})`
          : 'N/A',
    },
    {
      header: 'Actions',
      accessor: (row: Product) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleManageImages(row)}
            title="Manage Images"
          >
            <ImageIcon size={16} />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleManageVariants(row)}
            title="Manage Variants"
          >
            <Layers size={16} />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => handleEdit(row)}>
            <Edit size={16} />
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => {
              const productId = row.id ?? row._id;
              if (productId) {
                handleDelete(productId);
              } else {
                toast.error('Unable to determine product identifier');
              }
            }}
          >
            <Trash2 size={16} />
          </Button>
        </div>
      ),
    },
  ];

  const managedImageProductId = managingImagesProduct?.id ?? managingImagesProduct?._id ?? null;
  const managedVariantProductId = managingVariantsProduct?.id ?? managingVariantsProduct?._id ?? null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#1E2934BA] mb-2">Products</h1>
          <p className="text-[#775596]">Manage your café products</p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
        >
          <Plus size={20} className="mr-2" />
          Add Product
        </Button>
      </div>

      <Card>
        <div className="mb-6 flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#775596]" size={20} />
            <Input
              placeholder="Search products..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-10"
            />
          </div>
        </div>

        <Table data={products} columns={columns} loading={loading} emptyMessage="No products found" />

        {totalPages > 1 && (
          <div className="mt-6 flex justify-center gap-2">
            <Button
              variant="ghost"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
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
        title={editingProduct ? 'Edit Product' : 'Add New Product'}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Product Name"
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#1E2934BA] mb-1">
                Category
              </label>
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="w-full px-4 py-2 border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9268AF]"
                required
              >
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat.id ?? cat._id ?? cat.name} value={cat.id ?? cat._id ?? ''}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1E2934BA] mb-1">
                Product Type
              </label>
              <select
                value={formData.productType}
                onChange={(e) => setFormData({ ...formData, productType: e.target.value })}
                className="w-full px-4 py-2 border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9268AF]"
                required
              >
                <option value="coffee">Coffee</option>
                <option value="drink">Drink</option>
                <option value="sandwich">Sandwich</option>
                <option value="dessert">Dessert</option>
                <option value="flower">Flower</option>
                <option value="book">Book</option>
              </select>
            </div>
          </div>

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

          <div className="grid grid-cols-3 gap-4">
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
              label="Discount %"
              type="number"
              value={formData.discountPercent}
              onChange={(e) => {
                const value = parseInt(e.target.value, 10);
                setFormData({
                  ...formData,
                  discountPercent: Number.isNaN(value) ? 0 : value,
                });
              }}
            />
            <Input
              label="Stock Quantity"
              type="number"
              value={formData.quantity}
              onChange={(e) => {
                const value = parseInt(e.target.value, 10);
                setFormData({ ...formData, quantity: Number.isNaN(value) ? 0 : value });
              }}
              required
            />
          </div>

          <Input
            label="Keywords (comma-separated)"
            value={formData.keywords}
            onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
          />

          <Input
            label="Features (comma-separated)"
            value={formData.features}
            onChange={(e) => setFormData({ ...formData, features: e.target.value })}
          />

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
              {editingProduct ? 'Update' : 'Create'} Product
            </Button>
          </div>
        </div>
      </Modal>

      {managingImagesProduct && managedImageProductId && (
        <Modal
          isOpen={!!managingImagesProduct}
          onClose={() => setManagingImagesProduct(null)}
          title={`Manage Images - ${managingImagesProduct.name}`}
          size="xl"
        >
          <ProductImageManager productId={managedImageProductId} />
        </Modal>
      )}

      {managingVariantsProduct && managedVariantProductId && (
        <Modal
          isOpen={!!managingVariantsProduct}
          onClose={() => setManagingVariantsProduct(null)}
          title={`Manage Variants - ${managingVariantsProduct.name}`}
          size="lg"
        >
          <ProductVariantManager productId={managedVariantProductId} />
        </Modal>
      )}
    </div>
  );
}
