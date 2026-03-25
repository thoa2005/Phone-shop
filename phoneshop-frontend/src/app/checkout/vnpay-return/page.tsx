'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import apiClient from '@/lib/api';
import { useCartStore } from '@/store/cartStore';
import Link from 'next/link';

export default function VNPayReturnPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { fetchCart } = useCartStore();
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');
  const [orderId, setOrderId] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        // Forward all VNPay params to the backend for verification
        const params = new URLSearchParams();
        searchParams.forEach((value, key) => {
          params.append(key, value);
        });

        const { data } = await apiClient.get(`/payment/vnpay/return?${params.toString()}`);
        
        setOrderId(data.orderId?.toString() || null);
        setMessage(data.message || '');
        
        if (data.success) {
          setStatus('success');
          fetchCart(); // Clear cart
        } else {
          setStatus('failed');
        }
      } catch (error) {
        setStatus('failed');
        setMessage('Không thể xác minh thanh toán');
      }
    };

    verifyPayment();
  }, [searchParams, fetchCart]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="glass-card p-10 max-w-md w-full text-center">
        {status === 'loading' && (
          <>
            <Loader2 size={56} className="mx-auto text-primary animate-spin mb-6" />
            <h1 className="text-2xl font-bold text-white mb-2">Đang xử lý thanh toán...</h1>
            <p className="text-slate-400">Vui lòng chờ trong giây lát</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={48} className="text-emerald-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Thanh toán thành công!</h1>
            <p className="text-slate-400 mb-2">{message}</p>
            {orderId && <p className="text-slate-500 text-sm mb-8">Mã đơn hàng: <span className="text-primary font-bold">#{orderId}</span></p>}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/orders" className="bg-primary hover:bg-primary/90 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-lg shadow-primary/25">
                Xem đơn hàng
              </Link>
              <Link href="/products" className="glass border-white/10 hover:bg-white/5 text-white font-medium px-6 py-3 rounded-xl transition-all">
                Tiếp tục mua sắm
              </Link>
            </div>
          </>
        )}

        {status === 'failed' && (
          <>
            <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
              <XCircle size={48} className="text-red-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Thanh toán thất bại</h1>
            <p className="text-slate-400 mb-8">{message || 'Đã xảy ra lỗi trong quá trình thanh toán.'}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/orders" className="bg-primary hover:bg-primary/90 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-lg shadow-primary/25">
                Xem đơn hàng
              </Link>
              <Link href="/cart" className="glass border-white/10 hover:bg-white/5 text-white font-medium px-6 py-3 rounded-xl transition-all">
                Quay về giỏ hàng
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
