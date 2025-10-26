import { ChangeEvent, useEffect, useRef, useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { api } from '../../services/api';
import { toast } from '../../utils/toast';
import { Image as ImageIcon, Upload, Star, Trash2, Edit } from 'lucide-react';
import type { ProductImage } from '../../types';

interface ProductImageManagerProps {
  productId: string;
}

type ImageFormState = {
  alt: string;
  isPrimary: boolean;
  sortOrder: number;
};

type QueuedImage = {
  id: string;
  file: File;
  previewUrl: string;
  name: string;
  size: number;
};

const createInitialFormState = (sortOrder = 0): ImageFormState => ({
  alt: '',
  isPrimary: false,
  sortOrder,
});

const formatFileSize = (bytes: number) => {
  if (!Number.isFinite(bytes)) {
    return '';
  }

  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  if (bytes >= 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }

  return `${bytes} B`;
};

export function ProductImageManager({ productId }: ProductImageManagerProps) {
  const [images, setImages] = useState<ProductImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingImage, setEditingImage] = useState<ProductImage | null>(null);
  const [formState, setFormState] = useState<ImageFormState>(createInitialFormState());
  const [queuedImages, setQueuedImages] = useState<QueuedImage[]>([]);
  const [primaryQueuedId, setPrimaryQueuedId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    fetchImages();
  }, [productId]);

  useEffect(() => {
    return () => {
      queuedImages.forEach((image) => URL.revokeObjectURL(image.previewUrl));
    };
  }, [queuedImages]);

  const fetchImages = async () => {
    try {
      setLoading(true);
      const response = await api.getProductImages(productId, { limit: 24 });
      if (response.success) {
        setImages(response.data?.items ?? []);
      }
    } catch (error) {
      toast.error('Failed to load images');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setQueuedImages((prev) => {
      prev.forEach((image) => URL.revokeObjectURL(image.previewUrl));
      return [];
    });
    setPrimaryQueuedId(null);
    setFormState(createInitialFormState(images.length));
    setEditingImage(null);
    setSubmitting(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleOpenAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);

    if (files.length === 0) {
      return;
    }

    const queued = files.map<QueuedImage>((file) => {
      const uniqueId = `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2, 10)}`;
      return {
        id: uniqueId,
        file,
        previewUrl: URL.createObjectURL(file),
        name: file.name,
        size: file.size,
      };
    });

    setQueuedImages((prev) => [...prev, ...queued]);
    setPrimaryQueuedId((prev) => prev ?? queued[0]?.id ?? null);

    event.target.value = '';
  };

  const handleAddImage = async () => {
    if (queuedImages.length === 0) {
      toast.error('Select at least one image to upload');
      return;
    }

    setSubmitting(true);

    try {
      const primaryIndex = Math.max(
        primaryQueuedId ? queuedImages.findIndex((image) => image.id === primaryQueuedId) : 0,
        0
      );

      const response = await api.createProductImage(productId, {
        files: queuedImages.map((image) => image.file),
        primaryIndex,
        alt: formState.alt.trim() || undefined,
        sortOrder: Number.isFinite(formState.sortOrder) ? formState.sortOrder : undefined,
      });

      if (!response.success) {
        throw new Error(response.message || 'Failed to upload images');
      }

      const uploadedCount = response.data?.length ?? queuedImages.length;
      toast.success(
        uploadedCount > 1
          ? `${uploadedCount} images uploaded successfully`
          : 'Image uploaded successfully'
      );
      setShowModal(false);
      resetForm();
      fetchImages();
    } catch (error: any) {
      const message =
        error.response?.data?.message || error.message || 'Failed to upload images';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateImage = async () => {
    if (!editingImage) {
      return;
    }

    setSubmitting(true);

    try {
      await api.updateProductImage(productId, editingImage._id, {
        alt: formState.alt.trim() || undefined,
        isPrimary: formState.isPrimary,
        sortOrder: Number.isFinite(formState.sortOrder) ? formState.sortOrder : undefined,
      });
      toast.success('Image updated successfully');
      setShowModal(false);
      resetForm();
      fetchImages();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update image');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSetPrimary = async (image: ProductImage) => {
    try {
      await api.setProductImagePrimary(productId, image._id);
      toast.success('Primary image updated');
      fetchImages();
    } catch (error: any) {
      toast.error('Failed to update primary image');
    }
  };

  const handleDeleteImage = async (image: ProductImage) => {
    if (!confirm('Are you sure you want to delete this image?')) return;

    try {
      await api.deleteProductImage(productId, image._id, { deleteFile: true });
      toast.success('Image deleted successfully');
      fetchImages();
    } catch (error: any) {
      toast.error('Failed to delete image');
    }
  };

  const handleQueueSetPrimary = (id: string) => {
    setPrimaryQueuedId(id);
  };

  const handleRemoveQueuedImage = (id: string) => {
    setQueuedImages((prev) => {
      const next: QueuedImage[] = [];

      prev.forEach((image) => {
        if (image.id === id) {
          URL.revokeObjectURL(image.previewUrl);
          return;
        }
        next.push(image);
      });

      setPrimaryQueuedId((current) => {
        if (current === id) {
          return next[0]?.id ?? null;
        }
        return current;
      });

      return next;
    });
  };

  const openEditModal = (image: ProductImage) => {
    resetForm();
    setEditingImage(image);
    setFormState({
      alt: image.alt ?? '',
      isPrimary: image.isPrimary ?? false,
      sortOrder: image.sortOrder ?? 0,
    });
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    resetForm();
  };

  const renderImages = () => {
    if (loading) {
      return (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="h-48 bg-[#F2DFFF] animate-pulse rounded-lg" />
          ))}
        </div>
      );
    }

    if (images.length === 0) {
      return (
        <div className="text-center py-12 bg-[#F2DFFF] bg-opacity-30 rounded-lg">
          <ImageIcon size={48} className="mx-auto text-[#775596] opacity-50 mb-4" />
          <p className="text-[#1E2934BA] opacity-60">No images yet</p>
          <Button size="sm" className="mt-4" onClick={handleOpenAddModal}>
            Add First Image
          </Button>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {images.map((image) => (
          <div
            key={image._id}
            className={`relative group rounded-lg overflow-hidden border-2 transition-all ${
              image.isPrimary ? 'border-[#9268AF]' : 'border-[#E5E5E5] hover:border-[#9268AF]'
            }`}
          >
            <img
              src={image.viewUrl || image.publicUrl || image.imageUrl}
              alt={image.alt || 'Product image'}
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
                <Button size="sm" onClick={() => handleSetPrimary(image)} title="Set as primary">
                  <Star size={16} />
                </Button>
              )}
              <Button size="sm" variant="ghost" onClick={() => openEditModal(image)}>
                <Edit size={16} />
              </Button>
              <Button size="sm" variant="danger" onClick={() => handleDeleteImage(image)}>
                <Trash2 size={16} />
              </Button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const isEditing = Boolean(editingImage);

  return (
    <div>
      <div className="mb-4 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-[#1E2934BA]">Product Images</h3>
          <p className="text-sm text-[#775596]">
            Upload JPEG, PNG, or WEBP files. Pick a primary image and manage your gallery.
          </p>
        </div>
        <Button size="sm" onClick={handleOpenAddModal}>
          <Upload size={16} className="mr-2" />
          Add Images
        </Button>
      </div>

      {renderImages()}

      <Modal
        isOpen={showModal}
        onClose={handleModalClose}
        title={isEditing ? 'Edit Image Metadata' : 'Upload Product Images'}
      >
        <div className="space-y-5">
          {!isEditing && (
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="border-2 border-dashed border-[#C9B2DF] rounded-lg p-6 text-center bg-[#F2DFFF] bg-opacity-20">
                <ImageIcon size={36} className="mx-auto text-[#775596] opacity-80" />
                <p className="mt-3 text-sm text-[#775596]">
                  Select one or more images from your computer. The first image becomes primary
                  automatically—click another thumbnail to change it.
                </p>
                <div className="mt-4 flex justify-center">
                  <Button type="button" onClick={() => fileInputRef.current?.click()}>
                    <Upload size={16} className="mr-2" />
                    Choose Images
                  </Button>
                </div>
                <p className="mt-2 text-xs text-[#775596]">
                  JPEG, PNG, or WEBP formats are supported.
                </p>
              </div>

              {queuedImages.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-[#1E2934BA]">Selected Images</p>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload size={14} className="mr-2" />
                      Add More
                    </Button>
                  </div>
                  <p className="text-xs text-[#775596]">
                    Hover a thumbnail to mark it as primary or remove it before uploading.
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {queuedImages.map((queued) => {
                      const isPrimaryQueued = queued.id === primaryQueuedId;
                      return (
                        <div
                          key={queued.id}
                          className={`relative rounded-lg overflow-hidden border-2 transition-all ${
                            isPrimaryQueued ? 'border-[#9268AF] shadow-lg' : 'border-[#E5E5E5]'
                          }`}
                        >
                          <img
                            src={queued.previewUrl}
                            alt={queued.name}
                            className="w-full h-40 object-cover"
                          />
                          {isPrimaryQueued && (
                            <div className="absolute top-2 left-2 bg-[#9268AF] text-white px-2 py-1 rounded-md text-xs flex items-center gap-1">
                              <Star size={12} className="fill-white" />
                              Primary
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/0 hover:bg-black/50 transition-all flex items-center justify-center gap-2 opacity-0 hover:opacity-100">
                            {!isPrimaryQueued && (
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => handleQueueSetPrimary(queued.id)}
                                title="Set as primary"
                              >
                                <Star size={16} />
                              </Button>
                            )}
                            <Button
                              type="button"
                              size="sm"
                              variant="danger"
                              onClick={() => handleRemoveQueuedImage(queued.id)}
                              title="Remove"
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>
                          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs px-2 py-1 flex items-center justify-between gap-2">
                            <span className="truncate">{queued.name}</span>
                            <span className="shrink-0 opacity-75">{formatFileSize(queued.size)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          <Input
            label={
              isEditing ? 'Alt Text' : 'Alt Text (applied to all uploaded images)'
            }
            placeholder="Describe the image for accessibility"
            value={formState.alt}
            onChange={(e) => setFormState({ ...formState, alt: e.target.value })}
          />

          <div className={`grid gap-4 ${isEditing ? 'md:grid-cols-2' : 'md:grid-cols-1'}`}>
            {isEditing && (
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-[#1E2934BA]">
                  <input
                    type="checkbox"
                    checked={formState.isPrimary}
                    onChange={(e) =>
                      setFormState({ ...formState, isPrimary: e.target.checked })
                    }
                  />
                  Set as primary image
                </label>
              </div>
            )}
            <Input
              label={isEditing ? 'Sort Order' : 'Starting Sort Order'}
              type="number"
              value={formState.sortOrder}
              onChange={(e) => {
                const value = parseInt(e.target.value, 10);
                setFormState({
                  ...formState,
                  sortOrder: Number.isNaN(value) ? 0 : value,
                });
              }}
            />
          </div>

          {editingImage && (
            <div className="border border-[#E5E5E5] rounded-lg p-4">
              <p className="text-sm text-[#775596] mb-2">Preview:</p>
              <img
                src={editingImage.viewUrl || editingImage.publicUrl || editingImage.imageUrl || ''}
                alt="Preview"
                className="w-full h-48 object-cover rounded-lg"
              />
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="ghost" onClick={handleModalClose}>
              Cancel
            </Button>
            <Button
              onClick={isEditing ? handleUpdateImage : handleAddImage}
              loading={submitting}
              disabled={!isEditing && queuedImages.length === 0}
            >
              {isEditing ? 'Update Image' : 'Upload Images'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
