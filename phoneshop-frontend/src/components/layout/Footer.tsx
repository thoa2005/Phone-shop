import Link from 'next/link';
import { Facebook, Twitter, Instagram, Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-dark border-t border-border pt-16 pb-8 mt-auto">
      <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-12">
        
        {/* Brand */}
        <div className="space-y-4">
          <Link href="/" className="text-2xl font-bold tracking-tighter text-gradient">
            PHONE<span className="text-white">SHOP</span>
          </Link>
          <p className="text-slate-400 text-sm leading-relaxed">
            Điểm đến tin cậy cho những tín đồ công nghệ. Cung cấp các dòng điện thoại cao cấp với dịch vụ hậu mãi tốt nhất.
          </p>
          <div className="flex space-x-4 pt-2">
            <a href="#" className="w-10 h-10 rounded-full glass flex items-center justify-center text-slate-400 hover:text-primary hover:border-primary transition-all">
              <Facebook size={18} />
            </a>
            <a href="#" className="w-10 h-10 rounded-full glass flex items-center justify-center text-slate-400 hover:text-primary hover:border-primary transition-all">
              <Twitter size={18} />
            </a>
            <a href="#" className="w-10 h-10 rounded-full glass flex items-center justify-center text-slate-400 hover:text-secondary hover:border-secondary transition-all">
              <Instagram size={18} />
            </a>
          </div>
        </div>

        {/* Links */}
        <div>
          <h3 className="text-white font-semibold mb-6 uppercase tracking-wider text-sm">Cửa hàng</h3>
          <ul className="space-y-3 text-sm text-slate-400">
            <li><Link href="/products" className="hover:text-primary transition-colors">Tất cả sản phẩm</Link></li>
            <li><Link href="/categories/apple" className="hover:text-primary transition-colors">Apple iPhone</Link></li>
            <li><Link href="/categories/samsung" className="hover:text-primary transition-colors">Samsung Galaxy</Link></li>
            <li><Link href="/promotions" className="hover:text-primary transition-colors">Khuyến mãi</Link></li>
          </ul>
        </div>

        {/* Support */}
        <div>
          <h3 className="text-white font-semibold mb-6 uppercase tracking-wider text-sm">Hỗ trợ</h3>
          <ul className="space-y-3 text-sm text-slate-400">
            <li><Link href="/faq" className="hover:text-primary transition-colors">Câu hỏi thường gặp</Link></li>
            <li><Link href="/shipping" className="hover:text-primary transition-colors">Chính sách giao hàng</Link></li>
            <li><Link href="/returns" className="hover:text-primary transition-colors">Chính sách đổi trả</Link></li>
            <li><Link href="/warranty" className="hover:text-primary transition-colors">Bảo hành</Link></li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h3 className="text-white font-semibold mb-6 uppercase tracking-wider text-sm">Liên hệ</h3>
          <ul className="space-y-4 text-sm text-slate-400">
            <li className="flex items-start space-x-3">
              <MapPin size={18} className="text-primary mt-0.5" />
              <span>123 Đường Công Nghệ, Quận 1, TP. Hồ Chí Minh</span>
            </li>
            <li className="flex items-center space-x-3">
              <Phone size={18} className="text-primary" />
              <span>1900 1234 (Miễn phí)</span>
            </li>
            <li className="flex items-center space-x-3">
              <Mail size={18} className="text-primary" />
              <span>support@phoneshop.vn</span>
            </li>
          </ul>
        </div>

      </div>
      
      <div className="container mx-auto px-4 mt-16 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center text-xs text-slate-500">
        <p>&copy; {new Date().getFullYear()} PhoneShop. All rights reserved.</p>
        <div className="flex space-x-6 mt-4 md:mt-0">
          <Link href="/privacy" className="hover:text-white transition-colors">Bảo mật</Link>
          <Link href="/terms" className="hover:text-white transition-colors">Điều khoản</Link>
        </div>
      </div>
    </footer>
  );
}
