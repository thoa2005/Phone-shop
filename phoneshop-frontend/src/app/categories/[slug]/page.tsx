'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { LayoutGrid, Filter, Search as SearchIcon, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import apiClient from '@/lib/api';
import ProductCard from '@/components/ProductCard';
import toast from 'react-hot-toast';

interface Category {
  id: number;
  name: string;
  slug: string;
  image: string | null;
}

interface Product {
  id: number;
  name: string;
  slug: string;
  price: number;
  category: { id: number, name: string };
  brand: { id: number, name: string };
  images: { imageUrl: string, isPrimary: boolean }[];
}

export default function CategoryDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('id');
  const [direction, setDirection] = useState('desc');

  const fetchCategoryAndProducts = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch category info first
      const { data: catData } = await apiClient.get(`/categories/slug/${slug}`);
      setCategory(catData);

      // Fetch products for this category
      const { data: prodData } = await apiClient.get(`/products`, {
        params: {
          categoryId: catData.id,
          sortBy,
          direction,
          size: 50
        }
      });
      setProducts(prodData.content);
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu:', error);
      toast.error('Không tìm thấy danh mục hoặc lỗi hệ thống');
    } finally {
      setLoading(false);
    }
  }, [slug, sortBy, direction]);

  useEffect(() => {
    fetchCategoryAndProducts();
  }, [fetchCategoryAndProducts]);

  if (!loading && !category) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-white mb-4">Không tìm thấy danh mục</h1>
        <Link href="/categories" className="text-primary hover:underline flex items-center justify-center gap-2">
          <ArrowLeft size={16} /> Quay lại danh sách danh mục
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb & Header */}
      <div className="mb-8">
        <Link href="/categories" className="text-sm text-slate-500 hover:text-primary transition-colors flex items-center gap-1 mb-4">
          <ArrowLeft size={14} /> Tất cả danh mục
        </Link>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="flex items-center gap-6">
            {category?.image && (
              <div className="w-20 h-20 rounded-2xl overflow-hidden glass border border-white/10 hidden sm:block shadow-lg">
                <img src={category.image} alt={category.name} className="w-full h-full object-cover" />
              </div>
            )}
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">{category?.name}</h1>
              <p className="text-slate-400 mt-1 capitalize">Khám phá bộ sưu tập {category?.name} mới nhất</p>
            </div>
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto">
            <select 
              value={`${sortBy}-${direction}`}
              onChange={(e) => {
                const [s, d] = e.target.value.split('-');
                setSortBy(s);
                setDirection(d);
              }}
              className="glass px-4 py-2.5 rounded-xl border border-white/10 text-sm text-slate-300 focus:outline-none focus:border-primary/50 transition-all cursor-pointer w-full md:w-auto"
            >
              <option value="id-desc">Mới nhất</option>
              <option value="price-asc">Giá: Thấp đến Cao</option>
              <option value="price-desc">Giá: Cao đến Thấp</option>
            </select>
          </div>
        </div>
      </div>

      {/* Product Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="glass-card aspect-[3/4] animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="glass-card py-24 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-slate-600 mb-6">
            <LayoutGrid size={32} />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Chưa có sản phẩm nào</h2>
          <p className="text-slate-500 max-w-sm mx-auto">
            Danh mục này hiện chưa được cập nhật sản phẩm. Vui lòng quay lại sau hoặc tham khảo các danh mục khác.
          </p>
          <Link href="/products" className="mt-8 bg-primary hover:bg-primary/80 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-primary/20">
            Xem tất cả sản phẩm
          </Link>
        </div>
      )}
    </div>
  );
}
