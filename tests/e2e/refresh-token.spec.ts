import { test, expect, type APIRequestContext, type Page, type TestInfo } from '@playwright/test';
import { createHmac } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const frontendURL = process.env.E2E_BASE_URL || 'http://localhost:3000';
const apiURL = process.env.E2E_API_URL || 'http://localhost:8081/api';
const email = process.env.E2E_LOGIN_EMAIL || 'user@phoneshop.vn';
const password = process.env.E2E_LOGIN_PASSWORD || '123456';

// Không mock response, không thay cấu hình backend, không sửa database.
test.use({ screenshot: 'on', trace: 'retain-on-failure' });
test.setTimeout(45000);

type LoginData = {
  accessToken: string;
  refreshToken: string;
  user: { id: number; email: string; [key: string]: unknown };
};

// Bằng chứng JSON che mật khẩu/token; trace vẫn có thể chứa token test thật.
function redact(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key,
      /password|token|authorization/i.test(key) && entry ? '[đã che]' : redact(entry),
    ]));
  }
  return value;
}

async function callAPI(request: APIRequestContext, testInfo: TestInfo,
  label: string, method: 'GET' | 'POST', path: string,
  data?: unknown, bearer?: string) {
  const response = await request.fetch(`${apiURL}${path}`, {
    method, ...(data === undefined ? {} : { data }),
    headers: bearer ? { Authorization: `Bearer ${bearer}` } : {},
  });
  const text = await response.text();
  let body: any;
  try { body = JSON.parse(text); } catch { body = text; }
  await testInfo.attach(label, {
    body: Buffer.from(JSON.stringify({
      request: { method, url: response.url(), data: redact(data),
        authorization: bearer ? 'Bearer [đã che]' : '(không có)' },
      response: { status: response.status(), body: redact(body) },
    }, null, 2)), contentType: 'application/json',
  });
  return { status: response.status(), body };
}

async function login(request: APIRequestContext, testInfo: TestInfo): Promise<LoginData> {
  return await test.step('Chuẩn bị: đăng nhập lấy token hợp lệ', async () => {
    const result = await callAPI(request, testInfo, 'Đăng nhập', 'POST', '/auth/login', { email, password });
    expect(result.status, 'Backend phải chạy và tài khoản phải hoạt động').toBe(200);
    expect(result.body.accessToken).toEqual(expect.any(String));
    expect(result.body.refreshToken).toEqual(expect.any(String));
    expect(result.body.user.email).toBe(email);
    return result.body;
  });
}

// Fixture thời gian chỉ cho localhost: ký JWT hợp lệ nhưng exp đã ở quá khứ.
// Kiểm tra khóa khớp token đăng nhập trước, tránh nhầm lỗi chữ ký với lỗi hết hạn.
function expiredToken(validToken: string): string {
  expect(['localhost', '127.0.0.1', '[::1]']).toContain(new URL(apiURL).hostname);
  const properties = process.env.E2E_JWT_SECRET ? '' : readFileSync(resolve(
    'phoneshop-backend/src/main/resources/application.properties'), 'utf8');
  const secret = process.env.E2E_JWT_SECRET || properties.match(/^jwt\.secret\s*=\s*(.+)$/m)?.[1].trim();
  if (!secret) throw new Error('Cần E2E_JWT_SECRET của backend test để chuẩn bị token hết hạn.');
  const [header, payload, signature] = validToken.split('.');
  expect(JSON.parse(Buffer.from(header, 'base64url').toString()).alg).toBe('HS256');
  const sign = (content: string) => createHmac('sha256', secret).update(content).digest('base64url');
  expect(sign(`${header}.${payload}`), 'Khóa fixture phải khớp backend đang chạy').toBe(signature);
  const claims = JSON.parse(Buffer.from(payload, 'base64url').toString());
  const now = Math.floor(Date.now() / 1000);
  const expiredPayload = Buffer.from(JSON.stringify({ ...claims, iat: now - 7200, exp: now - 3600 }))
    .toString('base64url');
  const content = `${header}.${expiredPayload}`;
  return `${content}.${sign(content)}`;
}

