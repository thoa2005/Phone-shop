# Phân tích chức năng phục vụ viết test case – PhoneShop

## 1. Phạm vi đã đối chiếu

Tài liệu này được rút ra từ frontend Next.js, backend Spring Boot, cấu hình bảo mật và schema MySQL. Hệ thống có ba tác nhân chính: **khách**, **khách hàng đã đăng nhập** và **quản trị viên**; VNPay là tác nhân ngoài hệ thống.

> Quy ước: các use case có biểu tượng 🔒 yêu cầu JWT; 👑 chỉ dành cho ADMIN. Những API GET sản phẩm/danh mục/thương hiệu/đánh giá và callback VNPay là công khai.

## 2. Sơ đồ use case tổng quát

```mermaid
flowchart LR
  guest([Khách])
  customer([Khách hàng])
  admin([Quản trị viên])
  vnpay([Cổng VNPay])

  subgraph system[Hệ thống PhoneShop]
    uc1([Xem / tìm / lọc sản phẩm])
    uc2([Xem danh mục, thương hiệu và chi tiết sản phẩm])
    uc3([Đăng ký / đăng nhập / làm mới token])
    uc4([Quản lý giỏ hàng 🔒])
    uc5([Quản lý hồ sơ và địa chỉ 🔒])
    uc6([Đặt hàng, áp mã giảm giá 🔒])
    uc7([Thanh toán COD / VNPay 🔒])
    uc8([Xem đơn hàng 🔒])
    uc9([Viết đánh giá 🔒])
    uc10([Xem dashboard 👑])
    uc11([Quản lý sản phẩm 👑])
    uc12([Quản lý đơn hàng & trạng thái 👑])
    uc13([Quản lý người dùng 👑])
    uc14([Quản lý coupon 👑])
    uc15([Quản lý danh mục / thương hiệu / đánh giá 👑])
  end

  guest --> uc1 & uc2 & uc3
  customer --> uc1 & uc2 & uc4 & uc5 & uc6 & uc7 & uc8 & uc9
  admin --> uc10 & uc11 & uc12 & uc13 & uc14 & uc15
  uc6 -. «include» .-> uc4
  uc6 -. «include» .-> uc5
  uc6 -. «extend: có coupon» .-> uc14
  uc7 <--> vnpay
```

## 3. Sơ đồ phân rã chức năng để lập test suite

```mermaid
mindmap
  root((PhoneShop))
    Công khai
      Danh sách sản phẩm
        Tìm theo tên
        Lọc danh mục / hãng / giá
        Phân trang, sắp xếp
      Chi tiết sản phẩm
        Ảnh, thông số, giá, tồn kho
        Đánh giá
      Danh mục và thương hiệu
    Tài khoản
      Đăng ký
      Đăng nhập
      Refresh JWT
      Cập nhật hồ sơ
      Quản lý địa chỉ
    Mua hàng
      Thêm / sửa / xóa giỏ
      Kiểm tra tồn kho
      Kiểm tra coupon
      Tạo đơn từ giỏ hoặc danh sách item
      COD
      VNPay callback
      Lịch sử đơn
    Đánh giá
      Xem theo sản phẩm
      Tạo một đánh giá mỗi user/sản phẩm
      Xóa đánh giá
    Quản trị
      Dashboard
      Sản phẩm CRUD / ẩn mềm
      Coupon CRUD
      Người dùng / khóa tài khoản
      Đơn hàng / cập nhật trạng thái
      Danh mục, thương hiệu CRUD
```

## 4. Luồng nghiệp vụ cần test

### 4.1 Mua hàng và thanh toán

