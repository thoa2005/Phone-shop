'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Truck, CheckCircle2, ChevronRight, Tags } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import apiClient from '@/lib/api';
import { formatCurrency, getProductImage } from '@/lib/utils';
import toast from 'react-hot-toast';

interface Address {
  id: number;
  fullName: string;
  phone: string;
  province: string;
  district: string;
  ward: string;
  detail: string;
  isDefault: boolean;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalPrice, fetchCart } = useCartStore();
  
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCart();
    apiClient.get('/addresses').then(res => {
      setAddresses(res.data);
      const defaultAddr = res.data.find((a: Address) => a.isDefault);
      if (defaultAddr) setSelectedAddressId(defaultAddr.id);
      else if (res.data.length > 0) setSelectedAddressId(res.data[0].id);
    }).catch(() => toast.error('Không thể tải địa chỉ'));
  }, [fetchCart]);

  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    try {
      const { data } = await apiClient.post('/coupons/validate', { code: couponCode });
      if (totalPrice < data.minOrder) {
        toast.error(`Đơn hàng phải từ ${formatCurrency(data.minOrder)} để áp dụng mã này`);
        return;
      }
      setAppliedCoupon(data);
      toast.success('Áp dụng mã giảm giá thành công');
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Mã giảm giá không hợp lệ');
      setAppliedCoupon(null);
    }
  };

  const calculateDiscount = () => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.type === 'PERCENTAGE') {
      return (totalPrice * appliedCoupon.value) / 100;
    }
    return appliedCoupon.value; // FIXED_AMOUNT
  };

  const handleCheckout = async () => {
    if (!selectedAddressId) {
      toast.error('Vui lòng chọn hoặc thêm địa chỉ giao hàng');
      return;
    }
    setLoading(true);
    try {
      const { data: order } = await apiClient.post('/orders', {
        addressId: selectedAddressId,
        couponCode: appliedCoupon?.code,
        paymentMethod,
        note: ''
      });

      if (paymentMethod === 'VNPAY') {
        // Request VNPay payment URL and redirect
        const { data: payment } = await apiClient.post('/payment/vnpay/create', {
          orderId: order.id,
        });
        window.location.href = payment.paymentUrl;
        return;
      }

      toast.success('Đặt hàng thành công!');
      fetchCart();
      router.push('/orders');
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Lỗi khi đặt hàng');
    } finally {
        setLoading(false);
    }
  };

  if (items.length === 0) return <div className="min-h-[60vh] flex items-center justify-center">Chưa có sản phẩm để thanh toán.</div>;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <h1 className="text-2xl font-bold text-white mb-8">Thanh toán an toàn</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Col - Address & Payment */}
        <div className="lg:col-span-7 space-y-6">
          
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center">
              <span className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center mr-3 text-sm">1</span>
              Địa chỉ giao hàng
            </h2>
            
            {addresses.length === 0 ? (
              <div className="text-slate-400 p-4 border border-dashed border-border rounded-lg text-center">
                Bạn chưa có địa chỉ nào. <button className="text-primary hover:underline" onClick={() => router.push('/profile')}>Thêm địa chỉ mới tại trang Cá nhân</button>
              </div>
            ) : (
              <div className="space-y-4">
                {addresses.map(addr => (
                  <label key={addr.id} onClick={() => setSelectedAddressId(addr.id)} className={`flex p-4 rounded-xl cursor-pointer border-2 transition-all ${selectedAddressId === addr.id ? 'border-primary bg-primary/5' : 'border-border/50 bg-white/5 hover:border-slate-500'}`}>
                    <div className="flex-shrink-0 mt-1">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedAddressId === addr.id ? 'border-primary' : 'border-slate-500'}`}>
                        {selectedAddressId === addr.id && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-white font-medium">{addr.fullName}</span>
                        <span className="text-slate-400">|</span>
                        <span className="text-slate-300 font-medium">{addr.phone}</span>
                        {addr.isDefault && <span className="text-[10px] bg-secondary text-white px-2 py-0.5 rounded uppercase font-bold">Mặc định</span>}
                      </div>
                      <div className="text-slate-400 text-sm mt-1">
                        {addr.detail}, {addr.ward}, {addr.district}, {addr.province}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="glass-card p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center">
              <span className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center mr-3 text-sm">2</span>
              Phương thức thanh toán
            </h2>
            
            <div className="space-y-4">
              <label onClick={() => setPaymentMethod('COD')} className={`flex p-4 rounded-xl cursor-pointer border-2 transition-all ${paymentMethod === 'COD' ? 'border-primary bg-primary/5' : 'border-border/50 bg-white/5 hover:border-slate-500'}`}>
                <div className="flex-shrink-0 mt-1 mr-4">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'COD' ? 'border-primary' : 'border-slate-500'}`}>
                    {paymentMethod === 'COD' && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                  </div>
                </div>
                <div>
                  <div className="text-white font-medium">Thanh toán khi nhận hàng (COD)</div>
                  <div className="text-slate-400 text-sm mt-1">Thanh toán bằng tiền mặt khi đơn hàng được giao tới.</div>
                </div>
              </label>
              
              <label onClick={() => setPaymentMethod('VNPAY')} className={`flex p-4 rounded-xl cursor-pointer border-2 transition-all ${paymentMethod === 'VNPAY' ? 'border-primary bg-primary/5' : 'border-border/50 bg-white/5 hover:border-slate-500'}`}>
                <div className="flex-shrink-0 mt-1 mr-4">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'VNPAY' ? 'border-primary' : 'border-slate-500'}`}>
                    {paymentMethod === 'VNPAY' && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                  </div>
                </div>
                <div>
                  <div className="text-white font-medium flex items-center space-x-2">
                    <span>Thanh toán qua VNPay</span>
                    <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded font-bold">ONLINE</span>
                  </div>
                  <div className="text-slate-400 text-sm mt-1">Thanh toán an toàn qua cổng VNPay (ATM, Visa, MasterCard, QR Code).</div>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Right Col - Order Summary */}
        <div className="lg:col-span-5">
          <div className="glass-card p-6 sticky top-24">
            <h2 className="text-lg font-bold text-white mb-4 border-b border-border/50 pb-4">Thông tin đơn hàng</h2>
            
            <div className="space-y-4 mb-6 max-h-[300px] overflow-y-auto pr-2 scrollbar-hide">
              {items.map(item => (
                <div key={item.id} className="flex justify-between items-start gap-4">
                  <div className="flex gap-3">
                    <div className="w-16 h-16 bg-white/5 rounded-lg flex items-center justify-center p-1 relative border border-border/50">
                       <div className="absolute -top-2 -right-2 bg-slate-600 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold z-10">{item.quantity}</div>
                       {/* eslint-disable-next-line @next/next/no-img-element */}
                       {item.productImage && <img src={getProductImage(item.productImage) || ''} alt={item.productName} className="object-contain w-full h-full" />}
                    </div>
                    <div>
                      <div className="text-white font-medium text-sm line-clamp-2">{item.productName}</div>
                      <div className="text-slate-400 text-xs mt-1">{formatCurrency(item.productPrice)}</div>
                    </div>
                  </div>
                  <div className="text-white font-medium text-sm text-right whitespace-nowrap">
                    {formatCurrency(item.subtotal)}
                  </div>
                </div>
              ))}
            </div>

            {/* Coupon */}
            <div className="border-t border-border/50 pt-4 mb-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tags size={16} className="absolute left-3 top-1/2 -transform-translate-y-1/2 text-slate-500" />
                  <input 
                    type="text" 
                    placeholder="Mã giảm giá..." 
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    className="w-full bg-dark border border-border/50 text-white rounded-lg py-2 pl-9 pr-4 text-sm focus:ring-1 focus:ring-primary uppercase"
                  />
                </div>
                <button 
                  onClick={handleApplyCoupon}
                  className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Áp dụng
                </button>
              </div>
              {appliedCoupon && (
                <div className="mt-2 text-primary text-sm flex items-center justify-between bg-primary/10 px-3 py-2 rounded-lg">
                  <div className="flex items-center space-x-1"><CheckCircle2 size={14} /> <span>Đã áp dụng mã {appliedCoupon.code}</span></div>
                  <button onClick={() => setAppliedCoupon(null)} className="text-slate-400 hover:text-red-400 text-xs">Xóa</button>
                </div>
              )}
            </div>

            <div className="space-y-3 pt-4 border-t border-border/50 text-sm">
              <div className="flex justify-between text-slate-300">
                <span>Tạm tính</span>
                <span>{formatCurrency(totalPrice)}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Phí vận chuyển</span>
                <span className="text-accent">Miễn phí</span>
              </div>
              {appliedCoupon && (
                <div className="flex justify-between text-primary">
                  <span>Giảm giá</span>
                  <span>-{formatCurrency(calculateDiscount())}</span>
                </div>
              )}
            </div>
            
            <div className="border-t border-border/50 pt-4 mt-4 mb-6">
              <div className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-border/30">
                <span className="font-bold text-white text-lg">Khách phải trả</span>
                <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                  {formatCurrency(totalPrice - calculateDiscount())}
                </span>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white font-bold py-4 rounded-xl flex items-center justify-center space-x-2 shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all group"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Đặt Hàng Ngay</span>
                  <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