async function installSession(page: Page, session: LoginData,
  accessToken: string, refreshToken: string): Promise<void> {
  await page.context().addCookies([
    { name: 'accessToken', value: accessToken, url: frontendURL },
    { name: 'refreshToken', value: refreshToken, url: frontendURL },
    { name: 'user', value: encodeURIComponent(JSON.stringify(session.user)), url: frontendURL },
  ]);
}

function observeFrontend(page: Page) {
  const events: { method: string; path: string; status: number }[] = [];
  page.on('response', response => {
    const path = new URL(response.url()).pathname;
    if (path === '/api/auth/refresh' || path === '/api/orders') {
      events.push({ method: response.request().method(), path, status: response.status() });
    }
  });
  return events;
}

async function attachUI(page: Page, testInfo: TestInfo, events: unknown) {
  await testInfo.attach('API trên giao diện', {
    body: Buffer.from(JSON.stringify({ url: page.url(), events }, null, 2)),
    contentType: 'application/json',
  });
  await testInfo.attach('Ảnh trạng thái giao diện', {
    body: await page.screenshot({ fullPage: true }), contentType: 'image/png',
  });
}

test('REFRESH-01: Refresh token hợp lệ cấp access token dùng được', async ({ request }, testInfo) => {
  const session = await login(request, testInfo);
  const result = await test.step('1. Gửi refresh token hợp lệ', async () =>
    await callAPI(request, testInfo, 'Refresh hợp lệ', 'POST', '/auth/refresh', {
      refreshToken: session.refreshToken,
    }));
  await test.step('2. Kiểm tra token trả về và đúng người dùng', async () => {
    expect(result.status).toBe(200);
    expect(result.body.accessToken).toEqual(expect.any(String));
    expect(result.body.accessToken.length).toBeGreaterThan(0);
    expect(result.body.refreshToken).toEqual(expect.any(String));
    expect(result.body.user.email).toBe(email);
    expect(result.body.user.id).toBe(session.user.id);
    // Không yêu cầu chuỗi access token khác: phát hành cùng giây có thể trùng.
  });
  await test.step('3. Dùng access token vừa nhận để xem hồ sơ', async () => {
    const profile = await callAPI(request, testInfo, 'Hồ sơ với token mới', 'GET',
      '/users/me', undefined, result.body.accessToken);
    expect(profile.status).toBe(200);
    expect(profile.body.email).toBe(email);
    expect(profile.body.id).toBe(session.user.id);
  });
});

test('REFRESH-02: Access hết hạn, frontend tự refresh và gửi lại request',
  async ({ request, page }, testInfo) => {
    const session = await login(request, testInfo);
    const expiredAccess = expiredToken(session.accessToken);
    await test.step('1. Chuẩn bị access hết hạn và refresh còn hiệu lực', async () => {
      await installSession(page, session, expiredAccess, session.refreshToken);
    });
    const events = observeFrontend(page);
    try {
      await test.step('2. Mở hồ sơ để frontend gọi API cần đăng nhập', async () => {
        await page.goto(`${frontendURL}/profile`, { waitUntil: 'domcontentloaded' });
      });
      await test.step('3. Kiểm tra refresh thành công, request gửi lại và phiên còn hiệu lực', async () => {
        await expect.poll(() => events.some(e => e.path === '/api/auth/refresh' && e.status === 200)).toBe(true);
        await expect.poll(() => events.some(e => e.path === '/api/orders' && e.status === 200)).toBe(true);
        expect(events.some(e => e.path === '/api/orders' && [401, 403].includes(e.status))).toBe(true);
        await expect(page).toHaveURL(`${frontendURL}/profile`);
        const cookies = await page.context().cookies(frontendURL);
        const access = cookies.find(c => c.name === 'accessToken')?.value;
        expect(access).toBeTruthy();
        expect(access).not.toBe(expiredAccess);
        expect(cookies.find(c => c.name === 'user')).toBeTruthy();
        const profile = await callAPI(request, testInfo, 'Xác minh phiên sau tự refresh',
          'GET', '/users/me', undefined, access);
        expect(profile.status).toBe(200);
        expect(profile.body.email).toBe(email);
      });
    } finally { await attachUI(page, testInfo, events); }
  });

