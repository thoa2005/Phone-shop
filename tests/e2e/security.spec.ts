import { test, expect, type APIRequestContext, type TestInfo } from '@playwright/test';

// API thật, không mock, không sửa tài khoản/database. Backend cần đang chạy.
const apiURL = process.env.E2E_API_URL || 'http://localhost:8081/api';
const userEmail = process.env.E2E_LOGIN_EMAIL || 'user@phoneshop.vn';
const userPassword = process.env.E2E_LOGIN_PASSWORD || '123456';
const adminEmail = process.env.E2E_ADMIN_EMAIL || 'admin@phoneshop.vn';
const adminPassword = process.env.E2E_ADMIN_PASSWORD || '123456';

test.use({ trace: 'retain-on-failure' });

// Không đưa mật khẩu, JWT hoặc password hash vào file bằng chứng JSON.
function redact(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key,
      /password|token|authorization/i.test(key) ? '[đã che]' : redact(entry),
    ]));
  }
  return value;
}

async function api(request: APIRequestContext, testInfo: TestInfo,
  label: string, method: 'GET' | 'POST', path: string, token?: string, data?: unknown) {
  const response = await request.fetch(`${apiURL}${path}`, {
    method, headers: token ? { Authorization: `Bearer ${token}` } : {},
    ...(data === undefined ? {} : { data }),
  });
  const text = await response.text();
  let body: any;
  try { body = JSON.parse(text); } catch { body = text; }
  await testInfo.attach(label, {
    body: Buffer.from(JSON.stringify({ request: {
      method, url: response.url(), authorization: token ? 'Bearer [đã che]' : '(không gửi)',
      data: redact(data),
    }, response: { status: response.status(), body: redact(body) } }, null, 2)),
    contentType: 'application/json',
  });
  return { status: response.status(), body, text };
}

async function login(request: APIRequestContext, testInfo: TestInfo, role: 'USER' | 'ADMIN') {
  return await test.step(`Chuẩn bị: đăng nhập ${role}, lấy access token`, async () => {
    const email = role === 'USER' ? userEmail : adminEmail;
    const password = role === 'USER' ? userPassword : adminPassword;
    const response = await api(request, testInfo, `Đăng nhập ${role}`, 'POST',
      '/auth/login', undefined, { email, password });
    expect(response.status, 'Tài khoản cần tồn tại, hoạt động và có mật khẩu đúng').toBe(200);
    expect(response.body.user.email).toBe(email);
    expect(response.body.user.role).toBe(role);
    expect(response.body.accessToken).toEqual(expect.any(String));
    expect(response.body.accessToken.length).toBeGreaterThan(0);
    return response.body;
  });
}

function expectNoUserData(response: { body: any; text: string }) {
  expect(response.text, 'Không trả thông tin cá nhân khi truy cập bị từ chối')
    .not.toMatch(/"(?:fullName|email|phone|password|accessToken|refreshToken)"\s*:/);
  expect(response.body?.content, 'Không trả danh sách người dùng').toBeUndefined();
  expect(Array.isArray(response.body)).toBe(false);
}

test('SEC-01: Public - xem sản phẩm không cần JWT', async ({ request }, testInfo) => {
  const response = await test.step('1. GET sản phẩm không gửi Authorization', async () =>
    await api(request, testInfo, 'Sản phẩm public', 'GET', '/products'));
  await test.step('2. Kiểm tra 200 và có cấu trúc danh sách sản phẩm', async () => {
    expect(response.status).toBe(200);
    const products = Array.isArray(response.body) ? response.body : response.body.content;
    expect(Array.isArray(products)).toBe(true);
    // Database test có thể rỗng; không phụ thuộc tên sản phẩm cụ thể.
  });
});

for (const item of [
  { id: 'SEC-02', description: 'Thiếu JWT, API hồ sơ phải trả 401', token: undefined },
  { id: 'SEC-03', description: 'JWT sai, API hồ sơ phải trả 401', token: 'abc.def.ghi' },
]) {
  test(`${item.id}: ${item.description}`, async ({ request }, testInfo) => {
    const response = await test.step('1. Gửi request hồ sơ không có JWT hợp lệ', async () =>
      await api(request, testInfo, item.id, 'GET', '/users/me', item.token));
    await test.step('2. Kiểm tra đúng 401 và không lộ dữ liệu', async () => {
      // Giữ đúng expected result trong bộ testcase: 403 không được tính PASS ở đây.
      expect.soft(response.status).toBe(401);
      expectNoUserData(response);
    });
  });
}

test('SEC-04: USER dùng JWT hợp lệ để xem đúng hồ sơ của mình', async ({ request }, testInfo) => {
  const auth = await login(request, testInfo, 'USER');
  const response = await test.step('1. Gửi access token USER tới API hồ sơ', async () =>
    await api(request, testInfo, 'Hồ sơ USER', 'GET', '/users/me', auth.accessToken));
  await test.step('2. Kiểm tra 200, đúng tài khoản USER và không lộ mật khẩu', async () => {
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ id: auth.user.id, email: userEmail, role: 'USER' });
    expect(response.body).not.toHaveProperty('password');
    expect(response.body).not.toHaveProperty('accessToken');
    expect(response.body).not.toHaveProperty('refreshToken');
  });
});

test('SEC-05: USER bị từ chối 403 khi xem danh sách người dùng', async ({ request }, testInfo) => {
  const auth = await login(request, testInfo, 'USER');
  const response = await test.step('1. USER gọi API dành cho ADMIN', async () =>
    await api(request, testInfo, 'USER truy cập quản trị', 'GET', '/users?page=0&size=20', auth.accessToken));
  await test.step('2. Kiểm tra 403 và không trả danh sách người dùng', async () => {
    expect.soft(response.status).toBe(403);
    expectNoUserData(response);
  });
});

test('SEC-06: ADMIN được xem danh sách người dùng', async ({ request }, testInfo) => {
  const auth = await login(request, testInfo, 'ADMIN');
  const response = await test.step('1. ADMIN gọi API quản lý người dùng', async () =>
    await api(request, testInfo, 'ADMIN truy cập quản trị', 'GET', '/users?page=0&size=20', auth.accessToken));
  await test.step('2. Kiểm tra 200, danh sách phân trang và không trả mật khẩu', async () => {
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.content)).toBe(true);
    expect(response.body.totalElements).toBeGreaterThan(0);
    for (const user of response.body.content) {
      expect(user.email).toEqual(expect.any(String));
      expect(user).not.toHaveProperty('password');
      expect(user).not.toHaveProperty('accessToken');
      expect(user).not.toHaveProperty('refreshToken');
    }
  });
});
