'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Tags, Plus, X, Pencil, Trash2 } from 'lucide-react';
import apiClient from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

interface Coupon {
  id: number;
  code: string;
  type: string;
  value: number;
  minOrder: number;
  maxUses: number;
  usedCount: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

const emptyCoupon = {
  code: '',
  type: 'PERCENT',
  value: 0,
  minOrder: 0,
  maxUses: 100,
  startDate: '',
  endDate: '',
  isActive: true,
};

export default function AdminCouponsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyCoupon);
  const [submitting, setSubmitting] = useState(false);

  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get('/coupons');
      setCoupons(data);
    } catch (error) {
      toast.error('Không thể tải danh sách mã giảm giá');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user || user.role !== 'ADMIN') {
      router.push('/');
      return;
    }
    fetchCoupons();
  }, [user, router, fetchCoupons]);

  const handleEdit = (coupon: Coupon) => {
    setEditingId(coupon.id);
    setForm({
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      minOrder: coupon.minOrder || 0,
      maxUses: coupon.maxUses || 100,
      startDate: coupon.startDate || '',
      endDate: coupon.endDate || '',
      isActive: coupon.isActive,
    });
    setShowForm(true);
  };

  const handleCreate = () => {
    setEditingId(null);
    setForm(emptyCoupon);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code) {
      toast.error('Vui lòng nhập mã coupon');
      return;
    }
    setSubmitting(true);
    try {
      if (editingId) {
        await apiClient.put(`/coupons/${editingId}`, form);
        toast.success('Đã cập nhật mã giảm giá');
      } else {
        await apiClient.post('/coupons', form);
        toast.success('Đã tạo mã giảm giá mới');
      }
      setShowForm(false);
      setEditingId(null);
      setForm(emptyCoupon);
      fetchCoupons();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Lỗi khi lưu mã giảm giá');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Bạn có chắc muốn xóa mã giảm giá này?')) return;
    try {
      await apiClient.delete(`/coupons/${id}`);
      toast.success('Đã xóa mã giảm giá');
      fetchCoupons();
    } catch {
      toast.error('Lỗi khi xóa mã giảm giá');
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
            <h1 className="text-2xl font-bold text-white">Quản lý Mã giảm giá</h1>
            <p className="text-slate-400 text-sm">Tổng cộng {coupons.length} mã</p>
          </div>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center space-x-2 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-primary/25"
        >
          <Plus size={18} />
          <span>Tạo mới</span>
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card p-8 w-full max-w-lg relative">
            <button onClick={() => { setShowForm(false); setEditingId(null); }} className="absolute top-4 right-4 text-slate-400 hover:text-white">
              <X size={20} />
            </button>
            <h2 className="text-xl font-bold text-white mb-6">{editingId ? 'Chỉnh sửa mã giảm giá' : 'Tạo mã giảm giá mới'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-400 block mb-1">Mã coupon</label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  disabled={!!editingId}
                  className="w-full bg-dark border border-border/50 text-white rounded-lg px-4 py-2.5 focus:ring-1 focus:ring-primary uppercase disabled:opacity-50"
                  placeholder="VD: SALE50"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-400 block mb-1">Loại giảm</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full bg-dark border border-border/50 text-white rounded-lg px-4 py-2.5 focus:ring-1 focus:ring-primary"
                  >
                    <option value="PERCENT">Phần trăm (%)</option>
                    <option value="FIXED">Số tiền cố định (₫)</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-400 block mb-1">Giá trị</label>
                  <input
                    type="number"
                    value={form.value}
                    onChange={(e) => setForm({ ...form, value: Number(e.target.value) })}
                    className="w-full bg-dark border border-border/50 text-white rounded-lg px-4 py-2.5 focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-400 block mb-1">Đơn hàng tối thiểu</label>
                  <input
                    type="number"
                    value={form.minOrder}
                    onChange={(e) => setForm({ ...form, minOrder: Number(e.target.value) })}
                    className="w-full bg-dark border border-border/50 text-white rounded-lg px-4 py-2.5 focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-400 block mb-1">Số lần sử dụng tối đa</label>
                  <input
                    type="number"
                    value={form.maxUses}
                    onChange={(e) => setForm({ ...form, maxUses: Number(e.target.value) })}
                    className="w-full bg-dark border border-border/50 text-white rounded-lg px-4 py-2.5 focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-400 block mb-1">Ngày bắt đầu</label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className="w-full bg-dark border border-border/50 text-white rounded-lg px-4 py-2.5 focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-400 block mb-1">Ngày kết thúc</label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    className="w-full bg-dark border border-border/50 text-white rounded-lg px-4 py-2.5 focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="w-4 h-4 rounded border-border/50 bg-dark accent-primary"
                />
                <label htmlFor="isActive" className="text-sm text-slate-300">Kích hoạt ngay</label>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-primary/25 disabled:opacity-50"
              >
                {submitting ? 'Đang lưu...' : (editingId ? 'Cập nhật' : 'Tạo mới')}
              </button>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : coupons.length === 0 ? (
        <div className="glass-card p-12 text-center text-slate-400">
          <Tags size={48} className="mx-auto mb-4 text-slate-600" />
          <p>Chưa có mã giảm giá nào.</p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block glass-card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left text-slate-400 text-sm font-medium px-6 py-4">Mã</th>
                  <th className="text-left text-slate-400 text-sm font-medium px-6 py-4">Loại</th>
                  <th className="text-left text-slate-400 text-sm font-medium px-6 py-4">Giá trị</th>
                  <th className="text-left text-slate-400 text-sm font-medium px-6 py-4">Đơn tối thiểu</th>
                  <th className="text-left text-slate-400 text-sm font-medium px-6 py-4">Sử dụng</th>
                  <th className="text-left text-slate-400 text-sm font-medium px-6 py-4">Thời hạn</th>
                  <th className="text-left text-slate-400 text-sm font-medium px-6 py-4">Trạng thái</th>
                  <th className="text-left text-slate-400 text-sm font-medium px-6 py-4">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((coupon) => (
                  <tr key={coupon.id} className="border-b border-border/30 hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-primary font-bold font-mono">{coupon.code}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-slate-300 text-sm">{coupon.type === 'PERCENT' ? 'Phần trăm' : 'Cố định'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-white font-bold">
                        {coupon.type === 'PERCENT' ? `${coupon.value}%` : `${coupon.value.toLocaleString('vi-VN')}₫`}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-sm">
                      {coupon.minOrder ? `${coupon.minOrder.toLocaleString('vi-VN')}₫` : '—'}
                    </td>
                    <td className="px-6 py-4 text-slate-300 text-sm">
                      {coupon.usedCount || 0} / {coupon.maxUses || '∞'}
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-xs">
                      {coupon.startDate || '—'} → {coupon.endDate || '—'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${coupon.isActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/10 text-red-400 border border-red-500/30'}`}>
                        {coupon.isActive ? 'Hoạt động' : 'Tắt'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button onClick={() => handleEdit(coupon)} className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => handleDelete(coupon.id)} className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-4">
            {coupons.map((coupon) => (
              <div key={coupon.id} className="glass-card p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-primary font-bold font-mono text-lg">{coupon.code}</span>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${coupon.isActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                    {coupon.isActive ? 'Hoạt động' : 'Tắt'}
                  </span>
                </div>
                <div className="text-white font-bold text-lg">
                  {coupon.type === 'PERCENT' ? `Giảm ${coupon.value}%` : `Giảm ${coupon.value.toLocaleString('vi-VN')}₫`}
                </div>
                <div className="text-slate-400 text-sm">Đã dùng: {coupon.usedCount || 0} / {coupon.maxUses || '∞'}</div>
                <div className="flex space-x-2">
                  <button onClick={() => handleEdit(coupon)} className="flex-1 py-2 rounded-lg bg-blue-500/10 text-blue-400 text-sm font-medium">Sửa</button>
                  <button onClick={() => handleDelete(coupon.id)} className="flex-1 py-2 rounded-lg bg-red-500/10 text-red-400 text-sm font-medium">Xóa</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
