import { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api';
import { Search, X } from 'lucide-react';

interface Product {
  _id: string;
  name: string;
  images?: { url: string; isPrimary: boolean }[];
  price: number;
  productType: string;
}

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

  const fetchProducts = async (query: string) => {
    try {
      setLoading(true);
      const response = await api.getProducts({ search: query, limit: 10 });
      if (response.success) {
        setProducts(response.data.products || []);
        setShowDropdown(true);
      }
    } catch (error) {
      console.error('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (product: Product) => {
    onSelect(product);
    setSearch('');
    setShowDropdown(false);
  };

  const handleClear = () => {
    onSelect(null);
    setSearch('');
    setProducts([]);
  };

  const getPrimaryImage = (product: Product) => {
    const primary = product.images?.find((img) => img.isPrimary);
    return primary?.url || product.images?.[0]?.url || 'https://via.placeholder.com/40';
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
              ${selectedProduct.price.toFixed(2)} • {selectedProduct.productType}
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
              key={product._id}
              onClick={() => handleSelect(product)}
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
                  ${product.price.toFixed(2)} • {product.productType}
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
