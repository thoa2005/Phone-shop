'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Users, ChevronLeft, ChevronRight, ShieldCheck, UserX } from 'lucide-react';
import apiClient from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

export default function AdminUsersPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [users, setUsers] = useState<any[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const fetchUsers = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const { data } = await apiClient.get('/users', { params: { page: p, size: 20 } });
      setUsers(data.content || []);
      setTotalPages(data.totalPages || 0);
      setTotalElements(data.totalElements || 0);
    } catch (error) {
      toast.error('Không thể tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user || user.role !== 'ADMIN') {
      router.push('/');
      return;
    }
    fetchUsers(page);
  }, [user, router, page, fetchUsers]);

  const handleToggleStatus = async (userId: number, currentActive: boolean) => {
    setTogglingId(userId);
    try {
      await apiClient.patch(`/users/${userId}/status`, { isActive: !currentActive });
      toast.success(`Đã ${!currentActive ? 'kích hoạt' : 'vô hiệu hóa'} tài khoản`);
      fetchUsers(page);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Lỗi khi cập nhật trạng thái');
    } finally {
      setTogglingId(null);
    }
  };

  if (!user || user.role !== 'ADMIN') return null;

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex items-center space-x-4 mb-8">
        <Link href="/admin" className="text-slate-400 hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Quản lý Người dùng</h1>
          <p className="text-slate-400 text-sm">Tổng cộng {totalElements} người dùng</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : users.length === 0 ? (
        <div className="glass-card p-12 text-center text-slate-400">
          <Users size={48} className="mx-auto mb-4 text-slate-600" />
          <p>Chưa có người dùng nào.</p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block glass-card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left text-slate-400 text-sm font-medium px-6 py-4">ID</th>
                  <th className="text-left text-slate-400 text-sm font-medium px-6 py-4">Họ tên</th>
                  <th className="text-left text-slate-400 text-sm font-medium px-6 py-4">Email</th>
                  <th className="text-left text-slate-400 text-sm font-medium px-6 py-4">SĐT</th>
                  <th className="text-left text-slate-400 text-sm font-medium px-6 py-4">Vai trò</th>
                  <th className="text-left text-slate-400 text-sm font-medium px-6 py-4">Trạng thái</th>
                  <th className="text-left text-slate-400 text-sm font-medium px-6 py-4">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-border/30 hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 text-slate-500 text-sm">#{u.id}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                          {u.fullName?.charAt(0) || 'U'}
                        </div>
                        <span className="text-white font-medium">{u.fullName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-300 text-sm">{u.email}</td>
                    <td className="px-6 py-4 text-slate-400 text-sm">{u.phone || '—'}</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${u.role === 'ADMIN' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30' : 'bg-slate-500/10 text-slate-400 border border-slate-500/30'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${u.isActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/10 text-red-400 border border-red-500/30'}`}>
                        {u.isActive ? 'Hoạt động' : 'Đã khóa'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {u.role !== 'ADMIN' && (
                        <button
                          onClick={() => handleToggleStatus(u.id, u.isActive)}
                          disabled={togglingId === u.id}
                          className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-all disabled:opacity-50 ${u.isActive ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'}`}
                        >
                          {u.isActive ? 'Khóa' : 'Mở khóa'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-4">
            {users.map((u) => (
              <div key={u.id} className="glass-card p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white font-bold">
                      {u.fullName?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <div className="text-white font-bold">{u.fullName}</div>
                      <div className="text-slate-400 text-xs">{u.email}</div>
                    </div>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${u.isActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                    {u.isActive ? 'Hoạt động' : 'Đã khóa'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${u.role === 'ADMIN' ? 'bg-purple-500/10 text-purple-400' : 'bg-slate-500/10 text-slate-400'}`}>
                    {u.role}
                  </span>
                  {u.role !== 'ADMIN' && (
                    <button
                      onClick={() => handleToggleStatus(u.id, u.isActive)}
                      disabled={togglingId === u.id}
                      className={`text-xs font-medium px-3 py-1.5 rounded-lg ${u.isActive ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}
                    >
                      {u.isActive ? 'Khóa' : 'Mở khóa'}
                    </button>
                  )}
                </div>
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
