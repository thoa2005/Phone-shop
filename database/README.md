# Hướng dẫn Database cho PhoneShop

Thư mục này chứa các file cần thiết để thiết lập cơ sở dữ liệu cho dự án PhoneShop.

## 1. Các file trong thư mục
- `schema.sql`: Chứa cấu trúc các bảng (tables), quan hệ (foreign keys) và ràng buộc.
- `data.sql`: Chứa dữ liệu mẫu (users, products, categories...) để bạn có thể test ngay.

## 2. Cách Import vào MySQL
1. Mở phần mềm quản lý MySQL (như MySQL Workbench, phpMyAdmin, hoặc Command Line).
2. Tạo database mới (nếu chưa có):
   ```sql
   CREATE DATABASE phoneshop;
   ```
3. Sử dụng database:
   ```sql
   USE phoneshop;
   ```
4. Thực thi file `schema.sql` trước để tạo bảng.
5. Thực thi file `data.sql` sau để nạp dữ liệu.

## 3. Cấu hình Backend
Để backend kết nối được tới database này, bạn cần kiểm tra file `src/main/resources/application.properties` và đảm bảo các thông tin sau chính xác:
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/phoneshop?useSSL=false&serverTimezone=UTC
spring.datasource.username=YOUR_USERNAME (mặc định thường là root)
spring.datasource.password=YOUR_PASSWORD
```
