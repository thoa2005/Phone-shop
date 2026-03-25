'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, X, Loader2 } from 'lucide-react';
import Link from 'next/link';
import apiClient from '@/lib/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';

export default function AddProductPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    categoryId: '',
    brandId: '',
    price: '',
    salePrice: '',
    stock: '',
    isActive: true,
    primaryImageUrl: '',
    imageUrls: [] as string[]
  });

  useEffect(() => {
    if (!user) return;
    if (user.role !== 'ADMIN') {
      router.push('/');
      return;
    }

    const fetchData = async () => {
      try {
        const [catRes, brandRes] = await Promise.all([
          apiClient.get('/categories'),
          apiClient.get('/brands')
        ]);
        setCategories(catRes.data);
        setBrands(brandRes.data);
      } catch (error) {
        toast.error('Lỗi khi tải dữ liệu ban đầu');
      }
    };
    fetchData();
  }, [user, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const generateSlug = () => {
    const slug = formData.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[đĐ]/g, 'd')
      .replace(/([^0-9a-z-\s])/g, '')
      .replace(/(\s+)/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
    setFormData(prev => ({ ...prev, slug }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        price: Number(formData.price),
        salePrice: formData.salePrice ? Number(formData.salePrice) : null,
        stock: Number(formData.stock),
        categoryId: Number(formData.categoryId),
        brandId: Number(formData.brandId),
        imageUrls: formData.primaryImageUrl ? [formData.primaryImageUrl] : []
      };

      await apiClient.post('/products', payload);
      toast.success('Thêm sản phẩm thành công');
      router.push('/admin/products');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lỗi khi thêm sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role !== 'ADMIN') return null;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center space-x-4 mb-8">
        <Link href="/admin/products" className="w-10 h-10 rounded-full glass flex items-center justify-center text-slate-400 hover:text-white transition-all">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-3xl font-bold text-white">Thêm sản phẩm mới</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="glass-card p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400">Tên sản phẩm</label>
              <input
                required
                name="name"
                value={formData.name}
                onChange={handleChange}
                onBlur={generateSlug}
                className="w-full bg-dark/50 border border-border/50 rounded-lg py-2.5 px-4 text-white focus:ring-1 focus:ring-primary outline-none"
                placeholder="Ví dụ: iPhone 15 Pro Max"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400">Slug (URL)</label>
              <input
                required
                name="slug"
                value={formData.slug}
                onChange={handleChange}
                className="w-full bg-dark/50 border border-border/50 rounded-lg py-2.5 px-4 text-white focus:ring-1 focus:ring-primary outline-none"
                placeholder="iphone-15-pro-max"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400">Danh mục</label>
              <select
                required
                name="categoryId"
                value={formData.categoryId}
                onChange={handleChange}
                className="w-full bg-dark/50 border border-border/50 rounded-lg py-2.5 px-4 text-white focus:ring-1 focus:ring-primary outline-none"
              >
                <option value="">Chọn danh mục</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400">Thương hiệu</label>
              <select
                required
                name="brandId"
                value={formData.brandId}
                onChange={handleChange}
                className="w-full bg-dark/50 border border-border/50 rounded-lg py-2.5 px-4 text-white focus:ring-1 focus:ring-primary outline-none"
              >
                <option value="">Chọn thương hiệu</option>
                {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400">Giá bán (VNĐ)</label>
              <input
                required
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                className="w-full bg-dark/50 border border-border/50 rounded-lg py-2.5 px-4 text-white focus:ring-1 focus:ring-primary outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400">Giá khuyến mãi (VNĐ)</label>
              <input
                type="number"
                name="salePrice"
                value={formData.salePrice}
                onChange={handleChange}
                className="w-full bg-dark/50 border border-border/50 rounded-lg py-2.5 px-4 text-white focus:ring-1 focus:ring-primary outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400">Số lượng kho</label>
              <input
                required
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleChange}
                className="w-full bg-dark/50 border border-border/50 rounded-lg py-2.5 px-4 text-white focus:ring-1 focus:ring-primary outline-none"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-400">Link hình ảnh chính</label>
            <input
              name="primaryImageUrl"
              value={formData.primaryImageUrl}
              onChange={handleChange}
              className="w-full bg-dark/50 border border-border/50 rounded-lg py-2.5 px-4 text-white focus:ring-1 focus:ring-primary outline-none"
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-400">Mô tả sản phẩm</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={5}
              className="w-full bg-dark/50 border border-border/50 rounded-lg py-2.5 px-4 text-white focus:ring-1 focus:ring-primary outline-none resize-none"
            />
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="isActive"
              name="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
              className="w-5 h-5 rounded border-border bg-dark/50 text-primary focus:ring-primary"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-white">Kích hoạt bán sản phẩm</label>
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <Link href="/admin/products" className="px-6 py-3 rounded-xl font-bold glass text-slate-400 hover:text-white transition-all">
            Hủy bỏ
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg flex items-center space-x-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
            <span>Lưu sản phẩm</span>
          </button>
        </div>
      </form>
    </div>
  );
}
