'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Search, Edit, Trash2, Package, ArrowLeft, RefreshCw } from 'lucide-react';
import apiClient from '@/lib/api';
import { formatCurrency, getProductImage } from '@/lib/utils';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';

interface Product {
  id: number;
  name: string;
  slug: string;
  price: number;
  stock: number;
  brand: { name: string };
  category: { name: string };
  isActive: boolean;
  images: { imageUrl: string, isPrimary: boolean }[];
}

export default function AdminProductsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get('/products?size=50');
      setProducts(data.content);
    } catch (error) {
      toast.error('Lỗi khi tải danh sách sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    if (user.role !== 'ADMIN') {
      router.push('/');
      return;
    }
    fetchProducts();
  }, [user, router]);

  const handleDelete = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) return;
    try {
      await apiClient.delete(`/products/${id}`);
      toast.success('Đã xóa sản phẩm');
      fetchProducts();
    } catch (error) {
      toast.error('Lỗi khi xóa sản phẩm');
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.brand.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!user || user.role !== 'ADMIN') return null;

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div className="flex items-center space-x-4">
          <Link href="/admin" className="w-10 h-10 rounded-full glass flex items-center justify-center text-slate-400 hover:text-white transition-all">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white px-2">Quản lý sản phẩm</h1>
            <p className="text-slate-400 px-2 mt-1">Danh sách tất cả điện thoại trong hệ thống</p>
          </div>
        </div>
        
        <Link href="/admin/products/add" className="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg flex items-center space-x-2">
          <Plus size={20} />
          <span>Thêm sản phẩm mới</span>
        </Link>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="p-6 border-b border-border/50 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:w-96">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input 
              type="text" 
              placeholder="Tìm kiếm sản phẩm..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-dark/50 border border-border/50 rounded-lg py-2.5 pl-10 pr-4 text-white focus:ring-1 focus:ring-primary outline-none"
            />
          </div>
          <button onClick={fetchProducts} className="flex items-center space-x-2 text-slate-400 hover:text-white transition-colors">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            <span className="text-sm">Làm mới</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/5 text-slate-400 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold">Sản phẩm</th>
                <th className="px-6 py-4 font-semibold">Thương hiệu</th>
                <th className="px-6 py-4 font-semibold">Danh mục</th>
                <th className="px-6 py-4 font-semibold">Giá</th>
                <th className="px-6 py-4 font-semibold">Kho</th>
                <th className="px-6 py-4 font-semibold">Trạng thái</th>
                <th className="px-6 py-4 font-semibold text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {loading ? (
                [1,2,3].map(i => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={7} className="px-6 py-8"><div className="h-4 bg-white/5 rounded w-full"></div></td>
                  </tr>
                ))
              ) : filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center overflow-hidden">
                          {product.images && product.images.length > 0 ? (
                            <img 
                              src={getProductImage(product.images.find(i => i.isPrimary)?.imageUrl || product.images[0].imageUrl) || ''} 
                              alt="" 
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <Package size={20} className="text-primary" />
                          )}
                        </div>
                        <span className="text-white font-medium line-clamp-1">{product.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-slate-300">{product.brand.name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-slate-300">{product.category.name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-white font-bold">{formatCurrency(product.price)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${product.stock < 10 ? 'bg-amber-500/10 text-amber-500' : 'bg-green-500/10 text-green-500'}`}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${product.isActive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                        {product.isActive ? 'Đang bán' : 'Ngừng bán'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end space-x-2">
                        <Link href={`/admin/products/edit/${product.id}`} className="p-2 text-slate-400 hover:text-primary transition-colors glass rounded-lg">
                          <Edit size={16} />
                        </Link>
                        <button onClick={() => handleDelete(product.id)} className="p-2 text-slate-400 hover:text-red-400 transition-colors glass rounded-lg">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-20 text-slate-500">
                    Không tìm thấy sản phẩm nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
