import { Zap, ShieldCheck, Truck } from 'lucide-react';

export default function Features() {
  return (
    <section className="container mx-auto px-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 flex flex-col items-center text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <Zap size={24} />
          </div>
          <h3 className="text-xl font-bold text-white">Giao hàng siêu tốc</h3>
          <p className="text-slate-400 text-sm">Nhận hàng trong vòng 2H tại các thành phố lớn.</p>
        </div>
        <div className="glass-card p-6 flex flex-col items-center text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
            <ShieldCheck size={24} />
          </div>
          <h3 className="text-xl font-bold text-white">Bảo hành 24 tháng</h3>
          <p className="text-slate-400 text-sm">Cam kết chất lượng 1 đổi 1 trong 30 ngày đầu.</p>
        </div>
        <div className="glass-card p-6 flex flex-col items-center text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center text-accent">
            <Truck size={24} />
          </div>
          <h3 className="text-xl font-bold text-white">Miễn phí vận chuyển</h3>
          <p className="text-slate-400 text-sm">Áp dụng cho mọi đơn hàng điện thoại trên toàn quốc.</p>
        </div>
      </div>
    </section>
  );
}
