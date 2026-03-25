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
    }

    private void seedUsers() {
        User admin = User.builder()
                .fullName("Quản trị viên")
                .email("admin@phoneshop.vn")
                .password(passwordEncoder.encode("123456"))
                .role(User.Role.ADMIN)
                .build();
        userRepository.save(admin);

        User customer = User.builder()
                .fullName("Khách hàng VIP")
                .email("user@phoneshop.vn")
                .password(passwordEncoder.encode("123456"))
                .role(User.Role.USER)
                .build();
        userRepository.save(customer);
    }

    private void seedCategoriesAndProducts() {
        Category catPhone = Category.builder().name("Điện thoại thông minh").slug("dien-thoai-thong-minh").build();
        categoryRepository.save(catPhone);

        Brand apple = Brand.builder().name("Apple").logo("apple.png").build();
        Brand samsung = Brand.builder().name("Samsung").logo("samsung.png").build();
        brandRepository.saveAll(List.of(apple, samsung));

        Product p1 = Product.builder()
                .name("iPhone 15 Pro Max 256GB")
                .slug("iphone-15-pro-max-256gb")
                .description("Titanium siêu nhẹ, chip A17 Pro mạnh mẽ.")
                .price(new BigDecimal("32990000"))
                .stock(50)
                .category(catPhone)
                .brand(apple)
                .build();

        Product p2 = Product.builder()
                .name("Samsung Galaxy S24 Ultra 512GB")
                .slug("samsung-galaxy-s24-ultra-512gb")
                .description("Galaxy AI đỉnh cao, bút S-Pen tích hợp.")
                .price(new BigDecimal("35990000"))
                .stock(30)
                .category(catPhone)
                .brand(samsung)
                .build();

        productRepository.saveAll(List.of(p1, p2));
        System.out.println("====== SEEDED SAMPLE PRODUCTS COMPLETELY ======");
    }
}
