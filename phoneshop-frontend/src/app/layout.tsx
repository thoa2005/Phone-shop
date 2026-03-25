import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "PhoneShop - Cửa hàng điện thoại cao cấp",
  description: "Trải nghiệm mua sắm công nghệ đỉnh cao với các dòng điện thoại mới nhất",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className="scroll-smooth" suppressHydrationWarning>
      <body className="flex flex-col min-h-screen bg-dark text-slate-200">
        <Providers>
          <Header />
          <main className="flex-grow pt-20">
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
