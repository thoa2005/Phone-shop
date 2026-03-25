'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import Link from 'next/link';
import apiClient from '@/lib/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import { getProductImage } from '@/lib/utils';

export default function EditProductPage() {
  const router = useRouter();
  const { id } = useParams();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
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
    primaryImageUrl: ''
  });

  useEffect(() => {
    if (!user) return;
    if (user.role !== 'ADMIN') {
      router.push('/');
      return;
    }

    const fetchData = async () => {
      try {
        const [catRes, brandRes, prodRes] = await Promise.all([
          apiClient.get('/categories'),
          apiClient.get('/brands'),
          apiClient.get(`/products/id/${id}`)
        ]);
        
        const product = prodRes.data;

        if (product) {
          setFormData({
            name: product.name,
            slug: product.slug,
            description: product.description || '',
            categoryId: product.category?.id.toString() || '',
            brandId: product.brand?.id.toString() || '',
            price: product.price.toString(),
            salePrice: product.salePrice ? product.salePrice.toString() : '',
            stock: product.stock.toString(),
            isActive: product.isActive,
            primaryImageUrl: product.images?.find((img: any) => img.isPrimary)?.imageUrl || product.images?.[0]?.imageUrl || ''
          });
        }
        
        setCategories(catRes.data);
        setBrands(brandRes.data);
      } catch (error) {
        toast.error('Lỗi khi tải dữ liệu sản phẩm');
      } finally {
        setFetching(false);
      }
    };
    fetchData();
  }, [user, router, id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
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

      await apiClient.put(`/products/${id}`, payload);
      toast.success('Cập nhật sản phẩm thành công');
      router.push('/admin/products');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lỗi khi cập nhật sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role !== 'ADMIN') return null;
  if (fetching) return <div className="min-h-screen flex items-center justify-center text-white"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center space-x-4 mb-8">
        <Link href="/admin/products" className="w-10 h-10 rounded-full glass flex items-center justify-center text-slate-400 hover:text-white transition-all">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-3xl font-bold text-white">Chỉnh sửa sản phẩm</h1>
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
                className="w-full bg-dark/50 border border-border/50 rounded-lg py-2.5 px-4 text-white focus:ring-1 focus:ring-primary outline-none"
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
            {formData.primaryImageUrl && (
              <div className="mt-2 w-32 h-32 rounded-lg border border-border/50 bg-white/5 p-2 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={getProductImage(formData.primaryImageUrl) || ''} alt="Preview" className="w-full h-full object-contain" />
              </div>
            )}
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
            <span>Cập nhật sản phẩm</span>
          </button>
        </div>
      </form>
    </div>
  );
}
