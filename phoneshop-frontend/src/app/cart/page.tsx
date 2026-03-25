'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Minus, Plus, ShoppingCart, ArrowLeft, Star, ShieldCheck, Truck, RefreshCw } from 'lucide-react';
import apiClient from '@/lib/api';
import { formatCurrency, getProductImage } from '@/lib/utils';
import { useCartStore } from '@/store/cartStore';
import toast from 'react-hot-toast';

export default function CartPage() {
  const { items, totalPrice, updateQuantity, removeItem, fetchCart } = useCartStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCart().finally(() => setLoading(false));
  }, [fetchCart]);

  const handleUpdateQty = async (id: number, currentQty: number, delta: number) => {
    const newQty = currentQty + delta;
    if (newQty < 1) return;
    try {
      await updateQuantity(id, newQty);
    } catch {
      toast.error('Không thể cập nhật số lượng');
    }
  };

  const handleRemove = async (id: number) => {
    try {
      await removeItem(id);
      toast.success('Đã xóa khỏi giỏ hàng');
    } catch {
      toast.error('Lỗi khi xóa sản phẩm');
    }
  };

  if (loading) {
    return <div className="min-h-[60vh] flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
    </div>;
  }

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-6 container mx-auto px-4">
        <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-2">
          <ShoppingCart size={40} />
        </div>
        <h2 className="text-2xl font-bold text-white">Giỏ hàng trống</h2>
        <p className="text-slate-400 text-center max-w-md">Không có sản phẩm nào trong giỏ hàng của bạn. Hãy quay lại cửa hàng để tiếp tục mua sắm.</p>
        <Link href="/products" className="bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg flex items-center space-x-2">
          <ArrowLeft size={18} />
          <span>Tiếp tục mua sắm</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-white mb-8">Giỏ hàng của bạn ({items.length} sản phẩm)</h1>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Cart Items */}
        <div className="flex-1 space-y-4">
          {items.map((item) => (
            <div key={item.id} className="glass-card p-4 sm:p-6 flex flex-col sm:flex-row items-center gap-6">
              <div className="w-24 h-24 sm:w-32 sm:h-32 bg-white/5 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0 p-2">
                {item.productImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={getProductImage(item.productImage) || ''} alt={item.productName} className="object-contain w-full h-full" />
                ) : (
                  <div className="w-16 h-24 bg-zinc-800 rounded-lg border-2 border-zinc-700" />
                )}
              </div>
              
              <div className="flex-1 w-full space-y-3">
                <div className="flex justify-between items-start gap-4">
                  <h3 className="text-lg font-bold text-white leading-tight">{item.productName}</h3>
                  <button 
                    onClick={() => handleRemove(item.id)}
                    className="text-slate-500 hover:text-red-400 text-sm font-medium transition-colors whitespace-nowrap"
                  >
                    Xóa
                  </button>
                </div>
                
                <div className="text-xl font-bold text-primary">{formatCurrency(item.productPrice)}</div>
                
                <div className="flex items-center space-x-4 pt-2">
                  <div className="flex items-center bg-dark/50 border border-border/50 rounded-lg overflow-hidden">
                    <button 
                      onClick={() => handleUpdateQty(item.id, item.quantity, -1)}
                      className="px-3 py-1.5 text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="px-4 py-1.5 text-white font-medium min-w-[3rem] text-center border-x border-border/50">
                      {item.quantity}
                    </span>
                    <button 
                      onClick={() => handleUpdateQty(item.id, item.quantity, 1)}
                      className="px-3 py-1.5 text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  <div className="text-sm text-slate-400">
                    Thành tiền: <span className="text-white font-semibold">{formatCurrency(item.subtotal)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="w-full lg:w-96 flex-shrink-0">
          <div className="glass-card p-6 space-y-6 sticky top-24">
            <h3 className="text-lg font-bold text-white border-b border-border/50 pb-4">Tóm tắt đơn hàng</h3>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-slate-300">
                <span>Tạm tính</span>
                <span className="text-white font-medium">{formatCurrency(totalPrice)}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Phí giao hàng</span>
                <span className="text-accent font-medium">Miễn phí</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Giảm giá</span>
                <span className="text-white font-medium">0 ₫</span>
              </div>
            </div>
            
            <div className="border-t border-border/50 pt-4 pb-6">
              <div className="flex justify-between items-center mb-1">
                <span className="font-medium text-slate-300">Tổng cộng</span>
                <span className="text-2xl font-bold text-primary">{formatCurrency(totalPrice)}</span>
              </div>
              <p className="text-xs text-slate-500 text-right">(Đã bao gồm VAT)</p>
            </div>
            
            <Link 
              href="/checkout"
              className="w-full block text-center bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-primary/25"
            >
              Tiến hành thanh toán
            </Link>

            <div className="space-y-4 pt-4 text-xs text-slate-400">
              <div className="flex items-center space-x-3">
                <ShieldCheck size={18} className="text-primary flex-shrink-0" />
                <span>Bảo mật thanh toán quốc tế</span>
              </div>
              <div className="flex items-center space-x-3">
                <Truck size={18} className="text-primary flex-shrink-0" />
                <span>Giao hàng nhanh toàn quốc</span>
              </div>
              <div className="flex items-center space-x-3">
                <RefreshCw size={18} className="text-primary flex-shrink-0" />
                <span>Đổi trả miễn phí trong 30 ngày</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
