'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { ChevronDown, Search } from 'lucide-react';
import apiClient from '@/lib/api';
import toast from 'react-hot-toast';
import SearchBar from '@/components/products/SearchBar';
import SidebarFilters from '@/components/products/SidebarFilters';
import ProductCard from '@/components/ProductCard';

interface Product {
  id: number;
  name: string;
  slug: string;
  price: number;
  category: { id: number, name: string };
  brand: { id: number, name: string };
  images: { imageUrl: string, isPrimary: boolean }[];
}

interface Brand {
  id: number;
  name: string;
}

const PRICE_RANGES = [
  { label: 'Tất cả', min: null, max: null },
  { label: 'Dưới 5 triệu', min: 0, max: 5000000 },
  { label: 'Từ 5 - 10 triệu', min: 5000000, max: 10000000 },
  { label: 'Từ 10 - 20 triệu', min: 10000000, max: 20000000 },
  { label: 'Trên 20 triệu', min: 20000000, max: null },
];

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get('search') || '';
  const [products, setProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [selectedPrice, setSelectedPrice] = useState(0); // Index of PRICE_RANGES
  const [sortBy, setSortBy] = useState('id');
  const [direction, setDirection] = useState('desc');
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  const fetchBrands = async () => {
    try {
      const { data } = await apiClient.get('/brands');
      setBrands(data);
    } catch (error) {
      console.error('Lỗi khi tải thương hiệu:', error);
    }
  };

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('size', '50');
      if (searchTerm) params.append('name', searchTerm);
      if (selectedBrand) params.append('brandId', selectedBrand);
      
      const priceRange = PRICE_RANGES[selectedPrice];
      if (priceRange.min !== null) params.append('minPrice', priceRange.min.toString());
      if (priceRange.max !== null) params.append('maxPrice', priceRange.max.toString());
      
      params.append('sortBy', sortBy);
      params.append('direction', direction);

      const { data } = await apiClient.get(`/products?${params.toString()}`);
      setProducts(data.content);
    } catch (error) {
      console.error('Lỗi khi tải sản phẩm:', error);
      toast.error('Lỗi khi tải sản phẩm');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedBrand, selectedPrice, sortBy, direction]);

  useEffect(() => {
    fetchBrands();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts();
    }, 500); // Debounce search
    return () => clearTimeout(timer);
  }, [fetchProducts]);

  return (
    <div className="container mx-auto px-4 py-8 flex flex-col md:flex-row gap-8">
      <SidebarFilters 
        brands={brands}
        priceRanges={PRICE_RANGES}
        selectedBrand={selectedBrand}
        selectedPrice={selectedPrice}
        onBrandChange={setSelectedBrand}
        onPriceChange={setSelectedPrice}
        onClearFilters={() => { setSelectedBrand(null); setSelectedPrice(0); }}
      />

      {/* Main Content */}
      <main className="flex-1">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold text-white">Tất cả điện thoại</h1>
            <p className="text-xs text-slate-500 mt-1">{products.length} sản phẩm được tìm thấy</p>
          </div>
          
          <div className="flex items-center space-x-4 w-full sm:w-auto">
            <SearchBar value={searchTerm} onChange={setSearchTerm} />
            
            <div className="relative">
              <button 
                onClick={() => setShowSortDropdown(!showSortDropdown)}
                className="glass px-4 py-2 rounded-lg flex items-center space-x-2 cursor-pointer border border-border/50 hover:border-primary/50 transition-colors"
              >
                <span className="text-sm text-slate-300">{sortBy === 'id' ? 'Mới nhất' : sortBy === 'price' && direction === 'asc' ? 'Giá thấp nhất' : 'Giá cao nhất'}</span>
                <ChevronDown size={14} className={`text-slate-400 transition-transform ${showSortDropdown ? 'rotate-180' : ''}`} />
              </button>
              
              {showSortDropdown && (
                <div className="absolute right-0 mt-2 w-48 glass-card border border-border/50 z-50 py-2 shadow-2xl animate-fade-in">
                  {[
                    { label: 'Mới nhất', sort: 'id', dir: 'desc' },
                    { label: 'Giá thấp nhất', sort: 'price', dir: 'asc' },
                    { label: 'Giá cao nhất', sort: 'price', dir: 'desc' },
                  ].map((option) => (
                    <button
                      key={option.label}
                      onClick={() => {
                        setSortBy(option.sort);
                        setDirection(option.dir);
                        setShowSortDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-white/5 transition-colors ${sortBy === option.sort && direction === option.dir ? 'text-primary font-bold' : 'text-slate-400'}`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="glass-card aspect-[3/4] animate-pulse">
                <div className="h-2/3 bg-white/5" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-white/10 rounded w-1/4" />
                  <div className="h-5 bg-white/10 rounded w-3/4" />
                  <div className="h-6 bg-white/10 rounded w-1/2 mt-auto" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="glass-card text-center py-20 text-slate-400 flex flex-col items-center">
            <Search size={48} className="text-slate-600 mb-4" />
            <p className="text-lg font-medium text-white mb-2">Không tìm thấy sản phẩm nào</p>
            <p className="text-sm">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm của bạn</p>
            <button 
              onClick={() => {
                setSearchTerm('');
                setSelectedBrand(null);
                setSelectedPrice(0);
              }}
              className="mt-6 text-primary hover:underline"
            >
              Thiết lập lại tất cả bộ lọc
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