```mermaid
flowchart TD
  A([Khách hàng đã đăng nhập]) --> B[Thêm sản phẩm vào giỏ]
  B --> C{Số lượng yêu cầu ≤ tồn kho?}
  C -- Không --> E[Trả lỗi Not enough stock]
  C -- Có --> D[Thêm mới hoặc cộng dồn item]
  D --> F[Chọn địa chỉ, phương thức thanh toán]
  F --> G{Có coupon?}
  G -- Có --> H[Kiểm tra active, ngày hiệu lực, quota, giá trị tối thiểu]
  H -- Không hợp lệ --> I[Không tạo đơn; hiển thị lỗi]
  H -- Hợp lệ --> J[Tính total, discount, final price]
  G -- Không --> J
  J --> K[Tạo đơn PENDING và xóa giỏ]
  K --> L{Phương thức = VNPay?}
  L -- COD --> M[Đi tới lịch sử đơn]
  L -- VNPay --> N[Tạo URL thanh toán + payment PENDING]
  N --> O[VNPay trả callback]
  O --> P{Chữ ký hợp lệ và code = 00?}
  P -- Có --> Q[Payment COMPLETED; đơn CONFIRMED]
  P -- Không --> R[Payment FAILED]
```

### 4.2 Vòng đời đơn hàng và tồn kho

```mermaid
stateDiagram-v2
  [*] --> PENDING: tạo đơn
  PENDING --> CONFIRMED: VNPay thành công hoặc admin cập nhật
  PENDING --> SHIPPING: admin cập nhật
  PENDING --> CANCELLED: admin cập nhật
  CONFIRMED --> SHIPPING: admin cập nhật
  CONFIRMED --> CANCELLED: admin cập nhật
  SHIPPING --> DELIVERED: admin cập nhật
  SHIPPING --> CANCELLED: admin cập nhật
  DELIVERED --> RETURNED: admin cập nhật
  DELIVERED --> CANCELLED: admin cập nhật\n(+ tồn kho, - đã bán)
  note right of DELIVERED
    Lần đầu vào DELIVERED:
    - tồn kho theo từng item
    + số đã bán
  end note
```

### 4.3 Phân quyền và xác thực

```mermaid
flowchart TD
  A[Yêu cầu API] --> B{Endpoint công khai?}
  B -- Có --> C[Xử lý]
  B -- Không --> D{Bearer JWT hợp lệ?}
  D -- Không --> E[401 Unauthorized]
  D -- Có --> F{Endpoint/logic cần ADMIN?}
  F -- Không --> C
  F -- Có --> G{role = ADMIN?}
  G -- Có --> C
  G -- Không --> H[403 Forbidden]
  E --> I[Frontend thử refresh token một lần]
  I --> J{Refresh token hợp lệ?}
  J -- Có --> A
  J -- Không --> K[Xóa cookie, chuyển tới đăng nhập]
```

## 5. Danh mục test condition (dùng làm khung test case)

| Nhóm | Chức năng / điều kiện cần phủ | Kỹ thuật test nên dùng |
|---|---|---|
| AUTH | Đăng ký: thiếu trường, email sai/trùng, mật khẩu < 6, thành công tạo user + cart + token; đăng nhập sai, tài khoản khóa; refresh token hợp lệ/sai/hết hạn | Equivalence partition, boundary, security |
| PRODUCT | Tìm kiếm, lọc từng điều kiện/kết hợp, giá min–max, phân trang/sắp xếp, slug/id không tồn tại; tạo/sửa/xóa mềm, slug trùng, giá/stock âm, category/brand không tồn tại | Decision table, boundary, CRUD |
| CART | Giỏ rỗng/tự tạo; thêm mới/cộng item; số lượng 0/âm/null; vượt tồn; sửa về 0 (xóa); thao tác item của user khác | State transition, authorization, boundary |
| ADDRESS & PROFILE | Bắt buộc tên/sđt/tỉnh/huyện/xã; tạo/sửa/xóa; đặt địa chỉ mặc định chuyển cờ địa chỉ cũ; chỉ cho phép dữ liệu của chính user | CRUD, authorization |
| COUPON | Mã không tồn tại/tắt/chưa tới ngày/hết hạn/hết lượt/dưới đơn tối thiểu; PERCENT và FIXED; finalPrice không âm; tăng usedCount đúng một lần | Decision table, boundary |
| ORDER | Giỏ trống; địa chỉ không tồn tại/không thuộc user; item request và item từ giỏ; stock thiếu; tổng tiền lấy salePrice; xóa giỏ sau khi tạo; lịch sử/phân trang | End-to-end, transaction |
| PAYMENT | Chỉ chủ đơn được tạo URL; tạo payment lần đầu; callback chữ ký đúng/sai, response 00/khác 00, txnRef lỗi | Integration, negative/security |
| REVIEW | rating 1–5 và ngoài biên; thiếu product; chỉ một review/user/product; cập nhật avgRating khi tạo/xóa; quyền xóa admin | Boundary, authorization |
| ADMIN | USER/khách không truy cập API admin; dashboard; khóa/mở user; CRUD coupon; CRUD product; các trạng thái đơn, đặc biệt DELIVERED và CANCELLED | RBAC, state transition |

