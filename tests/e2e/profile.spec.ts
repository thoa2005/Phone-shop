import { test, expect, type Page, type APIRequestContext, type TestInfo } from '@playwright/test';
import { randomUUID } from 'node:crypto';

const baseURL = process.env.E2E_BASE_URL || 'http://localhost:3000';
const apiURL = process.env.E2E_API_URL || 'http://localhost:8081/api';
const original = { fullName: 'QA Hồ sơ', phone: '0901234567' };
const testPassword = 'QaProfile123';
type Account = { email: string; accessToken: string; id: number };

test.use({ screenshot: 'on', trace: 'retain-on-failure' });
test.setTimeout(60000);

async function prepareAccount(request: APIRequestContext, testInfo: TestInfo): Promise<Account> {
  return await test.step('Chuẩn bị: tạo tài khoản test riêng qua API', async () => {
    const email = `qa.profile.${randomUUID()}@phoneshop.vn`;
    const response = await request.post(`${apiURL}/auth/register`, {
      data: { ...original, email, password: testPassword },
    });
    expect(response.status(), 'Backend và database test phải đang chạy').toBe(200);
    const body = await response.json();
    expect(body.user.email).toBe(email);
    expect(body.accessToken).toBeTruthy();
    await testInfo.attach('Tài khoản chuẩn bị', {
      body: Buffer.from(JSON.stringify({ email, id: body.user.id, ...original }, null, 2)),
      contentType: 'application/json',
    });
    return { email, accessToken: body.accessToken, id: body.user.id };
  });
}

async function loginUI(page: Page, account: Account): Promise<void> {
  await page.goto(`${baseURL}/auth/login`);
  await page.locator('input[type="email"]').fill(account.email);
  await page.locator('input[type="password"]').fill(testPassword);
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await expect(page).toHaveURL(`${baseURL}/`, { timeout: 15000 });
  await expect(page.getByRole('button', { name: 'Đăng xuất', exact: true })).toBeVisible();
}

