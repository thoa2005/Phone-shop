'use client';

import { useState, useEffect } from 'react';
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import apiClient from '@/lib/api';
import Hero from '@/components/home/Hero';
import Features from '@/components/home/Features';
import ProductCard from '@/components/ProductCard';

interface Product {
  id: number;
  name: string;
  slug: string;
  price: number;
  brand: { name: string };
  images: { imageUrl: string, isPrimary: boolean }[];
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const { data } = await apiClient.get('/products?size=4&sortBy=id&direction=desc');
        setProducts(data.content);
      } catch (e) {
        console.error(e);
      }
    };
    fetchTrending();
  }, []);

  return (
    <div className="flex flex-col gap-16 pb-20">
      <Hero />
      <Features />

      {/* Trending Products */}
      <section className="container mx-auto px-4 space-y-10">
        <div className="flex justify-between items-end">
          <div className="space-y-2">
            <h2 className="text-3xl md:text-4xl font-bold text-white">Sản Phẩm <span className="text-primary">Mới Nhất</span></h2>
            <p className="text-slate-400">Những mẫu điện thoại vừa cập bến tại cửa hàng.</p>
          </div>
          <Link href="/products" className="hidden md:flex items-center space-x-2 text-primary hover:text-primary/80 font-medium pb-1">
            <span>Xem tất cả</span>
            <ArrowRight size={16} />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.length > 0 ? products.map((product) => (
            <ProductCard key={product.id} product={product} />
          )) : (
            [1, 2, 3, 4].map(i => (
              <div key={i} className="glass-card aspect-[4/5] animate-pulse">
                <div className="h-1/2 bg-white/5" />
                <div className="p-5 space-y-4">
                  <div className="h-4 bg-white/10 w-1/4 rounded" />
                  <div className="h-6 bg-white/10 w-3/4 rounded" />
                  <div className="h-8 bg-white/10 w-1/2 rounded mt-auto" />
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

