'use client';

import { useState, useEffect } from 'react';
import { Package, User, MapPin, Plus, X, Pencil, Trash2, Save, Check } from 'lucide-react';
import apiClient from '@/lib/api';
import { formatCurrency, formatDate, getProductImage } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
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

const emptyAddress = { fullName: '', phone: '', province: '', district: '', ward: '', detail: '', isDefault: false };

export default function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'orders' | 'info' | 'addresses'>('orders');
  const [orders, setOrders] = useState<any[]>([]);

  // Profile edit
  const [editing, setEditing] = useState(false);
  const [profileForm, setProfileForm] = useState({ fullName: '', phone: '' });
  const [savingProfile, setSavingProfile] = useState(false);

  // Addresses
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [showAddrForm, setShowAddrForm] = useState(false);
  const [addrForm, setAddrForm] = useState(emptyAddress);
  const [editingAddrId, setEditingAddrId] = useState<number | null>(null);
  const [savingAddr, setSavingAddr] = useState(false);

  useEffect(() => {
    if (activeTab === 'orders') {
      apiClient.get('/orders?sort=id,desc&size=100').then(res => setOrders(res.data.content || [])).catch(console.error);
    } else if (activeTab === 'addresses') {
      fetchAddresses();
    }
  }, [activeTab]);

  useEffect(() => {
    if (user) {
      setProfileForm({ fullName: user.fullName || '', phone: user.phone || '' });
    }
  }, [user]);

  const fetchAddresses = () => {
    apiClient.get('/addresses').then(res => setAddresses(res.data)).catch(() => toast.error('Không thể tải địa chỉ'));
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      const { data } = await apiClient.put('/users/me', profileForm);
      setUser(data);
      setEditing(false);
      toast.success('Cập nhật thông tin thành công');
    } catch {
      toast.error('Lỗi khi cập nhật thông tin');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleCreateAddress = () => {
    setEditingAddrId(null);
    setAddrForm(emptyAddress);
    setShowAddrForm(true);
  };

  const handleEditAddress = (addr: Address) => {
    setEditingAddrId(addr.id);
    setAddrForm({
      fullName: addr.fullName,
      phone: addr.phone,
      province: addr.province,
      district: addr.district,
      ward: addr.ward,
      detail: addr.detail,
      isDefault: addr.isDefault,
    });
    setShowAddrForm(true);
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addrForm.fullName || !addrForm.phone || !addrForm.province) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }
    setSavingAddr(true);
    try {
      if (editingAddrId) {
        await apiClient.put(`/addresses/${editingAddrId}`, addrForm);
        toast.success('Đã cập nhật địa chỉ');
      } else {
        await apiClient.post('/addresses', addrForm);
        toast.success('Đã thêm địa chỉ mới');
      }
      setShowAddrForm(false);
      setEditingAddrId(null);
      fetchAddresses();
    } catch {
      toast.error('Lỗi khi lưu địa chỉ');
    } finally {
      setSavingAddr(false);
    }
  };

  const handleDeleteAddress = async (id: number) => {
    if (!confirm('Bạn có chắc muốn xóa địa chỉ này?')) return;
    try {
      await apiClient.delete(`/addresses/${id}`);
      toast.success('Đã xóa địa chỉ');
      fetchAddresses();
    } catch {
      toast.error('Lỗi khi xóa');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'PROCESSING': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'SHIPPED': return 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20';
      case 'DELIVERED': return 'bg-accent/10 text-accent border-accent/20';
      case 'CANCELLED': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
    }
  };

  const statusMap: any = {
    'PENDING': 'Chờ xác nhận',
    'PROCESSING': 'Đang xử lý',
    'SHIPPED': 'Đang giao hàng',
    'DELIVERED': 'Giao thành công',
    'CANCELLED': 'Đã hủy'
  };

  return (
    <div className="container mx-auto px-4 py-10 max-w-6xl">
      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Sidebar */}
        <div className="w-full md:w-64 flex-shrink-0">
          <div className="glass-card p-6 flex flex-col items-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white text-3xl font-bold mb-4">
              {user?.fullName?.charAt(0) || 'U'}
            </div>
            <h2 className="text-lg font-bold text-white text-center pb-1">{user?.fullName}</h2>
            <p className="text-slate-400 text-sm mb-6">{user?.email}</p>
            
            <div className="w-full space-y-2">
              <button 
                onClick={() => setActiveTab('orders')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${activeTab === 'orders' ? 'bg-primary border border-primary/50 text-white' : 'hover:bg-white/5 text-slate-300'}`}
              >
                <Package size={18} />
                <span className="font-medium text-sm">Đơn hàng của tôi</span>
              </button>
              <button 
                onClick={() => setActiveTab('info')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${activeTab === 'info' ? 'bg-primary border border-primary/50 text-white' : 'hover:bg-white/5 text-slate-300'}`}
              >
                <User size={18} />
                <span className="font-medium text-sm">Thông tin cá nhân</span>
              </button>
              <button 
                onClick={() => setActiveTab('addresses')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${activeTab === 'addresses' ? 'bg-primary border border-primary/50 text-white' : 'hover:bg-white/5 text-slate-300'}`}
              >
                <MapPin size={18} />
                <span className="font-medium text-sm">Sổ địa chỉ</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white mb-6">Quản lý Đơn hàng</h2>
              {orders.length === 0 ? (
                <div className="glass-card p-12 text-center text-slate-400 flex flex-col items-center">
                  <Package size={48} className="text-slate-600 mb-4" />
                  <p>Bạn chưa có đơn hàng nào.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map(order => (
                    <div key={order.id} className="glass-card p-6 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10 hover:border-primary/50">
                      <div className="flex flex-wrap justify-between items-start gap-4 mb-4 border-b border-border/50 pb-4">
                        <div>
                          <div className="text-white font-bold text-lg mb-1">Mã đơn: #{order.id}</div>
                          <div className="text-slate-400 text-sm">Đặt ngày: {formatDate(order.createdAt)}</div>
                        </div>
                        <div className="text-right">
                          <div className={`inline-flex items-center px-3 py-1 rounded-full border text-xs font-bold leading-none ${getStatusColor(order.status)}`}>
                            {statusMap[order.status] || order.status}
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-3 mb-4">
                        {order.items?.map((item: any) => (
                           <div key={item.id} className="flex justify-between items-center text-sm">
                             <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-white/5 rounded border border-border/50 flex items-center justify-center overflow-hidden">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  {getProductImage(item.productImage) && <img src={getProductImage(item.productImage)!} alt={item.productName} className="w-full h-full object-contain p-1" />}
                                </div>
                                <div>
                                  <span className="text-slate-300 block line-clamp-1">{item.productName}</span>
                                  <span className="text-slate-500 text-xs">x{item.quantity}</span>
                                </div>
                             </div>
                             <span className="text-white font-medium">{formatCurrency(item.price)}</span>
                           </div>
                        ))}
                      </div>
                      
                      <div className="flex justify-between items-center bg-dark/30 rounded-lg p-4 border border-border/30">
                        <span className="text-slate-400 font-medium">Tổng thanh toán:</span>
                        <span className="text-xl font-bold text-primary">{formatCurrency(order.finalPrice)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Info Tab */}
          {activeTab === 'info' && (
            <div className="glass-card p-8">
              <div className="flex items-center justify-between mb-6 border-b border-border/50 pb-4">
                <h2 className="text-xl font-bold text-white">Thông tin cá nhân</h2>
                {!editing && (
                  <button onClick={() => setEditing(true)} className="flex items-center space-x-2 text-primary hover:text-primary/80 text-sm font-medium">
                    <Pencil size={16} />
                    <span>Chỉnh sửa</span>
                  </button>
                )}
              </div>
              <div className="space-y-4 max-w-md">
                <div>
                  <label className="text-sm font-medium text-slate-400">Họ và tên</label>
                  {editing ? (
                    <input
                      type="text"
                      value={profileForm.fullName}
                      onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                      className="w-full bg-dark border border-border/50 text-white px-4 py-3 rounded-xl mt-1 focus:ring-1 focus:ring-primary"
                    />
                  ) : (
                    <div className="text-white bg-white/5 px-4 py-3 rounded-xl border border-border/50 mt-1">{user?.fullName}</div>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-400">Email</label>
                  <div className="text-white bg-white/5 px-4 py-3 rounded-xl border border-border/50 mt-1">{user?.email}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-400">Số điện thoại</label>
                  {editing ? (
                    <input
                      type="text"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      className="w-full bg-dark border border-border/50 text-white px-4 py-3 rounded-xl mt-1 focus:ring-1 focus:ring-primary"
                      placeholder="Nhập số điện thoại"
                    />
                  ) : (
                    <div className="text-white bg-white/5 px-4 py-3 rounded-xl border border-border/50 mt-1">{user?.phone || 'Chưa cập nhật'}</div>
                  )}
                </div>
                {editing && (
                  <div className="flex space-x-3 pt-4">
                    <button
                      onClick={handleSaveProfile}
                      disabled={savingProfile}
                      className="flex items-center space-x-2 bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-primary/25 disabled:opacity-50"
                    >
                      <Save size={16} />
                      <span>{savingProfile ? 'Đang lưu...' : 'Lưu thay đổi'}</span>
                    </button>
                    <button
                      onClick={() => { setEditing(false); setProfileForm({ fullName: user?.fullName || '', phone: user?.phone || '' }); }}
                      className="px-6 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      Hủy
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Addresses Tab */}
          {activeTab === 'addresses' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Sổ địa chỉ</h2>
                <button
                  onClick={handleCreateAddress}
                  className="flex items-center space-x-2 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-primary/25"
                >
                  <Plus size={18} />
                  <span>Thêm địa chỉ</span>
                </button>
              </div>

              {/* Address Form Modal */}
              {showAddrForm && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                  <div className="glass-card p-8 w-full max-w-lg relative">
                    <button onClick={() => { setShowAddrForm(false); setEditingAddrId(null); }} className="absolute top-4 right-4 text-slate-400 hover:text-white">
                      <X size={20} />
                    </button>
                    <h3 className="text-xl font-bold text-white mb-6">{editingAddrId ? 'Chỉnh sửa địa chỉ' : 'Thêm địa chỉ mới'}</h3>
                    <form onSubmit={handleSaveAddress} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-slate-400 block mb-1">Họ tên</label>
                          <input type="text" value={addrForm.fullName} onChange={(e) => setAddrForm({ ...addrForm, fullName: e.target.value })} className="w-full bg-dark border border-border/50 text-white rounded-lg px-4 py-2.5 focus:ring-1 focus:ring-primary" />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-slate-400 block mb-1">Số điện thoại</label>
                          <input type="text" value={addrForm.phone} onChange={(e) => setAddrForm({ ...addrForm, phone: e.target.value })} className="w-full bg-dark border border-border/50 text-white rounded-lg px-4 py-2.5 focus:ring-1 focus:ring-primary" />
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-400 block mb-1">Tỉnh / Thành phố</label>
                        <input type="text" value={addrForm.province} onChange={(e) => setAddrForm({ ...addrForm, province: e.target.value })} className="w-full bg-dark border border-border/50 text-white rounded-lg px-4 py-2.5 focus:ring-1 focus:ring-primary" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-slate-400 block mb-1">Quận / Huyện</label>
                          <input type="text" value={addrForm.district} onChange={(e) => setAddrForm({ ...addrForm, district: e.target.value })} className="w-full bg-dark border border-border/50 text-white rounded-lg px-4 py-2.5 focus:ring-1 focus:ring-primary" />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-slate-400 block mb-1">Phường / Xã</label>
                          <input type="text" value={addrForm.ward} onChange={(e) => setAddrForm({ ...addrForm, ward: e.target.value })} className="w-full bg-dark border border-border/50 text-white rounded-lg px-4 py-2.5 focus:ring-1 focus:ring-primary" />
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-400 block mb-1">Địa chỉ chi tiết</label>
                        <input type="text" value={addrForm.detail} onChange={(e) => setAddrForm({ ...addrForm, detail: e.target.value })} className="w-full bg-dark border border-border/50 text-white rounded-lg px-4 py-2.5 focus:ring-1 focus:ring-primary" placeholder="Số nhà, tên đường..." />
                      </div>
                      <div className="flex items-center space-x-3">
                        <input type="checkbox" id="addrDefault" checked={addrForm.isDefault} onChange={(e) => setAddrForm({ ...addrForm, isDefault: e.target.checked })} className="w-4 h-4 rounded accent-primary" />
                        <label htmlFor="addrDefault" className="text-sm text-slate-300">Đặt làm địa chỉ mặc định</label>
                      </div>
                      <button type="submit" disabled={savingAddr} className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-primary/25 disabled:opacity-50">
                        {savingAddr ? 'Đang lưu...' : (editingAddrId ? 'Cập nhật' : 'Thêm địa chỉ')}
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {addresses.length === 0 ? (
                <div className="glass-card p-12 text-center text-slate-400 flex flex-col items-center">
                  <MapPin size={48} className="text-slate-600 mb-4" />
                  <p>Bạn chưa có địa chỉ nào.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {addresses.map(addr => (
                    <div key={addr.id} className="glass-card p-5 flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-white font-bold">{addr.fullName}</span>
                          <span className="text-slate-500">|</span>
                          <span className="text-slate-300">{addr.phone}</span>
                          {addr.isDefault && (
                            <span className="text-[10px] bg-secondary text-white px-2 py-0.5 rounded uppercase font-bold">Mặc định</span>
                          )}
                        </div>
                        <p className="text-slate-400 text-sm">{addr.detail}, {addr.ward}, {addr.district}, {addr.province}</p>
                      </div>
                      <div className="flex items-center space-x-2 flex-shrink-0">
                        <button onClick={() => handleEditAddress(addr)} className="p-2 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => handleDeleteAddress(addr.id)} className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
