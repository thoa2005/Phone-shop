'use client';

import Link from 'next/link';
import { Star, ShoppingCart } from 'lucide-react';
import { formatCurrency, getProductImage } from '@/lib/utils';
import { useCartStore } from '@/store/cartStore';
import toast from 'react-hot-toast';

interface ProductCardProps {
  product: {
    id: number;
    name: string;
    slug: string;
    price: number;
    brand?: { name: string };
    images: { imageUrl: string, isPrimary: boolean }[];
  };
  showBrand?: boolean;
}

export default function ProductCard({ product, showBrand = true }: ProductCardProps) {
  const { addToCart } = useCartStore();

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await addToCart(product.id, 1);
      toast.success('Đã thêm sản phẩm vào giỏ hàng');
    } catch (e: any) {
      if (e.response?.status === 401) {
        toast.error('Vui lòng đăng nhập để mua hàng');
      } else {
        toast.error('Lỗi khi thêm vào giỏ hàng');
      }
    }
  };

  const primaryImage = product.images?.find(i => i.isPrimary)?.imageUrl || product.images?.[0]?.imageUrl;

  return (
    <div className="glass-card group overflow-hidden flex flex-col transition-all hover:-translate-y-1 h-full">
      <Link href={`/products/${product.slug}`} className="relative aspect-square p-6 bg-white/5 flex items-center justify-center overflow-hidden">
        {primaryImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img 
            src={getProductImage(primaryImage) || ''} 
            alt={product.name} 
            className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500 ease-out"
          />
        ) : (
          <div className="w-3/4 h-[110%] bg-zinc-800 rounded-2xl border-[3px] border-zinc-700 shadow-xl group-hover:scale-110 transition-transform duration-500" />
        )}
      </Link>
      
      <div className="p-5 flex-1 flex flex-col">
        {showBrand && product.brand && (
          <div className="text-xs text-primary font-medium mb-1 uppercase tracking-wider">{product.brand.name}</div>
        )}
        <Link href={`/products/${product.slug}`} className="text-lg font-bold text-white mb-2 line-clamp-2 hover:text-primary transition-colors">
          {product.name}
        </Link>
        
        <div className="flex items-center space-x-1 mb-4">
          {[...Array(5)].map((_, idx) => (
            <Star key={idx} size={14} className="fill-amber-400 text-amber-400" />
          ))}
          <span className="text-xs text-slate-400 ml-1">(0)</span>
        </div>
        
        <div className="mt-auto flex items-end justify-between">
          <div>
            <div className="text-xl font-bold text-white">{formatCurrency(product.price)}</div>
          </div>
          <button 
            onClick={handleAddToCart}
            className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-colors"
          >
            <ShoppingCart size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