for (const item of [
  { id: 'REFRESH-03', description: 'Không gửi refresh token', data: {} },
  { id: 'REFRESH-04', description: 'Refresh token sai định dạng', data: { refreshToken: 'abc.def.ghi' } },
]) {
  test(`${item.id}: ${item.description}`, async ({ request }, testInfo) => {
    const result = await test.step('1. Gửi dữ liệu không hợp lệ', async () =>
      await callAPI(request, testInfo, item.id, 'POST', '/auth/refresh', item.data));
    await test.step('2. Kiểm tra 401 và không cấp token', async () => {
      expect.soft(result.status).toBe(401);
      expect.soft(result.body.message).toBe('Invalid refresh token');
      expect(result.body.accessToken).toBeFalsy();
    });
  });
}

test('REFRESH-05: Refresh hết hạn bị từ chối, frontend xóa phiên', async ({ request, page }, testInfo) => {
  const session = await login(request, testInfo);
  const expiredAccess = expiredToken(session.accessToken);
  const expiredRefresh = expiredToken(session.refreshToken);
  await test.step('1. Gửi refresh token có chữ ký đúng nhưng đã hết hạn', async () => {
    const result = await callAPI(request, testInfo, 'Refresh hết hạn', 'POST', '/auth/refresh', {
      refreshToken: expiredRefresh,
    });
    expect.soft(result.status).toBe(401);
    expect.soft(result.body.message).toBe('Invalid refresh token');
    expect.soft(result.body.accessToken).toBeFalsy();
  });
  const events = observeFrontend(page);
  try {
    await test.step('2. Chuẩn bị phiên có cả access và refresh hết hạn, mở hồ sơ', async () => {
      await installSession(page, session, expiredAccess, expiredRefresh);
      await page.goto(`${frontendURL}/profile`, { waitUntil: 'domcontentloaded' });
    });
    await test.step('3. Kiểm tra refresh bị từ chối, xóa cookie và về đăng nhập', async () => {
      await expect.poll(() => events.some(e => e.path === '/api/auth/refresh')).toBe(true);
      expect.soft(events.find(e => e.path === '/api/auth/refresh')?.status).toBe(401);
      await expect(page).toHaveURL(`${frontendURL}/auth/login`, { timeout: 15000 });
      await expect(page.getByRole('heading', { name: 'Chào mừng trở lại' })).toBeVisible();
      const cookies = await page.context().cookies(frontendURL);
      expect(cookies.some(c => ['accessToken', 'refreshToken', 'user'].includes(c.name))).toBe(false);
    });
  } finally { await attachUI(page, testInfo, events); }
});

test('REFRESH-06: Dùng lại refresh token phải bị từ chối theo yêu cầu chống replay',
  async ({ request }, testInfo) => {
    const session = await login(request, testInfo);
    await test.step('1. Dùng refresh token lần đầu', async () => {
      const first = await callAPI(request, testInfo, 'Refresh lần 1', 'POST', '/auth/refresh', {
        refreshToken: session.refreshToken,
      });
      expect(first.status).toBe(200);
      expect(first.body.accessToken).toBeTruthy();
    });
    await test.step('2. Dùng lại đúng token cũ, kiểm tra bị từ chối', async () => {
      const second = await callAPI(request, testInfo, 'Replay lần 2', 'POST', '/auth/refresh', {
        refreshToken: session.refreshToken,
      });
      expect.soft(second.status, 'Yêu cầu chống replay trong testcase: lần hai trả 401').toBe(401);
      expect.soft(second.body.accessToken, 'Không cấp access token khi replay').toBeFalsy();
    });
  });
