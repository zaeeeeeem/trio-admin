import { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { api } from '../../services/api';
import { toast } from '../../utils/toast';
import { Image as ImageIcon, Upload, Star, Trash2, Edit } from 'lucide-react';

interface ProductImage {
  id: string;
  productId: string;
  imageUrl: string;
  isPrimary: boolean;
  createdAt: string;
}

interface ProductImageManagerProps {
  productId: string;
  onClose: () => void;
}

export function ProductImageManager({ productId, onClose }: ProductImageManagerProps) {
  const [images, setImages] = useState<ProductImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingImage, setEditingImage] = useState<ProductImage | null>(null);
  const [imageUrl, setImageUrl] = useState('');

  useEffect(() => {
    fetchImages();
  }, [productId]);

  const fetchImages = async () => {
    try {
      setLoading(true);
      const response = await api.getProductImages(productId);
      if (response.success) {
        setImages(response.data || []);
      }
    } catch (error) {
      toast.error('Failed to load images');
    } finally {
      setLoading(false);
    }
  };

  const handleAddImage = async () => {
    if (!imageUrl.trim()) {
      toast.error('Please enter an image URL');
      return;
    }

    try {
      await api.createProductImage(productId, {
        imageUrl: imageUrl.trim(),
        isPrimary: images.length === 0,
      });
      toast.success('Image added successfully');
      setShowAddModal(false);
      setImageUrl('');
      fetchImages();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add image');
    }
  };

  const handleUpdateImage = async () => {
    if (!editingImage || !imageUrl.trim()) return;

    try {
      await api.updateProductImage(productId, editingImage.id, {
        imageUrl: imageUrl.trim(),
        isPrimary: editingImage.isPrimary,
      });
      toast.success('Image updated successfully');
      setEditingImage(null);
      setImageUrl('');
      fetchImages();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update image');
    }
  };

  const handleSetPrimary = async (imageId: string) => {
    try {
      await api.setProductImagePrimary(productId, imageId);
      toast.success('Primary image updated');
      fetchImages();
    } catch (error: any) {
      toast.error('Failed to set primary image');
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!confirm('Are you sure you want to delete this image?')) return;

    try {
      await api.deleteProductImage(productId, imageId);
      toast.success('Image deleted successfully');
      fetchImages();
    } catch (error) {
      toast.error('Failed to delete image');
    }
  };

  return (
    <div>
      <div className="mb-4 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-[#1E2934BA]">Product Images</h3>
        <Button size="sm" onClick={() => setShowAddModal(true)}>
          <Upload size={16} className="mr-2" />
          Add Image
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-48 bg-[#F2DFFF] animate-pulse rounded-lg"></div>
          ))}
        </div>
      ) : images.length === 0 ? (
        <div className="text-center py-12 bg-[#F2DFFF] bg-opacity-30 rounded-lg">
          <ImageIcon size={48} className="mx-auto text-[#775596] opacity-50 mb-4" />
          <p className="text-[#1E2934BA] opacity-60">No images yet</p>
          <Button size="sm" className="mt-4" onClick={() => setShowAddModal(true)}>
            Add First Image
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {images.map((image) => (
            <div
              key={image.id}
              className="relative group rounded-lg overflow-hidden border-2 border-[#E5E5E5] hover:border-[#9268AF] transition-all"
            >
              <img
                src={image.imageUrl}
                alt="Product"
                className="w-full h-48 object-cover"
              />
              {image.isPrimary && (
                <div className="absolute top-2 left-2 bg-[#9268AF] text-white px-2 py-1 rounded-md text-xs flex items-center gap-1">
                  <Star size={12} className="fill-white" />
                  Primary
                </div>
              )}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                {!image.isPrimary && (
                  <Button
                    size="sm"
                    onClick={() => handleSetPrimary(image.id)}
                    title="Set as primary"
                  >
                    <Star size={16} />
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setEditingImage(image);
                    setImageUrl(image.imageUrl);
                  }}
                >
                  <Edit size={16} />
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => handleDeleteImage(image.id)}
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={showAddModal || !!editingImage}
        onClose={() => {
          setShowAddModal(false);
          setEditingImage(null);
          setImageUrl('');
        }}
        title={editingImage ? 'Edit Image' : 'Add New Image'}
      >
        <div className="space-y-4">
          <Input
            label="Image URL"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://example.com/image.jpg"
            required
          />
          {imageUrl && (
            <div className="border border-[#E5E5E5] rounded-lg p-4">
              <p className="text-sm text-[#775596] mb-2">Preview:</p>
              <img
                src={imageUrl}
                alt="Preview"
                className="w-full h-48 object-cover rounded-lg"
                onError={(e) => {
                  e.currentTarget.src = 'https://via.placeholder.com/300x200?text=Invalid+URL';
                }}
              />
            </div>
          )}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="ghost"
              onClick={() => {
                setShowAddModal(false);
                setEditingImage(null);
                setImageUrl('');
              }}
            >
              Cancel
            </Button>
            <Button onClick={editingImage ? handleUpdateImage : handleAddImage}>
              {editingImage ? 'Update' : 'Add'} Image
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
