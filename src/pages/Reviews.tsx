import { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Table } from '../components/ui/Table';
import { ProductSelector } from '../components/ui/ProductSelector';
import { api } from '../services/api';
import { toast } from '../utils/toast';
import { Star, Check, X, Trash2, Image as ImageIcon } from 'lucide-react';
import type { Review } from '../types';

interface Product {
  _id: string;
  name: string;
  images?: { url: string; isPrimary: boolean }[];
  price: number;
  productType: string;
}

export function Reviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    fetchReviews();
  }, [selectedProduct]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = selectedProduct
        ? await api.getReviews(selectedProduct._id)
        : await api.getReviews();

      if (response.success) {
        setReviews(response.data || []);
      }
    } catch (error) {
      toast.error('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string, currentStatus: boolean) => {
    try {
      await api.updateReview(id, { approved: !currentStatus });
      toast.success(`Review ${!currentStatus ? 'approved' : 'unapproved'} successfully`);
      fetchReviews();
    } catch (error) {
      toast.error('Failed to update review');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this review?')) return;

    try {
      await api.deleteReview(id);
      toast.success('Review deleted successfully');
      fetchReviews();
    } catch (error) {
      toast.error('Failed to delete review');
    }
  };

  const getPrimaryImage = (product: Product) => {
    const primary = product.images?.find((img) => img.isPrimary);
    return primary?.url || product.images?.[0]?.url;
  };

  const columns = [
    {
      header: 'Product',
      accessor: (row: Review) => {
        if (selectedProduct) {
          return (
            <div className="flex items-center gap-3">
              {selectedProduct.images && selectedProduct.images.length > 0 && (
                <img
                  src={getPrimaryImage(selectedProduct)}
                  alt={selectedProduct.name}
                  className="w-10 h-10 object-cover rounded-lg"
                />
              )}
              <div>
                <p className="font-medium">{selectedProduct.name}</p>
                <p className="text-xs text-[#775596]">{selectedProduct.productType}</p>
              </div>
            </div>
          );
        }
        return <span className="font-mono text-sm">{row.productId.slice(-8)}</span>;
      },
    },
    {
      header: 'Rating',
      accessor: (row: Review) => (
        <div className="flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              size={16}
              className={`${
                i < row.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'
              }`}
            />
          ))}
          <span className="ml-1 text-sm">({row.rating})</span>
        </div>
      ),
    },
    {
      header: 'Comment',
      accessor: (row: Review) => (
        <div className="max-w-xs">
          <p className="text-sm">{row.comment || 'No comment'}</p>
          {row.imageUrl && (
            <div className="mt-2">
              <img
                src={row.imageUrl}
                alt="Review"
                className="w-16 h-16 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => window.open(row.imageUrl, '_blank')}
                title="Click to view full image"
              />
            </div>
          )}
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: (row: Review) => (
        <span
          className={`px-2 py-1 rounded-full text-xs ${
            row.approved
              ? 'bg-green-100 text-green-700'
              : 'bg-yellow-100 text-yellow-700'
          }`}
        >
          {row.approved ? 'Approved' : 'Pending'}
        </span>
      ),
    },
    {
      header: 'Date',
      accessor: (row: Review) => new Date(row.createdAt).toLocaleDateString(),
    },
    {
      header: 'Actions',
      accessor: (row: Review) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={row.approved ? 'ghost' : 'secondary'}
            onClick={() => handleApprove(row._id, row.approved)}
            title={row.approved ? 'Unapprove' : 'Approve'}
          >
            {row.approved ? <X size={16} /> : <Check size={16} />}
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
      <div>
        <h1 className="text-3xl font-bold text-[#1E2934BA] mb-2">Reviews</h1>
        <p className="text-[#775596]">Manage product reviews and ratings</p>
      </div>

      <Card>
        <div className="mb-6">
          <label className="block text-sm font-medium text-[#1E2934BA] mb-2">
            Filter by Product (Optional)
          </label>
          <ProductSelector
            onSelect={setSelectedProduct}
            selectedProduct={selectedProduct}
            placeholder="Search for a product to filter reviews..."
          />
          {selectedProduct && (
            <p className="mt-2 text-sm text-[#775596]">
              Showing {reviews.length} review(s) for {selectedProduct.name}
            </p>
          )}
        </div>

        <Table
          data={reviews}
          columns={columns}
          loading={loading}
          emptyMessage={
            selectedProduct
              ? `No reviews found for ${selectedProduct.name}`
              : 'No reviews found'
          }
        />
      </Card>
    </div>
  );
}
