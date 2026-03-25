'use client';

import Link from 'next/link';
import { ShoppingCart, User, Search, Menu, X, Activity } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { useEffect, useState } from 'react';

export default function Header() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const { totalItems, fetchCart } = useCartStore();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (isAuthenticated) fetchCart();
    
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isAuthenticated, fetchCart]);

  return (
    <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${isScrolled ? 'glass py-3' : 'bg-transparent py-5'}`}>
      <div className="container mx-auto px-4 flex justify-between items-center">
        {/* Logo */}
        <Link href="/" className="text-2xl font-bold tracking-tighter text-gradient">
          PHONE<span className="text-white">SHOP</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center space-x-8">
          <Link href="/products" className="text-sm font-medium hover:text-primary transition-colors">Sản phẩm</Link>
          <Link href="/categories" className="text-sm font-medium hover:text-primary transition-colors">Danh mục</Link>
          <Link href="/about" className="text-sm font-medium hover:text-primary transition-colors">Về chúng tôi</Link>
        </nav>

        {/* Actions */}
        <div className="hidden md:flex items-center space-x-6">
          <button className="text-slate-300 hover:text-white transition-colors">
            <Search size={20} />
          </button>
          
          <Link href="/cart" className="relative text-slate-300 hover:text-white transition-colors">
            <ShoppingCart size={20} />
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-2 bg-secondary text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-bold">
                {totalItems}
              </span>
            )}
          </Link>

          {isAuthenticated ? (
            <div className="flex items-center space-x-6">
              {user?.role === 'ADMIN' && (
                <Link href="/admin" className="text-sm font-bold text-primary hover:text-white transition-all flex items-center space-x-1 glass px-3 py-1.5 rounded-lg border-primary/30">
                  <Activity size={16} />
                  <span>Quản trị</span>
                </Link>
              )}
              <Link href="/profile" className="flex items-center space-x-2 text-sm font-medium text-slate-300 hover:text-white transition-colors">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white font-bold">
                  {user?.fullName?.charAt(0) || 'U'}
                </div>
              </Link>
              <button onClick={logout} className="text-sm text-slate-400 hover:text-red-400">Đăng xuất</button>
            </div>
          ) : (
            <div className="flex items-center space-x-4">
              <Link href="/auth/login" className="text-sm font-medium hover:text-primary transition-colors">Đăng nhập</Link>
              <Link href="/auth/register" className="text-sm font-medium bg-primary hover:bg-primary/80 text-white px-4 py-2 rounded-lg transition-colors">Đăng ký</Link>
            </div>
          )}
        </div>

        {/* Mobile menu toggle */}
        <button className="md:hidden text-slate-300" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Nav */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full glass border-t border-border/50 py-4 px-4 flex flex-col space-y-4">
          <Link href="/products" className="py-2 border-b border-border/50">Sản phẩm</Link>
          <Link href="/categories" className="py-2 border-b border-border/50">Danh mục</Link>
          <div className="flex justify-between items-center py-2 border-b border-border/50">
            <Link href="/cart" className="flex items-center space-x-2">
              <ShoppingCart size={20} />
              <span>Giỏ hàng ({totalItems})</span>
            </Link>
          </div>
          {isAuthenticated ? (
            <div className="flex flex-col space-y-4 pt-2">
              {user?.role === 'ADMIN' && (
                <Link href="/admin" className="py-2 border-b border-border/50 text-primary font-bold">Quản trị hệ thống</Link>
              )}
              <div className="flex justify-between items-center py-2">
                <Link href="/profile" className="flex items-center space-x-2">
                  <User size={20} />
                  <span>{user?.fullName}</span>
                </Link>
                <button onClick={logout} className="text-red-400">Đăng xuất</button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col space-y-2 pt-2">
              <Link href="/auth/login" className="w-full text-center py-2 border border-primary rounded-lg text-primary">Đăng nhập</Link>
              <Link href="/auth/register" className="w-full text-center py-2 bg-primary rounded-lg text-white">Đăng ký</Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
