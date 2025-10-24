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
  const [formData, setFormData] = useState<any>({
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
      const response = await api.getProducts({ page, limit: 10, search });
      if (response.success) {
        setProducts(response.data.products || []);
        setTotalPages(response.data.pagination?.totalPages || 1);
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
        setCategories(response.data || []);
      }
    } catch (error) {
      console.error('Failed to load categories');
    }
  };

  const handleSubmit = async () => {
    try {
      if (editingProduct) {
        await api.updateProduct(editingProduct._id, formData);
        toast.success('Product updated successfully');
      } else {
        await api.createProduct(formData);
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
      categoryId: product.categoryId,
      name: product.name,
      slug: product.slug,
      description: product.description,
      price: product.price,
      discountPercent: product.discountPercent,
      quantity: product.quantity,
      productType: product.productType,
      keywords: product.keywords,
      features: product.features,
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
      accessor: (row: Product) => `$${row.price.toFixed(2)}`,
    },
    {
      header: 'Discount',
      accessor: (row: Product) => `${row.discountPercent}%`,
    },
    {
      header: 'Stock',
      accessor: (row: Product) => (
        <span
          className={`px-2 py-1 rounded-full text-xs ${
            row.quantity < 10
              ? 'bg-red-100 text-red-700'
              : row.quantity < 50
              ? 'bg-yellow-100 text-yellow-700'
              : 'bg-green-100 text-green-700'
          }`}
        >
          {row.quantity}
        </span>
      ),
    },
    {
      header: 'Rating',
      accessor: (row: Product) => `${row.rating.toFixed(1)} (${row.totalRatings})`,
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
          <Button size="sm" variant="danger" onClick={() => handleDelete(row._id)}>
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
                  <option key={cat._id} value={cat._id}>
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
              onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
              required
            />
            <Input
              label="Discount %"
              type="number"
              value={formData.discountPercent}
              onChange={(e) =>
                setFormData({ ...formData, discountPercent: parseInt(e.target.value) })
              }
            />
            <Input
              label="Stock Quantity"
              type="number"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
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

      {managingImagesProduct && (
        <Modal
          isOpen={!!managingImagesProduct}
          onClose={() => setManagingImagesProduct(null)}
          title={`Manage Images - ${managingImagesProduct.name}`}
          size="xl"
        >
          <ProductImageManager
            productId={managingImagesProduct._id}
            onClose={() => setManagingImagesProduct(null)}
          />
        </Modal>
      )}

      {managingVariantsProduct && (
        <Modal
          isOpen={!!managingVariantsProduct}
          onClose={() => setManagingVariantsProduct(null)}
          title={`Manage Variants - ${managingVariantsProduct.name}`}
          size="lg"
        >
          <ProductVariantManager
            productId={managingVariantsProduct._id}
            onClose={() => setManagingVariantsProduct(null)}
          />
        </Modal>
      )}
    </div>
  );
}
