import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function Hero() {
  return (
    <section className="relative h-[80vh] min-h-[600px] flex items-center justify-center overflow-hidden">
      {/* Abstract Background */}
      <div className="absolute inset-0 bg-dark z-0" />
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/30 rounded-full blur-[120px] mix-blend-screen z-0" />
      <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-secondary/20 rounded-full blur-[100px] mix-blend-screen z-0" />
      
      <div className="container mx-auto px-4 relative z-10 grid md:grid-cols-2 gap-12 items-center">
        <div className="space-y-8">
          <div className="inline-flex items-center space-x-2 glass px-4 py-2 rounded-full border-primary/30 text-primary text-sm font-medium">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span>Sản phẩm mới ra mắt 2026</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-tight">
            Định hình lại <br />
            <span className="text-gradient">Tương Lai</span>
          </h1>
          
          <p className="text-lg text-slate-400 max-w-lg leading-relaxed">
            Khám phá bộ sưu tập điện thoại thông minh cao cấp với công nghệ AI tiên tiến, thiết kế vượt thời gian và hiệu năng vô song.
          </p>
          
          <div className="flex items-center space-x-4">
            <Link href="/products" className="bg-primary hover:bg-primary/90 text-white px-8 py-4 rounded-xl font-bold transition-all shadow-lg shadow-primary/25 hover:shadow-primary/40 flex items-center space-x-2">
              <span>Khám phá ngay</span>
              <ArrowRight size={20} />
            </Link>
            <Link href="/about" className="glass hover:bg-white/5 text-white px-8 py-4 rounded-xl font-bold transition-all flex items-center space-x-2">
              <span>Tìm hiểu thêm</span>
            </Link>
          </div>
        </div>
        
        <div className="relative hidden md:block">
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-secondary/20 rounded-3xl blur-3xl" />
          <div className="relative glass-card w-full aspect-[4/5] rounded-[2.5rem] p-4 flex items-center justify-center border-t-white/10 border-l-white/10 shadow-2xl overflow-hidden group">
             <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-dark/90 to-transparent z-10" />
             <div className="w-[80%] h-[95%] bg-zinc-900 rounded-[2rem] border-[8px] border-zinc-800 relative z-20 shadow-inner overflow-hidden flex flex-col">
                <div className="absolute top-0 inset-x-0 flex justify-center z-30">
                  <div className="w-1/3 h-6 bg-zinc-800 rounded-b-2xl" />
                </div>
                <div className="flex-1 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 animate-gradient-xy opacity-80 group-hover:scale-105 transition-transform duration-700" />
             </div>
          </div>
        </div>
      </div>
    </section>
  );
}