## 6. Ma trận trạng thái/expected result quan trọng

| TC group | Tiền điều kiện | Thao tác | Kết quả mong đợi |
|---|---|---|---|
| ORD-STOCK-01 | Đơn chưa DELIVERED, stock đủ | Chuyển sang DELIVERED | stock giảm đúng quantity; sold tăng đúng quantity |
| ORD-STOCK-02 | Đơn đã DELIVERED | Chuyển sang CANCELLED | stock hoàn lại; sold giảm nhưng không âm |
| ORD-STOCK-03 | Stock < quantity | Chuyển sang DELIVERED | Báo lỗi; không đổi đơn, stock, sold |
| CP-01 | Coupon % hợp lệ, total đạt min | Tạo đơn | discount = total × value / 100; usedCount +1 |
| CP-02 | Coupon FIXED > total | Tạo đơn | finalPrice = 0, không âm |
| CART-OWN-01 | Item thuộc user A | User B sửa/xóa | Lỗi; giỏ A không đổi |
| PAY-01 | VNPay trả đúng chữ ký + `00` | Gọi callback | payment COMPLETED, transactionId/paidAt được ghi, order CONFIRMED |

## 7. Điểm cần ưu tiên kiểm thử (rủi ro phát hiện từ mã nguồn)

1. **Kiểm tra quyền sở hữu bị thiếu ở một số API:** `PUT/DELETE /addresses/{id}` chỉ tìm theo `id`, và `GET /orders/{id}` cũng không đối chiếu user hiện tại. Đây là test bảo mật P1: user A không được đọc/sửa/xóa tài nguyên user B.
2. **Sửa số lượng giỏ không kiểm tra tồn kho:** `PUT /cart/items/{itemId}` không so sánh `quantity` với stock. Cần test số lượng vượt kho và xác nhận hệ thống phải chặn ngay hoặc tối thiểu chặn ở bước tạo đơn.
3. **Sản phẩm bị xóa mềm vẫn cần kiểm chứng khi hiển thị:** `DELETE /products/{id}` chỉ đặt `isActive=false`; truy vấn danh sách nên được test để bảo đảm sản phẩm ẩn không xuất hiện nếu đó là yêu cầu nghiệp vụ.
4. **Chuyển trạng thái đơn chưa ràng buộc thứ tự:** API nhận mọi enum status. Test các chuyển trạng thái bất hợp lệ theo quy trình mong muốn (ví dụ CANCELLED → SHIPPING, RETURNED → DELIVERED) để quyết định/ghi nhận yêu cầu.
5. **Đơn hàng không kiểm tra ownership của address:** cần test user A tạo đơn bằng `addressId` của user B. Đây là test phân quyền P1.
6. **Coupon validate ở checkout chưa kiểm `startDate` và `minOrder`;** tạo đơn có kiểm. Cần test tính nhất quán UX/API giữa bước áp mã và bước đặt đơn.

## 8. Gợi ý cấu trúc bộ test case

Tạo các sheet hoặc test suite theo mã: `AUTH`, `CATALOG`, `CART`, `PROFILE_ADDRESS`, `COUPON`, `ORDER`, `PAYMENT`, `REVIEW`, `ADMIN_RBAC`. Mỗi test case nên có: ID, module/use case, priority, precondition, test data, steps, expected result, actual result, status và bug ID.

