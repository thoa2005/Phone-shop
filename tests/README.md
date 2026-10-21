# Test xuyên hệ thống

- `e2e/`: Luồng frontend → backend, ví dụ đăng nhập → giỏ → checkout.
- `database/`: Script kiểm tra ràng buộc, rollback, dữ liệu và đồng thời.
- `fixtures/`: Dữ liệu cố định dùng chung cho test.
- `performance/`: Kịch bản kiểm thử tải và hiệu năng.

## Playwright E2E

Chạy từ thư mục gốc của repo:

```bash
npm ci
npx playwright install --with-deps chromium
npm run test:e2e
```

Mặc định test gọi frontend tại `http://localhost:3000` và backend tại
`http://localhost:8081/api`. Sao chép `.env.e2e.example` thành `.env.e2e` rồi
nạp các biến môi trường trên máy chạy test. Không commit mật khẩu hoặc JWT secret.

Có thể kiểm tra Playwright nhận đủ test mà chưa chạy trình duyệt bằng:

```bash
npm run test:e2e:list
```

