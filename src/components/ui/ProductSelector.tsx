import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../../services/api';
import { Search, X } from 'lucide-react';
import type { Product, ProductImage } from '../../types';

interface ProductSelectorProps {
  onSelect: (product: Product | null) => void;
  selectedProduct?: Product | null;
  placeholder?: string;
}

export function ProductSelector({
  onSelect,
  selectedProduct,
  placeholder = 'Search products...',
}: ProductSelectorProps) {
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [productCache, setProductCache] = useState<Record<string, Product>>({});
  const debounceRef = useRef<NodeJS.Timeout>();
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (search.trim().length < 2) {
      setProducts([]);
      setShowDropdown(false);
      return;
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(async () => {
      await fetchProducts(search);
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [search]);

  const resolveImageSource = (image?: ProductImage | null): string | undefined => {
    if (!image) {
      return undefined;
    }
    const candidates: Array<unknown> = [
      image.viewUrl,
      image.publicUrl,
      image.imageUrl,
      (image as { url?: unknown }).url,
      (image as { Location?: unknown }).Location,
      (image as { location?: unknown }).location,
      (image as { secureUrl?: unknown }).secureUrl,
      (image as { secure_url?: unknown }).secure_url,
      (image as { downloadUrl?: unknown }).downloadUrl,
      (image as { downloadURL?: unknown }).downloadURL,
      (image as { signedUrl?: unknown }).signedUrl,
      (image as { SignedUrl?: unknown }).SignedUrl,
      (image as { previewUrl?: unknown }).previewUrl,
      (image as { preview_url?: unknown }).preview_url,
    ];

    for (const candidate of candidates) {
      if (typeof candidate === 'string') {
        const trimmed = candidate.trim();
        if (trimmed.length > 0) {
          return trimmed;
        }
      }
    }
    return undefined;
  };

  const resolveProductFallbackImage = (product?: Product | null): string | undefined => {
    if (!product) {
      return undefined;
    }

    const candidates: Array<unknown> = [
      (product as { imageUrl?: unknown }).imageUrl,
      (product as { image_url?: unknown }).image_url,
      (product as { image?: unknown }).image,
      (product as { thumbnail?: unknown }).thumbnail,
      (product as { thumbnailUrl?: unknown }).thumbnailUrl,
      (product as { thumbnail_url?: unknown }).thumbnail_url,
      (product as { coverImage?: unknown }).coverImage,
      (product as { cover_image?: unknown }).cover_image,
      (product as { featuredImage?: unknown }).featuredImage,
      (product as { featured_image?: unknown }).featured_image,
      (product as { primaryImageUrl?: unknown }).primaryImageUrl,
      (product as { primary_image_url?: unknown }).primary_image_url,
      (product as { mainImage?: unknown }).mainImage,
      (product as { main_image?: unknown }).main_image,
      (product as { signedUrl?: unknown }).signedUrl,
      (product as { SignedUrl?: unknown }).SignedUrl,
    ];

    for (const candidate of candidates) {
      if (typeof candidate === 'string') {
        const trimmed = candidate.trim();
        if (trimmed.length > 0) {
          return trimmed;
        }
      }
    }

    return undefined;
  };

  const ensureProductWithImages = useCallback(
    async (product: Product): Promise<Product> => {
      const productKey = product.id ?? product._id;
      if (!productKey) {
        return product;
      }

      if (productCache[productKey]) {
        return productCache[productKey];
      }

      const hasImage =
        (product.images ?? []).some((img) => Boolean(resolveImageSource(img))) ||
        Boolean(resolveProductFallbackImage(product));

      if (hasImage) {
        setProductCache((prev) => (prev[productKey] ? prev : { ...prev, [productKey]: product }));
        return product;
      }

      try {
        const response = await api.getProduct(productKey);
        if (response.success && response.data) {
          let detailedProduct = response.data;

          if (!detailedProduct.images || detailedProduct.images.length === 0) {
            try {
              const imagesResponse = await api.getProductImages(productKey, { limit: 1 });
              if (imagesResponse.success && imagesResponse.data?.items?.length) {
                detailedProduct = {
                  ...detailedProduct,
                  images: imagesResponse.data.items,
                };
              }
            } catch (imageLoadError) {
              console.error('Failed to fetch product images', imageLoadError);
            }
          }

          if (
            !((detailedProduct.images ?? []).some((img) => Boolean(resolveImageSource(img)))) &&
            !resolveProductFallbackImage(detailedProduct)
          ) {
            // Preserve any direct URL hints from the original product object
            const fallbackUrl = resolveProductFallbackImage(product);
            if (fallbackUrl) {
              detailedProduct = {
                ...detailedProduct,
                images: [
                  {
                    _id: 'fallback',
                    productId: productKey,
                    imageUrl: fallbackUrl,
                    publicUrl: fallbackUrl,
                    viewUrl: fallbackUrl,
                    isPrimary: true,
                    alt: detailedProduct.name ?? 'Product image',
                    sortOrder: 0,
                    cloudinaryPublicId: undefined,
                    storageKey: undefined,
                    etag: undefined,
                    bytes: undefined,
                    width: undefined,
                    height: undefined,
                    format: undefined,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                  },
                ],
              };
            }
          }

          setProductCache((prev) => ({ ...prev, [productKey]: detailedProduct }));
          return detailedProduct;
        }
      } catch (error) {
        console.error('Failed to fetch product details', error);
      }

      return product;
    },
    [productCache]
  );

  const fetchProducts = async (query: string) => {
    try {
      setLoading(true);
      const response = await api.getProducts({ search: query.trim(), limit: 10 });
      if (response.success) {
        const results = response.data?.products ?? [];
        const enriched = await Promise.all(results.map((product) => ensureProductWithImages(product)));
        setProducts(enriched);
        setProductCache((prev) => {
          const next = { ...prev };
          enriched.forEach((product) => {
            const key = product.id ?? product._id;
            if (key) {
              next[key] = product;
            }
          });
          return next;
        });
        setShowDropdown(true);
      }
    } catch (error) {
      console.error('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = async (product: Product) => {
    setShowDropdown(false);
    setSearch('');
    try {
      const hydrated = await ensureProductWithImages(product);
      onSelect(hydrated);
    } catch {
      onSelect(product);
    }
  };

  const handleClear = () => {
    onSelect(null);
    setSearch('');
    setProducts([]);
  };

  const getPrimaryImage = (product: Product) => {
    const primary = product.images?.find((img) => img.isPrimary);
    const source =
      resolveImageSource(primary ?? null) ||
      resolveImageSource((product.images ?? [])[0] as ProductImage | undefined) ||
      resolveProductFallbackImage(product);
    return source ?? 'https://via.placeholder.com/40';
  };

  return (
    <div ref={wrapperRef} className="relative">
      {selectedProduct ? (
        <div className="flex items-center gap-3 p-3 bg-[#F2DFFF] bg-opacity-30 rounded-lg border border-[#9268AF]">
          <img
            src={getPrimaryImage(selectedProduct)}
            alt={selectedProduct.name}
            className="w-12 h-12 object-cover rounded-lg"
          />
          <div className="flex-1">
            <p className="font-medium text-[#1E2934BA]">{selectedProduct.name}</p>
            <p className="text-sm text-[#775596]">
              {typeof selectedProduct.price === 'number'
                ? `$${selectedProduct.price.toFixed(2)}`
                : 'N/A'}{' '}
              • {selectedProduct.productType ?? 'Unknown'}
            </p>
          </div>
          <button
            onClick={handleClear}
            className="p-2 hover:bg-[#9268AF] hover:bg-opacity-20 rounded-lg transition-colors"
          >
            <X size={20} className="text-[#775596]" />
          </button>
        </div>
      ) : (
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#775596]"
            size={20}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={placeholder}
            className="w-full pl-10 pr-4 py-2 border border-[#E5E5E5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9268AF] focus:border-transparent"
          />
        </div>
      )}

      {showDropdown && products.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white rounded-lg shadow-lg border border-[#F2DFFF] max-h-64 overflow-y-auto">
          {loading && (
            <div className="p-4 text-center text-[#775596]">
              <div className="inline-block w-6 h-6 border-2 border-[#9268AF] border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
          {products.map((product) => (
            <button
              key={product.id ?? product._id ?? product.slug}
              onClick={() => {
                void handleSelect(product);
              }}
              className="w-full flex items-center gap-3 p-3 hover:bg-[#F2DFFF] hover:bg-opacity-50 transition-colors border-b border-[#F2DFFF] last:border-b-0"
            >
              <img
                src={getPrimaryImage(product)}
                alt={product.name}
                className="w-10 h-10 object-cover rounded-lg"
              />
              <div className="flex-1 text-left">
                <p className="font-medium text-[#1E2934BA]">{product.name}</p>
                <p className="text-sm text-[#775596]">
                  {typeof product.price === 'number' ? `$${product.price.toFixed(2)}` : 'N/A'} •{' '}
                  {product.productType ?? 'Unknown'}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {showDropdown && search.length >= 2 && products.length === 0 && !loading && (
        <div className="absolute z-50 w-full mt-2 bg-white rounded-lg shadow-lg border border-[#F2DFFF] p-4 text-center text-[#775596]">
          No products found
        </div>
      )}
    </div>
  );
}
