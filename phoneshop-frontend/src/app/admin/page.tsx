'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Users,
  Package,
  ShoppingCart,
  Activity,
  RefreshCw,
  DollarSign,
  TrendingUp,
  Clock,
  LayoutDashboard
} from "lucide-react";
import apiClient from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

export default function AdminDashboard() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    if (user.role !== 'ADMIN') {
      router.push('/');
      return;
    }

    const fetchStats = async () => {
      try {
        const { data } = await apiClient.get('/users/admin/dashboard');
        setStats(data);
      } catch (error) {
        console.error('Không tải được thống kê admin', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [user, router]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-400">Đang tải dữ liệu...</div>;
  if (!user || user.role !== 'ADMIN') return null;

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Bảng điều khiển Admin</h1>
          <p className="text-slate-400">Tổng quan hoạt động hệ thống cửa hàng PhoneShop</p>
        </div>
        <button onClick={() => window.location.reload()} className="flex items-center space-x-2 text-primary bg-primary/10 hover:bg-primary/20 px-4 py-2 rounded-lg transition-colors">
          <RefreshCw size={16} />
          <span>Làm mới</span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="glass-card p-6 border-l-4 border-l-blue-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-sm font-medium mb-1">Tổng Số Lượng Người Dùng</p>
              <h3 className="text-3xl font-bold text-white">{stats?.totalUsers || 0}</h3>
            </div>
            <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
              <Users size={24} />
            </div>
          </div>
        </div>

        <div className="glass-card p-6 border-l-4 border-l-emerald-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-sm font-medium mb-1">Tổng Số Đơn Hàng</p>
              <h3 className="text-3xl font-bold text-white">{stats?.totalOrders || 0}</h3>
            </div>
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <ShoppingCart size={24} />
            </div>
          </div>
        </div>

        <div className="glass-card p-6 border-l-4 border-l-amber-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-sm font-medium mb-1">Đơn Hàng Chờ Xử Lý</p>
              <h3 className="text-3xl font-bold text-white">{stats?.pendingOrders || 0}</h3>
            </div>
            <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
              <Activity size={24} />
            </div>
          </div>
        </div>

        <div className="glass-card p-6 border-l-4 border-l-purple-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-sm font-medium mb-1">Tổng Số Sản Phẩm</p>
              <h3 className="text-3xl font-bold text-white">{stats?.totalProducts || 0}</h3>
            </div>
            <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500">
              <Package size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Admin Modules Nav */}
      <h2 className="text-xl font-bold text-white mb-6">Chức năng quản lý</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { icon: Package, title: 'Sản phẩm', desc: 'Quản lý kho hàng và danh mục', link: '/admin/products', active: true },
          { icon: ShoppingCart, title: 'Đơn hàng', desc: 'Xử lý và cập nhật trạng thái', link: '/admin/orders', active: true },
          { icon: Users, title: 'Khách hàng', desc: 'Thông tin và tài khoản', link: '/admin/users', active: true },
          { icon: DollarSign, title: 'Mã giảm giá', desc: 'Quản lý coupon khuyến mãi', link: '/admin/coupons', active: true },
        ].map((item, idx) => (
          <Link 
            key={idx} 
            href={item.active ? item.link : '#'} 
            className={`glass-card p-6 transition-all group ${item.active ? 'hover:border-primary/50 hover:bg-white/5 cursor-pointer' : 'cursor-not-allowed opacity-80'}`}
          >
             <div className="flex items-center space-x-4 mb-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${item.active ? 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white' : 'bg-slate-700 text-slate-300'}`}>
                  <item.icon size={20} />
                </div>
                <h3 className="text-lg font-bold text-white">{item.title}</h3>
             </div>
             <p className="text-slate-400 text-sm">{item.desc}</p>
             <div className={`mt-4 text-xs px-2 py-1 inline-block rounded ${item.active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-primary/10 text-primary'}`}>
                {item.active ? 'Sẵn sàng' : 'Đang phát triển'}
             </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