async function openInfo(page: Page): Promise<void> {
  await page.goto(`${baseURL}/profile`);
  await page.getByRole('button', { name: 'Thông tin cá nhân', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Thông tin cá nhân', exact: true })).toBeVisible();
}

// Nhãn của form chưa có htmlFor; định vị vùng bao quanh nhãn tương ứng.
function field(page: Page, name: string) {
  return page.locator('label').filter({ hasText: new RegExp(`^${name}$`) }).locator('..');
}

async function expectDisplayed(page: Page, account: Account, fullName: string, phone: string) {
  await expect(field(page, 'Họ và tên')).toContainText(fullName);
  await expect(field(page, 'Email')).toContainText(account.email);
  await expect(field(page, 'Số điện thoại')).toContainText(phone);
}

async function getProfile(request: APIRequestContext, account: Account, testInfo: TestInfo, label: string) {
  const response = await request.get(`${apiURL}/users/me`, {
    headers: { Authorization: `Bearer ${account.accessToken}` },
  });
  const text = await response.text();
  // GET hồ sơ không được trả mật khẩu hay token; chỉ lưu evidence đã che nếu gặp lỗi đó.
  await testInfo.attach(label, {
    body: Buffer.from(JSON.stringify({ method: 'GET', url: response.url(), status: response.status(),
      response: text.replace(/("(?:password|accessToken|refreshToken)"\s*:\s*")[^"]*/gi, '$1[đã che]'),
    }, null, 2)), contentType: 'application/json',
  });
  expect(response.status()).toBe(200);
  return await response.json();
}

// Ảnh được lưu cả khi FAIL; trace được giữ nếu test thất bại.
test.afterEach(async ({ page }, testInfo) => {
  if (!page.isClosed()) {
    await testInfo.attach('Ảnh kết quả hồ sơ', {
      body: await page.screenshot({ fullPage: true }), contentType: 'image/png',
    });
  }
});

test('PROFILE-01: Xem đúng hồ sơ, không để lộ mật khẩu', async ({ page, request }, testInfo) => {
  const account = await prepareAccount(request, testInfo);
  await test.step('1. Đăng nhập và mở Thông tin cá nhân', async () => {
    await loginUI(page, account);
    await openInfo(page);
  });
  await test.step('2. Kiểm tra họ tên, email, số điện thoại trên giao diện', async () => {
    await expectDisplayed(page, account, original.fullName, original.phone);
    await expect(page.locator('input[type="password"]')).toHaveCount(0);
    await expect(page.locator('body')).not.toContainText(testPassword);
  });
  await test.step('3. Đối chiếu API hồ sơ và kiểm tra không trả mật khẩu', async () => {
    const profile = await getProfile(request, account, testInfo, 'Hồ sơ hiện tại');
    expect(profile).toMatchObject({ id: account.id, email: account.email, ...original });
    expect(profile).not.toHaveProperty('password');
    expect(profile).not.toHaveProperty('accessToken');
    expect(profile).not.toHaveProperty('refreshToken');
  });
});

test('PROFILE-02: Chưa đăng nhập không được xem dữ liệu hồ sơ', async ({ page, request }, testInfo) => {
  await test.step('1. Truy cập API hồ sơ không có Authorization', async () => {
    const response = await request.get(`${apiURL}/users/me`);
    const text = await response.text();
    await testInfo.attach('Hồ sơ không token', {
      body: Buffer.from(JSON.stringify({ status: response.status(), body: text }, null, 2)),
      contentType: 'application/json',
    });
    expect([401, 403]).toContain(response.status());
    expect(text).not.toMatch(/"(?:fullName|email|phone|password)"\s*:/);
  });
  await test.step('2. Mở trang hồ sơ bằng phiên trình duyệt mới', async () => {
    await page.goto(`${baseURL}/profile`, { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(`${baseURL}/auth/login`, { timeout: 15000 });
    await expect(page.getByRole('heading', { name: 'Chào mừng trở lại' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Thông tin cá nhân', exact: true })).toHaveCount(0);
    const cookies = await page.context().cookies(baseURL);
    expect(cookies.some(c => ['user', 'accessToken', 'refreshToken'].includes(c.name))).toBe(false);
  });
});

test('PROFILE-03: Cập nhật hồ sơ, dữ liệu còn sau tải lại và đăng nhập lại',
  async ({ page, request }, testInfo) => {
    const account = await prepareAccount(request, testInfo);
    const updated = { fullName: 'Nguyễn Văn An', phone: '0987654321' };
    let saveAttempted = false;
    try {
      await test.step('1. Đăng nhập, mở hồ sơ và nhập dữ liệu mới', async () => {
        await loginUI(page, account);
        await openInfo(page);
        await page.getByRole('button', { name: 'Chỉnh sửa', exact: true }).click();
        await field(page, 'Họ và tên').locator('input').fill(updated.fullName);
        await field(page, 'Số điện thoại').locator('input').fill(updated.phone);
        await expect(field(page, 'Email').locator('input')).toHaveCount(0);
      });
      await test.step('2. Lưu và kiểm tra thông báo thành công', async () => {
        const saved = page.waitForResponse(response => response.request().method() === 'PUT' &&
          new URL(response.url()).pathname === '/api/users/me');
        saveAttempted = true;
        await page.getByRole('button', { name: 'Lưu thay đổi', exact: true }).click();
        expect((await saved).status()).toBe(200);
        await expect(page.getByText('Cập nhật thông tin thành công', { exact: true })).toBeVisible();
        await expectDisplayed(page, account, updated.fullName, updated.phone);
      });
      await test.step('3. Tải lại trang và đối chiếu dữ liệu lưu trong backend', async () => {
        await page.reload();
        await page.getByRole('button', { name: 'Thông tin cá nhân', exact: true }).click();
        await expectDisplayed(page, account, updated.fullName, updated.phone);
        const profile = await getProfile(request, account, testInfo, 'Hồ sơ sau lưu');
        expect(profile).toMatchObject({ id: account.id, email: account.email, ...updated });
      });
      await test.step('4. Đăng xuất, đăng nhập lại và kiểm tra dữ liệu vẫn còn', async () => {
        await page.getByRole('button', { name: 'Đăng xuất', exact: true }).click();
        await loginUI(page, account);
        await openInfo(page);
        await expectDisplayed(page, account, updated.fullName, updated.phone);
        await testInfo.attach('Bằng chứng dữ liệu được lưu', {
          body: await page.screenshot({ fullPage: true }), contentType: 'image/png',
        });
      });
    } finally {
      if (saveAttempted) {
        await test.step('Dọn dẹp: khôi phục hồ sơ tài khoản test về ban đầu qua API', async () => {
          const restored = await request.put(`${apiURL}/users/me`, {
            headers: { Authorization: `Bearer ${account.accessToken}` }, data: original,
          });
          expect(restored.status(), 'Khôi phục dữ liệu test phải thành công').toBe(200);
          const profile = await getProfile(request, account, testInfo, 'Hồ sơ sau khôi phục');
          expect(profile).toMatchObject(original);
        });
      }
    }
  });

test('PROFILE-04: Hủy cập nhật, không gửi PUT và không đổi dữ liệu', async ({ page, request }, testInfo) => {
  const account = await prepareAccount(request, testInfo);
  const updates: string[] = [];
  page.on('request', req => {
    if (req.method() === 'PUT' && new URL(req.url()).pathname === '/api/users/me') updates.push(req.url());
  });
  await test.step('1. Đăng nhập và nhập dữ liệu sửa tạm thời', async () => {
    await loginUI(page, account);
    await openInfo(page);
    await page.getByRole('button', { name: 'Chỉnh sửa', exact: true }).click();
    await field(page, 'Họ và tên').locator('input').fill('Dữ liệu không được lưu');
    await field(page, 'Số điện thoại').locator('input').fill('0111111111');
  });
  await test.step('2. Nhấn Hủy và kiểm tra giao diện giữ dữ liệu ban đầu', async () => {
    await page.getByRole('button', { name: 'Hủy', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Chỉnh sửa', exact: true })).toBeVisible();
    await expectDisplayed(page, account, original.fullName, original.phone);
  });
  await test.step('3. Tải lại và kiểm tra backend không lưu dữ liệu tạm', async () => {
    await page.reload();
    await page.getByRole('button', { name: 'Thông tin cá nhân', exact: true }).click();
    await expectDisplayed(page, account, original.fullName, original.phone);
    await expect(page.locator('body')).not.toContainText('Dữ liệu không được lưu');
    const profile = await getProfile(request, account, testInfo, 'Hồ sơ sau Hủy');
    expect(profile).toMatchObject({ email: account.email, ...original });
    expect(updates, 'Không được gửi PUT khi nhấn Hủy').toHaveLength(0);
  });
});
