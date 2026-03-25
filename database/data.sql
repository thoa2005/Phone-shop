-- PhoneShop Sample Data
-- Created: 2026-03-25

USE phoneshop;

-- 1. Users (password is '123456' hashed or plain for demo)
INSERT INTO users (full_name, email, password, role) VALUES 
('Admin User', 'admin@phoneshop.com', '$2a$10$XFMh.K.N.K.K.K.K.K.K.K', 'ADMIN'),
('Customer User', 'user@phoneshop.com', '$2a$10$XFMh.K.N.K.K.K.K.K.K.K', 'USER');

-- 2. Categories
INSERT INTO categories (name, slug, image) VALUES 
('iPhone', 'iphone', 'iphone-cat.png'),
('Samsung', 'samsung', 'samsung-cat.png'),
('Oppo', 'oppo', 'oppo-cat.png'),
('Xiaomi', 'xiaomi', 'xiaomi-cat.png');

-- 3. Brands
INSERT INTO brands (name, logo) VALUES 
('Apple', 'apple-logo.png'),
('Samsung', 'samsung-logo.png'),
('Oppo', 'oppo-logo.png'),
('Xiaomi', 'xiaomi-logo.png');

-- 4. Products
INSERT INTO products (category_id, brand_id, name, slug, description, price, sale_price, stock) VALUES 
(1, 1, 'iPhone 15 Pro Max 256GB', 'iphone-15-pro-max-256gb', 'Siêu phẩm mới nhất từ Apple', 34990000, 32990000, 50),
(1, 1, 'iPhone 14 Pro 128GB', 'iphone-14-pro-128gb', 'Hiệu năng mạnh mẽ với A16 Bionic', 24990000, 22990000, 30),
(2, 2, 'Samsung Galaxy S24 Ultra', 'samsung-galaxy-s24-ultra', 'Đỉnh cao công nghệ AI', 33990000, 29990000, 40),
(4, 4, 'Xiaomi 14 Ultra', 'xiaomi-14-ultra', 'Camera Leica huyền thoại', 29990000, 27990000, 20);

-- 5. Product Images
INSERT INTO product_images (product_id, image_url, is_primary) VALUES 
(1, 'iphone-15-pm-gold.png', TRUE),
(1, 'iphone-15-pm-side.png', FALSE),
(3, 's24-ultra-grey.png', TRUE);

-- 6. Product Specs
INSERT INTO product_specs (product_id, spec_name, spec_value) VALUES 
(1, 'Màn hình', '6.7 inch, OLED, 120Hz'),
(1, 'Chipset', 'Apple A17 Pro'),
(1, 'RAM', '8GB'),
(3, 'Màn hình', '6.8 inch, Dynamic AMOLED 2X'),
(3, 'Chipset', 'Snapdragon 8 Gen 3 for Galaxy');

-- 7. Coupons
INSERT INTO coupons (code, type, value, min_order, max_uses, is_active) VALUES 
('PHONESHOP10', 'PERCENT', 10, 1000000, 100, TRUE),
('SALE1M', 'FIXED', 1000000, 20000000, 50, TRUE);
