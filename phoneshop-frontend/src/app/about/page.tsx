'use client';

import { ShieldCheck, Truck, Headphones, Smartphone } from 'lucide-react';

export default function AboutPage() {
  const features = [
    {
      icon: <Smartphone className="text-primary" size={32} />,
      title: "Sản phẩm chính hãng",
      description: "Chúng tôi cam kết 100% sản phẩm là hàng chính hãng, đầy đủ hóa đơn chứng từ từ các thương hiệu lớn như Apple, Samsung, Xiaomi."
    },
    {
      icon: <ShieldCheck className="text-secondary" size={32} />,
      title: "Bảo hành tận tâm",
      description: "Chính sách bảo hành lên đến 12-24 tháng, lỗi 1 đổi 1 trong vòng 30 ngày đầu tiên nếu có lỗi từ nhà sản xuất."
    },
    {
      icon: <Truck className="text-blue-400" size={32} />,
      title: "Giao hàng siêu tốc",
      description: "Giao hàng nội thành trong vòng 2h và giao hàng toàn quốc từ 1-3 ngày làm việc với dịch vụ vận chuyển uy tín."
    },
    {
      icon: <Headphones className="text-green-400" size={32} />,
      title: "Hỗ trợ 24/7",
      description: "Đội ngũ chăm sóc khách hàng luôn sẵn sàng giải đáp mọi thắc mắc của bạn qua Hotline, Zalo hoặc Facebook."
    }
  ];

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Hero Section */}
      <section className="text-center mb-20 animate-fade-in">
        <h1 className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tighter">
          Về <span className="text-gradient">PHONESHOP</span>
        </h1>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
          Sứ mệnh của chúng tôi là mang đến cho người dùng Việt Nam những sản phẩm công nghệ đỉnh cao với mức giá hợp lý nhất và dịch vụ hậu mãi tuyệt vời.
        </p>
      </section>

      {/* Story Section */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-24">
        <div className="glass-card p-8 md:p-12 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-primary/20 transition-all duration-500"></div>
          <h2 className="text-3xl font-bold mb-6 text-white">Câu chuyện của chúng tôi</h2>
          <div className="space-y-4 text-slate-300 leading-relaxed">
            <p>
              Khởi đầu từ một cửa hàng nhỏ chuyên kinh doanh điện thoại xách tay vào năm 2020, 
              PHONESHOP đã không ngừng phát triển và trở thành một trong những điểm đến tin cậy 
              của những tín đồ yêu công nghệ.
            </p>
            <p>
              Chúng tôi hiểu rằng, một chiếc điện thoại không chỉ là công cụ liên lạc mà còn là 
              người bạn đồng hành, là phong cách sống của mỗi cá nhân. Vì vậy, sự tỉ mỉ trong 
              khâu chọn lọc sản phẩm luôn là ưu tiên hàng đầu của chúng tôi.
            </p>
          </div>
        </div>
        <div className="relative">
          <div className="aspect-square rounded-3xl overflow-hidden glass border border-white/10 shadow-2xl relative z-10">
             <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-secondary/20 mix-blend-overlay"></div>
             <img 
               src="https://images.unsplash.com/photo-1556740734-7f9a2b7a0f42?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80" 
               alt="PhoneShop Store" 
               className="w-full h-full object-cover opacity-80"
             />
          </div>
          {/* Decorative elements */}
          <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-secondary/30 rounded-full blur-3xl -z-0"></div>
          <div className="absolute -top-6 -right-6 w-48 h-48 bg-primary/20 rounded-full blur-3xl -z-0"></div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="mb-24">
        <h2 className="text-3xl font-bold text-center mb-16 text-white">Tại sao chọn chúng tôi?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="glass-card p-6 flex flex-col items-center text-center hover:translate-y-[-8px] transition-all duration-300 border-white/5 hover:border-primary/30 group">
              <div className="mb-4 p-4 rounded-2xl bg-white/5 group-hover:scale-110 transition-transform duration-300">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">{feature.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Contact Section */}
      <section className="glass-card p-12 text-center bg-gradient-to-b from-white/[0.03] to-transparent border-white/5">
        <h2 className="text-3xl font-bold mb-6 text-white">Bạn cần tư vấn?</h2>
        <p className="text-slate-400 mb-8 max-w-xl mx-auto">
          Đội ngũ chuyên gia của chúng tôi luôn sẵn sàng hỗ trợ bạn tìm được chiếc điện thoại ưng ý nhất.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <a href="tel:19001234" className="bg-primary hover:bg-primary/80 text-white px-8 py-4 rounded-full font-bold transition-all shadow-lg shadow-primary/20">
            Gọi ngay: 1900 1234
          </a>
          <button className="glass border-white/10 hover:bg-white/10 text-white px-8 py-4 rounded-full font-bold transition-all">
            Chat với tư vấn viên
          </button>
        </div>
      </section>
    </div>
  );
}
