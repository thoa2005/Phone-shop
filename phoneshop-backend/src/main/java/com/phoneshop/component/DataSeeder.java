package com.phoneshop.component;

import com.phoneshop.entity.*;
import com.phoneshop.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

        private final UserRepository userRepository;
        private final CategoryRepository categoryRepository;
        private final BrandRepository brandRepository;
        private final ProductRepository productRepository;
        private final PasswordEncoder passwordEncoder;

        @Override
        public void run(String... args) throws Exception {
                if (userRepository.count() == 0) {
                        seedUsers();
                }
                if (categoryRepository.count() == 0) {
                        seedCategoriesAndProducts();
                }

                // Retroactive fix: Update old products that have 0 stock
                List<Product> products = productRepository.findAll();
                boolean needsStockUpdate = false;
                for (Product p : products) {
                        if (p.getStock() == null || p.getStock() <= 0) {
                                p.setStock(50);
                                needsStockUpdate = true;
                        }
                }
                if (needsStockUpdate) {
                        productRepository.saveAll(products);
                }

                // Retroactive category images update
                for (Category c : categoryRepository.findAll()) {
                     if ("samsung".equals(c.getSlug()) && c.getImage() == null) {
                         c.setImage("https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?q=80&w=500");
                         categoryRepository.save(c);
                     }
                     if ("xiaomi".equals(c.getSlug()) && c.getImage() == null) {
                         c.setImage("https://images.unsplash.com/photo-1591159065848-0157c75744cb?q=80&w=500");
                         categoryRepository.save(c);
                     }
                     if ("oppo".equals(c.getSlug()) && c.getImage() == null) {
                         c.setImage("https://images.unsplash.com/photo-1609692814858-f7cd2f0afe44?q=80&w=500");
                         categoryRepository.save(c);
                     }
                     if ("realme".equals(c.getSlug()) && c.getImage() == null) {
                         c.setImage("https://images.unsplash.com/photo-1592890288564-76628a30a657?q=80&w=500");
                         categoryRepository.save(c);
                     }
                }
        }

        private void seedUsers() {
                User admin = User.builder()
                                .fullName("Quản trị viên")
                                .email("admin@phoneshop.vn")
                                .password(passwordEncoder.encode("123456"))
                                .role(User.Role.ADMIN)
                                .isActive(true)
                                .build();
                userRepository.save(admin);

                User customer = User.builder()
                                .fullName("Khách hàng VIP")
                                .email("user@phoneshop.vn")
                                .password(passwordEncoder.encode("123456"))
                                .role(User.Role.USER)
                                .isActive(true)
                                .build();
                userRepository.save(customer);
        }

        private void seedCategoriesAndProducts() {
                // Categories
                Category catIphone = Category.builder().name("iPhone").slug("iphone")
                                .image("https://images.unsplash.com/photo-1616348436168-de43ad0db179?q=80&w=500")
                                .build();
                Category catSamsung = Category.builder().name("Samsung").slug("samsung").image("https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?q=80&w=500").build();
                Category catXiaomi = Category.builder().name("Xiaomi").slug("xiaomi").image("https://images.unsplash.com/photo-1591159065848-0157c75744cb?q=80&w=500").build();
                Category catOppo = Category.builder().name("OPPO").slug("oppo").image("https://images.unsplash.com/photo-1609692814858-f7cd2f0afe44?q=80&w=500").build();
                Category catRealme = Category.builder().name("Realme").slug("realme").image("https://images.unsplash.com/photo-1592890288564-76628a30a657?q=80&w=500").build();
                categoryRepository.saveAll(List.of(catIphone, catSamsung, catXiaomi, catOppo, catRealme));

                // Brands
                Brand apple = Brand.builder().name("Apple").logo("apple.png").build();
                Brand samsung = Brand.builder().name("Samsung").logo("samsung.png").build();
                Brand xiaomi = Brand.builder().name("Xiaomi").logo("xiaomi.png").build();
                Brand oppo = Brand.builder().name("OPPO").logo("oppo.png").build();
                Brand realme = Brand.builder().name("Realme").logo("realme.png").build();
                brandRepository.saveAll(List.of(apple, samsung, xiaomi, oppo, realme));

                // iPhone products
                productRepository.save(Product.builder()
                                .name("iPhone 15 Pro Max 256GB")
                                .slug("iphone-15-pro-max-256gb")
                                .description("Titanium siêu nhẹ, chip A17 Pro mạnh mẽ, camera 48MP, màn hình Super Retina XDR 6.7 inch.")
                                .price(new BigDecimal("32990000"))
                                .salePrice(new BigDecimal("30990000"))
                                .stock(50).category(catIphone).brand(apple).build());

                productRepository.save(Product.builder()
                                .name("iPhone 15 Pro 128GB")
                                .slug("iphone-15-pro-128gb")
                                .description("Chip A17 Pro, Dynamic Island, camera 48MP, thiết kế titanium sang trọng.")
                                .price(new BigDecimal("27990000"))
                                .stock(40).category(catIphone).brand(apple).build());

                productRepository.save(Product.builder()
                                .name("iPhone 15 128GB")
                                .slug("iphone-15-128gb")
                                .description("Dynamic Island, camera 48MP, chip A16 Bionic cực mạnh.")
                                .price(new BigDecimal("21990000"))
                                .salePrice(new BigDecimal("19990000"))
                                .stock(60).category(catIphone).brand(apple).build());

                // Samsung products
                productRepository.save(Product.builder()
                                .name("Samsung Galaxy S24 Ultra 512GB")
                                .slug("samsung-galaxy-s24-ultra-512gb")
                                .description("Galaxy AI đỉnh cao, bút S-Pen tích hợp, camera 200MP, Snapdragon 8 Gen 3.")
                                .price(new BigDecimal("35990000"))
                                .salePrice(new BigDecimal("33490000"))
                                .stock(30).category(catSamsung).brand(samsung).build());

                productRepository.save(Product.builder()
                                .name("Samsung Galaxy S24+ 256GB")
                                .slug("samsung-galaxy-s24-plus-256gb")
                                .description("Galaxy AI, camera 50MP, chip Snapdragon 8 Gen 3, màn hình 6.7 inch sắc nét.")
                                .price(new BigDecimal("25990000"))
                                .stock(35).category(catSamsung).brand(samsung).build());

                productRepository.save(Product.builder()
                                .name("Samsung Galaxy Z Fold5 256GB")
                                .slug("samsung-galaxy-z-fold5-256gb")
                                .description("Điện thoại gập cao cấp, màn hình rộng 7.6 inch, chip Snapdragon 8 Gen 2.")
                                .price(new BigDecimal("40990000"))
                                .salePrice(new BigDecimal("35990000"))
                                .stock(20).category(catSamsung).brand(samsung).build());

                // Xiaomi products
                productRepository.save(Product.builder()
                                .name("Xiaomi 14 Ultra 512GB")
                                .slug("xiaomi-14-ultra-512gb")
                                .description("Camera Leica chuyên nghiệp, chip Snapdragon 8 Gen 3, sạc nhanh 90W.")
                                .price(new BigDecimal("23990000"))
                                .stock(25).category(catXiaomi).brand(xiaomi).build());

                productRepository.save(Product.builder()
                                .name("Xiaomi Redmi Note 13 Pro+ 5G")
                                .slug("xiaomi-redmi-note-13-pro-plus-5g")
                                .description("Camera 200MP, sạc nhanh 120W, chip MediaTek Dimensity 7200 Ultra.")
                                .price(new BigDecimal("9990000"))
                                .salePrice(new BigDecimal("8490000"))
                                .stock(100).category(catXiaomi).brand(xiaomi).build());

                // OPPO products
                productRepository.save(Product.builder()
                                .name("OPPO Find X7 Ultra 256GB")
                                .slug("oppo-find-x7-ultra-256gb")
                                .description("Camera Hasselblad kép, chip Snapdragon 8 Gen 3, pin 5400mAh.")
                                .price(new BigDecimal("24990000"))
                                .stock(15).category(catOppo).brand(oppo).build());

                // Realme products
                productRepository.save(Product.builder()
                                .name("Realme GT5 Pro 256GB")
                                .slug("realme-gt5-pro-256gb")
                                .description("Snapdragon 8 Gen 3, camera Sony IMX890, sạc nhanh 100W.")
                                .price(new BigDecimal("12990000"))
                                .salePrice(new BigDecimal("10990000"))
                                .stock(45).category(catRealme).brand(realme).build());

                System.out.println("====== SEEDED SAMPLE DATA: 5 Categories, 5 Brands, 10 Products ======");
        }
}
