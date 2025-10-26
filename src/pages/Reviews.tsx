import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Table } from '../components/ui/Table';
import { ProductSelector } from '../components/ui/ProductSelector';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { api } from '../services/api';
import { toast } from '../utils/toast';
import { Star, Check, X, Trash2, Pencil, MessageSquare } from 'lucide-react';
import type { Product, Review } from '../types';

const PAGE_SIZE = 10;

export function Reviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [pagination, setPagination] = useState<{ limit: number; nextCursor: string | null }>({
    limit: PAGE_SIZE,
    nextCursor: null,
  });
  const [productCache, setProductCache] = useState<Record<string, Product>>({});
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [reviewForm, setReviewForm] = useState({
    product: null as Product | null,
    rating: 5,
    comment: '',
    imageUrl: '',
    approved: false,
  });

  const fetchReviews = useCallback(
    async ({ cursor, reset }: { cursor?: string | null; reset?: boolean } = {}) => {
      const productId = selectedProduct?.id ?? selectedProduct?._id ?? '';
      const hasProduct = Boolean(productId);
      const isReset = Boolean(reset);

      if (isReset) {
        setLoading(true);
        setReviews([]);
        setPagination({ limit: PAGE_SIZE, nextCursor: null });
      } else {
        setLoadingMore(true);
      }

      try {
        const params: { limit: number; cursor?: string } = { limit: PAGE_SIZE };
        if (cursor) {
          params.cursor = cursor;
        }

        const response = hasProduct
          ? await api.getReviewsByProduct(productId, params)
          : await api.getLatestReviews(params);

        if (!response.success) {
          throw new Error(response.message || 'Failed to load reviews');
        }

        const fetchedReviews = response.data?.reviews ?? [];

        setReviews((prev) => (isReset ? fetchedReviews : [...prev, ...fetchedReviews]));

        const paginationData = response.data?.pagination;
        setPagination({
          limit: paginationData?.limit ?? PAGE_SIZE,
          nextCursor: paginationData?.nextCursor ?? null,
        });

        if (hasProduct && selectedProduct && isReset) {
          setProductCache((prev) => {
            const next = { ...prev };
            if (!next[productId]) {
              next[productId] = selectedProduct;
            }
            return next;
          });
        }

        if (fetchedReviews.length > 0) {
          setProductCache((prev) => {
            let updated = false;
            const next = { ...prev };

            fetchedReviews.forEach((review) => {
              const product = review.product;
              const productKey = product?.id ?? product?._id;
              if (product && productKey && !next[productKey]) {
                next[productKey] = product;
                updated = true;
              }
            });

            return updated ? next : prev;
          });
        }
      } catch (error) {
        toast.error('Failed to load reviews');
        if (isReset) {
          setReviews([]);
          setPagination({ limit: PAGE_SIZE, nextCursor: null });
        }
      } finally {
        if (isReset) {
          setLoading(false);
        } else {
          setLoadingMore(false);
        }
      }
    },
    [selectedProduct]
  );

  useEffect(() => {
    fetchReviews({ reset: true });
  }, [fetchReviews]);

  useEffect(() => {
    if (!selectedProduct) {
      return;
    }

    const productId = selectedProduct.id ?? selectedProduct._id;
    if (!productId) {
      return;
    }

    setProductCache((prev) => {
      if (prev[productId]) {
        return prev;
      }
      return {
        ...prev,
        [productId]: selectedProduct,
      };
    });
  }, [selectedProduct]);

  useEffect(() => {
    if (selectedProduct || reviews.length === 0) {
      return;
    }

    const missingProductIds = Array.from(
      new Set(
        reviews
          .map((review) => review.productId)
          .filter((id): id is string => Boolean(id) && !productCache[id])
      )
    );

    if (missingProductIds.length === 0) {
      return;
    }

    let isCancelled = false;

    (async () => {
      try {
        const entries = await Promise.all(
          missingProductIds.map(async (id) => {
            try {
              const response = await api.getProduct(id);
              if (response.success && response.data) {
                return [id, response.data] as [string, Product];
              }
            } catch {
              // ignore individual fetch failures
            }
            return null;
          })
        );

        if (isCancelled) {
          return;
        }

        const resolved: Record<string, Product> = {};
        entries.forEach((item) => {
          if (item) {
            const [id, product] = item;
            resolved[id] = product;
          }
        });

        if (Object.keys(resolved).length > 0) {
          setProductCache((prev) => ({
            ...prev,
            ...resolved,
          }));
        }
      } catch {
        // no-op
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, [selectedProduct, reviews, productCache]);

  const resolveProductForReview = (review?: Review | null): Product | null => {
    if (!review) {
      return selectedProduct;
    }

    const productId = review.productId;
    const selectedProductId = selectedProduct?.id ?? selectedProduct?._id;

    if (selectedProduct && productId && selectedProductId === productId) {
      return selectedProduct;
    }

    const productFromReview = review.product;
    if (productFromReview) {
      return productFromReview;
    }

    if (productId && productCache[productId]) {
      return productCache[productId];
    }

    return null;
  };

  const resetReviewForm = () => {
    setEditingReview(null);
    setReviewForm({
      product: selectedProduct,
      rating: 5,
      comment: '',
      imageUrl: '',
      approved: false,
    });
  };

  const handleOpenReviewModal = (review?: Review) => {
    if (review) {
      const resolvedProduct = resolveProductForReview(review);
      setEditingReview(review);
      setReviewForm({
        product: resolvedProduct,
        rating: review.rating,
        comment: review.comment ?? '',
        imageUrl: review.imageUrl ?? '',
        approved: review.approved,
      });

      if (!resolvedProduct && review.productId) {
        (async () => {
          try {
            const response = await api.getProduct(review.productId);
            if (response.success && response.data) {
              const product = response.data;
              setProductCache((prev) => {
                const reviewProductId = review.productId;
                if (!reviewProductId || prev[reviewProductId]) {
                  return prev;
                }
                return {
                  ...prev,
                  [reviewProductId]: product,
                };
              });
              setReviewForm((prev) => ({
                ...prev,
                product,
              }));
            }
          } catch {
            // ignore fetch failure here
          }
        })();
      }
    } else {
      resetReviewForm();
    }
    setShowReviewModal(true);
  };

  const handleCloseReviewModal = () => {
    setShowReviewModal(false);
    resetReviewForm();
  };

  const handleSubmitReview = async () => {
    const product = reviewForm.product ?? selectedProduct;
    const productId = product?.id ?? product?._id ?? '';
    if (!productId) {
      toast.error('Select a product for the review');
      return;
    }

    try {
      if (editingReview) {
        await api.updateReview(editingReview.id ?? editingReview._id ?? '', {
          productId,
          rating: reviewForm.rating,
          comment: reviewForm.comment.trim() || undefined,
          imageUrl: reviewForm.imageUrl.trim() || undefined,
          approved: reviewForm.approved,
        });
        toast.success('Review updated successfully');
      } else {
        await api.createReview({
          productId,
          rating: reviewForm.rating,
          comment: reviewForm.comment.trim() || undefined,
          imageUrl: reviewForm.imageUrl.trim() || undefined,
          approved: reviewForm.approved,
        });
        toast.success('Review created successfully');
      }
      handleCloseReviewModal();
      fetchReviews({ reset: true });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save review');
    }
  };

  const handleApprove = async (id: string, currentStatus: boolean) => {
    try {
      await api.toggleReviewApproval(id, !currentStatus);
      toast.success(`Review ${!currentStatus ? 'approved' : 'unapproved'} successfully`);
      fetchReviews({ reset: true });
    } catch (error) {
      toast.error('Failed to update review');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this review?')) return;

    try {
      await api.deleteReview(id);
      toast.success('Review deleted successfully');
      fetchReviews({ reset: true });
    } catch (error) {
      toast.error('Failed to delete review');
    }
  };

  const getProductSummary = (review: Review) => {
    const product = resolveProductForReview(review);

    if (!product) {
      const productId = review.productId;
      return {
        name: productId ? `Product ${productId.slice(-8)}` : 'Unknown product',
        type: 'N/A',
        image: 'https://via.placeholder.com/40',
      };
    }
    const primary = product.images?.find((img) => img.isPrimary) ?? product.images?.[0];
    return {
      name: product.name,
      type: product.productType ?? 'Unknown',
      image:
        primary?.viewUrl || primary?.publicUrl || primary?.imageUrl || 'https://via.placeholder.com/40',
    };
  };

  const columns = useMemo(
    () => [
      {
        header: 'Product',
        accessor: (row: Review) => {
          const summary = getProductSummary(row);
          return (
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#F2DFFF] text-[#775596]">
                <MessageSquare size={18} aria-hidden />
              </div>
              <div>
                <p className="font-medium">{summary.name}</p>
                <p className="text-xs text-[#775596]">{summary.type}</p>
              </div>
            </div>
          );
        },
      },
      {
        header: 'Rating',
        accessor: (row: Review) => (
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                size={16}
                className={
                  i < row.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'
                }
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
              <div className="mt-2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#F2DFFF] text-[#775596]">
                <MessageSquare size={20} aria-hidden />
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
              row.approved ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
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
            <Button size="sm" variant="ghost" onClick={() => handleOpenReviewModal(row)} title="Edit review">
              <Pencil size={16} />
            </Button>
            <Button
              size="sm"
              variant={row.approved ? 'ghost' : 'secondary'}
              onClick={() => handleApprove(row.id ?? row._id ?? '', row.approved)}
              title={row.approved ? 'Unapprove' : 'Approve'}
              disabled={!row.id && !row._id}
            >
              {row.approved ? <X size={16} /> : <Check size={16} />}
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={() => {
                const reviewId = row.id ?? row._id;
                if (reviewId) {
                  handleDelete(reviewId);
                } else {
                  toast.error('Unable to determine review identifier');
                }
              }}
            >
              <Trash2 size={16} />
            </Button>
          </div>
        ),
      },
    ],
    [selectedProduct, productCache]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#1E2934BA] mb-2">Reviews</h1>
        <p className="text-[#775596]">Manage product reviews and ratings</p>
      </div>

      <Card>
        <div className="mb-6 space-y-4">
          <label className="block text-sm font-medium text-[#1E2934BA] mb-2">
            Filter by Product (Optional)
          </label>
          <ProductSelector
            onSelect={(product) => {
              setSelectedProduct(product);
            }}
            selectedProduct={selectedProduct}
            placeholder="Search for a product to filter reviews..."
          />
          <p className="mt-2 text-sm text-[#775596]">
            {selectedProduct
              ? `Showing ${reviews.length} review(s) for ${selectedProduct.name}`
              : `Showing latest ${reviews.length} review(s)`}
          </p>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button onClick={() => handleOpenReviewModal()}>
              Add Review
            </Button>
            <div className="flex items-center gap-2 text-sm text-[#775596]">
              <span>Loaded: {reviews.length}</span>
              {pagination.nextCursor && !loading && (
                <span>More available</span>
              )}
            </div>
          </div>
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

        {pagination.nextCursor && (
          <div className="mt-6 flex justify-center">
            <Button
              variant="ghost"
              disabled={loadingMore}
              onClick={() => {
                if (pagination.nextCursor) {
                  fetchReviews({ cursor: pagination.nextCursor });
                }
              }}
            >
              {loadingMore ? 'Loading...' : 'Load More'}
            </Button>
          </div>
        )}
      </Card>

      <Modal
        isOpen={showReviewModal}
        onClose={handleCloseReviewModal}
        title={editingReview ? 'Edit Review' : 'Add Review'}
      >
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-[#1E2934BA] mb-2">Product</p>
            <ProductSelector
              selectedProduct={reviewForm.product ?? selectedProduct}
              onSelect={(product) => setReviewForm((prev) => ({ ...prev, product }))}
              placeholder="Select product..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Rating"
              type="number"
              min={1}
              max={5}
              value={reviewForm.rating}
              onChange={(e) =>
                setReviewForm((prev) => ({
                  ...prev,
                  rating: Math.min(5, Math.max(1, Number(e.target.value) || 1)),
                }))
              }
            />
            <div>
              <label className="block text-sm font-medium text-[#1E2934BA] mb-1">
                Status
              </label>
              <select
                value={reviewForm.approved ? 'approved' : 'pending'}
                onChange={(e) =>
                  setReviewForm((prev) => ({ ...prev, approved: e.target.value === 'approved' }))
                }
                className="w-full px-4 py-2 border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9268AF]"
              >
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
              </select>
            </div>
          </div>

          <Input
            label="Image URL (optional)"
            value={reviewForm.imageUrl}
            onChange={(e) => setReviewForm((prev) => ({ ...prev, imageUrl: e.target.value }))}
            placeholder="https://example.com/review.jpg"
          />

          <div>
            <label className="block text-sm font-medium text-[#1E2934BA] mb-1">
              Comment
            </label>
            <textarea
              value={reviewForm.comment}
              onChange={(e) => setReviewForm((prev) => ({ ...prev, comment: e.target.value }))}
              className="w-full px-4 py-2 border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9268AF]"
              rows={4}
              placeholder="Share details about this review"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[#F2DFFF]">
            <Button variant="ghost" onClick={handleCloseReviewModal}>
              Cancel
            </Button>
            <Button onClick={handleSubmitReview}>
              {editingReview ? 'Update Review' : 'Create Review'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
