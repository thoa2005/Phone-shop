'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import apiClient from '@/lib/api';
import { ChevronRight, LayoutGrid } from 'lucide-react';

interface Category {
  id: number;
  name: string;
  slug: string;
  image: string | null;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await apiClient.get('/categories');
        setCategories(data);
      } catch (error) {
        console.error('Lỗi khi tải danh mục:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Danh mục sản phẩm</h1>
          <p className="text-slate-400">Khám phá các dòng sản phẩm theo thương hiệu và phân loại</p>
        </div>
        <div className="flex items-center space-x-2 text-primary font-medium glass px-4 py-2 rounded-lg border-primary/20">
          <LayoutGrid size={20} />
          <span>{categories.length} Danh mục</span>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="glass-card aspect-[4/3] animate-pulse rounded-3xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {categories.map((category) => (
            <Link 
              key={category.id} 
              href={`/categories/${category.slug}`}
              className="group relative aspect-[4/3] rounded-3xl overflow-hidden glass border border-white/5 hover:border-primary/50 transition-all duration-500 shadow-xl"
            >
              {/* Image background with overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent z-10 opacity-80 group-hover:opacity-60 transition-opacity duration-500"></div>
              
              {category.image ? (
                <img 
                  src={category.image} 
                  alt={category.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center text-slate-700">
                   <LayoutGrid size={64} className="opacity-10" />
                </div>
              )}

              {/* Content */}
              <div className="absolute inset-0 z-20 p-8 flex flex-col justify-end">
                <span className="text-xs font-bold text-primary tracking-widest uppercase mb-2 transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                  Khám phá ngay
                </span>
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-white group-hover:text-primary transition-colors duration-300">
                    {category.name}
                  </h2>
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white transform -rotate-45 group-hover:rotate-0 group-hover:bg-primary transition-all duration-500 shadow-lg">
                    <ChevronRight size={20} />
                  </div>
                </div>
              </div>

              {/* Glow effect on hover */}
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-secondary/20 blur opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10"></div>
            </Link>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && categories.length === 0 && (
        <div className="glass-card text-center py-24 text-slate-500">
          <p className="text-xl">Hiện chưa có danh mục sản phẩm nào được cập nhật.</p>
        </div>
      )}
    </div>
  );
}
