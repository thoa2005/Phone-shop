'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Package, ChevronLeft, ChevronRight, Search, Filter } from 'lucide-react';
import apiClient from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

const statusMap: Record<string, string> = {
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  SHIPPING: 'Đang giao hàng',
  DELIVERED: 'Giao thành công',
  CANCELLED: 'Đã hủy',
  RETURNED: 'Trả hàng',
};

const statusColors: Record<string, string> = {
  PENDING: 'bg-amber-500/10 text-amber-500 border-amber-500/30',
  CONFIRMED: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
  SHIPPING: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/30',
  DELIVERED: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30',
  CANCELLED: 'bg-red-500/10 text-red-500 border-red-500/30',
  RETURNED: 'bg-orange-500/10 text-orange-500 border-orange-500/30',
};

const statusOptions = ['PENDING', 'CONFIRMED', 'SHIPPING', 'DELIVERED', 'CANCELLED', 'RETURNED'];

export default function AdminOrdersPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [orders, setOrders] = useState<any[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const fetchOrders = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const { data } = await apiClient.get('/orders/admin/all', { params: { page: p, size: 10 } });
      setOrders(data.content || []);
      setTotalPages(data.totalPages || 0);
      setTotalElements(data.totalElements || 0);
    } catch (error) {
      toast.error('Không thể tải danh sách đơn hàng');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user || user.role !== 'ADMIN') {
      router.push('/');
      return;
    }
    fetchOrders(page);
  }, [user, router, page, fetchOrders]);

  const handleStatusChange = async (orderId: number, newStatus: string) => {
    setUpdatingId(orderId);
    try {
      await apiClient.patch(`/orders/${orderId}/status`, { status: newStatus });
      toast.success(`Đã cập nhật trạng thái đơn #${orderId}`);
      fetchOrders(page);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Lỗi khi cập nhật trạng thái');
    } finally {
      setUpdatingId(null);
    }
  };

  if (!user || user.role !== 'ADMIN') return null;

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Link href="/admin" className="text-slate-400 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Quản lý Đơn hàng</h1>
            <p className="text-slate-400 text-sm">Tổng cộng {totalElements} đơn hàng</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : orders.length === 0 ? (
        <div className="glass-card p-12 text-center text-slate-400">
          <Package size={48} className="mx-auto mb-4 text-slate-600" />
          <p>Chưa có đơn hàng nào.</p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block glass-card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left text-slate-400 text-sm font-medium px-6 py-4">Mã đơn</th>
                  <th className="text-left text-slate-400 text-sm font-medium px-6 py-4">Khách hàng</th>
                  <th className="text-left text-slate-400 text-sm font-medium px-6 py-4">Sản phẩm</th>
                  <th className="text-left text-slate-400 text-sm font-medium px-6 py-4">Tổng tiền</th>
                  <th className="text-left text-slate-400 text-sm font-medium px-6 py-4">Ngày tạo</th>
                  <th className="text-left text-slate-400 text-sm font-medium px-6 py-4">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b border-border/30 hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-white font-bold">#{order.id}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-white text-sm">{order.user?.fullName || '—'}</div>
                      <div className="text-slate-500 text-xs">{order.user?.email || ''}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-slate-300 text-sm">{order.items?.length || 0} sản phẩm</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-primary font-bold">{formatCurrency(order.finalPrice)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-slate-400 text-sm">{formatDate(order.createdAt)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        disabled={updatingId === order.id || order.status === 'DELIVERED' || order.status === 'CANCELLED'}
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg border cursor-pointer bg-transparent focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed ${statusColors[order.status] || ''}`}
                      >
                        {statusOptions.map((s) => (
                          <option key={s} value={s} className="bg-[#1a1a2e] text-white">
                            {statusMap[s]}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="glass-card p-5 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-white font-bold text-lg">#{order.id}</span>
                    <div className="text-slate-400 text-sm mt-1">{formatDate(order.createdAt)}</div>
                  </div>
                  <select
                    value={order.status}
                    onChange={(e) => handleStatusChange(order.id, e.target.value)}
                    disabled={updatingId === order.id || order.status === 'DELIVERED' || order.status === 'CANCELLED'}
                    className={`text-xs font-bold px-3 py-1.5 rounded-lg border cursor-pointer bg-transparent focus:outline-none disabled:opacity-50 ${statusColors[order.status] || ''}`}
                  >
                    {statusOptions.map((s) => (
                      <option key={s} value={s} className="bg-[#1a1a2e] text-white">
                        {statusMap[s]}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="text-sm text-slate-300">{order.user?.fullName} — {order.items?.length || 0} sản phẩm</div>
                <div className="text-primary font-bold text-lg">{formatCurrency(order.finalPrice)}</div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center space-x-4 mt-8">
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="p-2 rounded-lg glass-card hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={20} className="text-slate-300" />
              </button>
              <span className="text-slate-400 text-sm">
                Trang <span className="text-white font-bold">{page + 1}</span> / {totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1}
                className="p-2 rounded-lg glass-card hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={20} className="text-slate-300" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
