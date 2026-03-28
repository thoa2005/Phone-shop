'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Star, ShoppingCart, ShieldCheck, Truck, ArrowRight, Check, Send } from 'lucide-react';
import apiClient from '@/lib/api';
import { formatCurrency, getProductImage } from '@/lib/utils';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface Spec { id: number, specName: string, specValue: string }
interface Image { id: number, imageUrl: string, isPrimary: boolean }
interface Review { id: number, rating: number, comment: string, user: { fullName: string }, createdAt: string }

interface ProductDetail {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  stock: number;
  brand: { id: number, name: string };
  category: { id: number, name: string };
  images: Image[];
  specs: Spec[];
  reviews: Review[];
  averageRating: number | null;
  reviewCount: number;
}

export default function ProductDetailPage() {
  const { slug } = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState<Image | null>(null);
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCartStore();
  const { user } = useAuthStore();

  // Review form state
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewHover, setReviewHover] = useState(0);
  const [submittingReview, setSubmittingReview] = useState(false);

  const fetchProduct = async () => {
    try {
      const { data } = await apiClient.get(`/products/${slug}`);
      setProduct(data);
      if (data.images && data.images.length > 0) {
        setActiveImage(data.images.find((img: Image) => img.isPrimary) || data.images[0]);
      }
    } catch (error) {
      toast.error('Không tìm thấy sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (slug) fetchProduct();
  }, [slug]);

  const handleAddToCart = async () => {
    if (!product) return false;
    if (!user) {
      toast.error('Vui lòng đăng nhập để mua hàng');
      router.push('/auth/login');
      return false;
    }
    try {
      await addToCart(product.id, quantity);
      toast.success('Đã thêm sản phẩm vào giỏ hàng');
      return true;
    } catch (e: any) {
      if (e.response?.status === 401 || e.response?.status === 403) {
        toast.error('Vui lòng đăng nhập để làm điều này');
        router.push('/auth/login');
      } else {
        toast.error('Lỗi khi thêm vào giỏ hàng');
      }
      return false;
    }
  };

  if (loading) {
    return <div className="min-h-[60vh] flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
    </div>;
  }

  if (!product) {
    return <div className="min-h-[60vh] flex items-center justify-center text-slate-400">Không tìm thấy sản phẩm</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 text-sm text-slate-400 mb-8">
        <Link href="/" className="hover:text-white transition-colors">Trang chủ</Link>
        <span>/</span>
        <Link href="/products" className="hover:text-white transition-colors">Sản phẩm</Link>
        <span>/</span>
        <span className="text-primary truncate">{product.name}</span>
      </nav>

      {/* Main product area */}
      <div className="flex flex-col lg:flex-row gap-12 mb-16">

        {/* Images gallery */}
        <div className="w-full lg:w-1/2 flex flex-col md:flex-row gap-4">
          <div className="flex md:flex-col gap-4 overflow-x-auto md:overflow-y-auto md:w-24 order-2 md:order-1 scrollbar-hide py-2">
            {product.images?.map((img) => (
              <button
                key={img.id}
                onClick={() => setActiveImage(img)}
                className={`w-20 h-20 flex-shrink-0 bg-white/5 rounded-xl border-2 transition-all p-2 ${activeImage?.id === img.id ? 'border-primary shadow-lg shadow-primary/20' : 'border-transparent hover:border-slate-600'}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={getProductImage(img.imageUrl) || ''} alt="Thumbnail" className="w-full h-full object-contain" />
              </button>
            ))}
          </div>

          <div className="flex-1 w-full bg-white/5 rounded-3xl flex items-center justify-center p-4 md:p-8 border border-border/50 order-1 md:order-2 overflow-hidden relative">
            {activeImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={getProductImage(activeImage.imageUrl) || ''} alt={product.name} className="w-full h-full object-contain drop-shadow-xl animate-fade-in" />
            ) : (
              <div className="w-3/4 h-3/4 bg-zinc-800 rounded-3xl" />
            )}
          </div>
        </div>

        {/* Product Info */}
        <div className="w-full lg:w-1/2 space-y-8">
          <div>
            <div className="text-secondary font-bold tracking-widest uppercase text-sm mb-2">{product.brand.name}</div>
            <h1 className="text-3xl md:text-5xl font-black text-white leading-tight mb-4">{product.name}</h1>

            <div className="flex items-center space-x-4">
              <div className="flex items-center text-amber-400 space-x-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={18} className={i < (product.averageRating || 5) ? 'fill-current' : 'text-slate-600'} />
                ))}
              </div>
              <span className="text-slate-400 text-sm">{product.reviewCount} đánh giá</span>
              <span className="text-slate-600">•</span>
              <span className="text-accent text-sm flex items-center space-x-1">
                <Check size={16} />
                <span>Còn {product.stock} sản phẩm</span>
              </span>
            </div>
          </div>

          <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
            {formatCurrency(product.price)}
          </div>

          <p className="text-slate-400 leading-relaxed text-lg">
            {product.description || 'Chưa có mô tả chi tiết cho sản phẩm này.'}
          </p>

          <div className="space-y-4 pt-4 border-t border-border/50">
            <div className="flex items-center gap-6">
              <span className="text-slate-300 font-medium">Số lượng:</span>
              <div className="flex items-center bg-dark/50 border border-border/50 rounded-xl overflow-hidden">
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))} 
                  disabled={product.stock === 0 || quantity <= 1}
                  className="px-4 py-3 text-slate-400 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >-</button>
                <span className="px-6 py-3 text-white font-medium border-x border-border/50 bg-white/5">
                  {product.stock === 0 ? 0 : quantity}
                </span>
                <button 
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))} 
                  disabled={product.stock === 0 || quantity >= product.stock}
                  className="px-4 py-3 text-slate-400 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >+</button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mt-6">
              <button
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className="flex-1 bg-white/5 hover:bg-white/10 text-white border border-white/10 font-bold px-8 py-4 rounded-xl transition-all flex items-center justify-center space-x-2 text-lg"
              >
                <ShoppingCart size={22} />
                <span>Thêm vào giỏ</span>
              </button>

              <button
                onClick={async () => {
                  const success = await handleAddToCart();
                  if (success) {
                    router.push('/cart');
                  }
                }}
                disabled={product.stock === 0}
                className="flex-1 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold px-8 py-4 rounded-xl transition-all shadow-lg shadow-primary/25 flex items-center justify-center space-x-2 text-lg hover:-translate-y-1"
              >
                <span>Mua ngay</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-8">
            <div className="glass-card p-4 flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary"><ShieldCheck size={20} /></div>
              <div>
                <div className="text-white font-medium text-sm">Bảo hành 24T</div>
                <div className="text-slate-400 text-xs">Chính hãng 100%</div>
              </div>
            </div>
            <div className="glass-card p-4 flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary"><Truck size={20} /></div>
              <div>
                <div className="text-white font-medium text-sm">Giao miễn phí</div>
                <div className="text-slate-400 text-xs">Trong 2 giờ</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs / Specs & Reviews */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-12">
          {product.specs && product.specs.length > 0 && (
            <section className="glass-card p-8">
              <h2 className="text-2xl font-bold text-white mb-6 border-b border-border/50 pb-4">Thông số kỹ thuật</h2>
              <ul className="space-y-4">
                {product.specs.map((spec, index) => (
                  <li key={spec.id} className={`flex justify-between p-4 rounded-lg ${index % 2 === 0 ? 'bg-white/5' : ''}`}>
                    <span className="text-slate-400">{spec.specName}</span>
                    <span className="text-white font-medium text-right w-1/2">{spec.specValue}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="glass-card p-8">
            <h2 className="text-2xl font-bold text-white mb-6 border-b border-border/50 pb-4">Đánh giá khách hàng</h2>
            {product.reviews && product.reviews.length > 0 ? (
              <div className="space-y-6">
                {product.reviews.map(review => (
                  <div key={review.id} className="border-b border-border/30 pb-6 last:border-0">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white font-bold">
                        {review.user?.fullName?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <div className="text-white font-medium">{review.user?.fullName || 'Người dùng ẩn danh'}</div>
                        <div className="text-slate-500 text-xs">{new Date(review.createdAt).toLocaleDateString('vi-VN')}</div>
                      </div>
                    </div>
                    <div className="flex items-center text-amber-400 space-x-1 mb-3 ml-13">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={14} className={i < review.rating ? 'fill-current' : 'text-slate-600'} />
                      ))}
                    </div>
                    <p className="text-slate-300 ml-13 bg-white/5 p-4 rounded-xl rounded-tl-none">{review.comment}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 py-8 text-center italic">Chưa có đánh giá nào cho sản phẩm này.</p>
            )}

            {/* Review Submission Form */}
            {user ? (
              <div className="mt-8 pt-6 border-t border-border/50">
                <h3 className="text-lg font-bold text-white mb-4">Viết đánh giá của bạn</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-slate-400 block mb-2">Đánh giá sao</label>
                    <div className="flex items-center space-x-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewRating(star)}
                          onMouseEnter={() => setReviewHover(star)}
                          onMouseLeave={() => setReviewHover(0)}
                          className="p-1 transition-transform hover:scale-110"
                        >
                          <Star
                            size={28}
                            className={`transition-colors ${
                              star <= (reviewHover || reviewRating)
                                ? 'text-amber-400 fill-current'
                                : 'text-slate-600'
                            }`}
                          />
                        </button>
                      ))}
                      <span className="text-slate-400 text-sm ml-2">{reviewRating}/5</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-400 block mb-2">Bình luận</label>
                    <textarea
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm này..."
                      rows={4}
                      className="w-full bg-dark border border-border/50 text-white rounded-xl px-4 py-3 focus:ring-1 focus:ring-primary resize-none placeholder:text-slate-600"
                    />
                  </div>
                  <button
                    onClick={async () => {
                      if (!reviewComment.trim()) {
                        toast.error('Vui lòng nhập bình luận');
                        return;
                      }
                      setSubmittingReview(true);
                      try {
                        await apiClient.post('/reviews', {
                          productId: product.id,
                          rating: reviewRating,
                          comment: reviewComment,
                        });
                        toast.success('Đã gửi đánh giá thành công!');
                        setReviewComment('');
                        setReviewRating(5);
                        fetchProduct();
                      } catch (e: any) {
                        toast.error(e.response?.data?.message || 'Lỗi khi gửi đánh giá');
                      } finally {
                        setSubmittingReview(false);
                      }
                    }}
                    disabled={submittingReview}
                    className="flex items-center space-x-2 bg-primary hover:bg-primary/90 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-lg shadow-primary/25 disabled:opacity-50"
                  >
                    <Send size={16} />
                    <span>{submittingReview ? 'Đang gửi...' : 'Gửi đánh giá'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-8 pt-6 border-t border-border/50 text-center">
                <p className="text-slate-400">
                  <Link href="/auth/login" className="text-primary hover:underline">Đăng nhập</Link> để viết đánh giá sản phẩm.
                </p>
              </div>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <div className="glass-card p-6 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 border-primary/20">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
              <Star size={20} className="text-primary" />
              <span>Đặc quyền VIP</span>
            </h3>
            <ul className="space-y-3 text-sm text-slate-300">
              <li className="flex items-center space-x-2">
                <Check size={16} className="text-accent" />
                <span>Trả góp 0% qua thẻ tín dụng</span>
              </li>
              <li className="flex items-center space-x-2">
                <Check size={16} className="text-accent" />
                <span>Gói bảo hành rơi vỡ 12 tháng</span>
              </li>
              <li className="flex items-center space-x-2">
                <Check size={16} className="text-accent" />
                <span>Thu cũ đổi mới trợ giá 2tr</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
