import { test, expect, type Page, type Locator } from '@playwright/test';

// Chạy frontend và backend trước khi chạy file này. Không mock API.
const baseURL = process.env.E2E_BASE_URL || 'http://localhost:3000';
const email = process.env.E2E_LOGIN_EMAIL || 'user@phoneshop.vn';
const password = process.env.E2E_LOGIN_PASSWORD || '123456';
const adminEmail = process.env.E2E_ADMIN_EMAIL || 'admin@phoneshop.vn';
const adminPassword = process.env.E2E_ADMIN_PASSWORD || '123456';

test.use({ screenshot: 'on', trace: 'retain-on-failure' });
// Chạy lần lượt để dễ quan sát và tránh mở nhiều cửa sổ cùng lúc.
test.describe.configure({ mode: 'default' });

// Mỗi test được Playwright cấp một phiên trình duyệt riêng, chưa đăng nhập.
test.beforeEach(async ({ page }) => {
  await page.goto(`${baseURL}/auth/login`);
  await expect(page.getByRole('heading', { name: 'Chào mừng trở lại' })).toBeVisible();
});

async function fillForm(page: Page, inputEmail: string, inputPassword: string) {
  await page.locator('input[type="email"]').fill(inputEmail);
  await page.locator('input[type="password"]').fill(inputPassword);
}

async function expectNoSession(page: Page) {
  await expect(page).toHaveURL(`${baseURL}/auth/login`);
  const cookies = await page.context().cookies(baseURL);
  expect(cookies.some(cookie =>
    ['accessToken', 'refreshToken', 'user'].includes(cookie.name)
  )).toBe(false);
}

async function expectSuccessfulLogin(page: Page) {
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await expect(page.getByText('Đăng nhập thành công!', { exact: true })).toBeVisible();
  await expect(page).toHaveURL(`${baseURL}/`, { timeout: 15000 });
  const cookies = await page.context().cookies(baseURL);
  for (const name of ['accessToken', 'refreshToken', 'user']) {
    expect(cookies.find(cookie => cookie.name === name)?.value,
      `Phải có cookie ${name} sau khi đăng nhập`).toBeTruthy();
  }
}

// Các trường sai/rỗng phải bị trình duyệt chặn, không gửi API đăng nhập.
async function expectInvalidForm(page: Page, field: 'email' | 'password',
  validity: 'valueMissing' | 'typeMismatch') {
  const loginRequests: string[] = [];
  page.on('request', request => {
    if (request.method() === 'POST' && new URL(request.url()).pathname === '/api/auth/login') {
      loginRequests.push(request.url());
    }
  });
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  const input = page.locator(`input[type="${field}"]`);
  await expect(input).toBeFocused();
  expect(await input.evaluate((element, property) =>
    (element as HTMLInputElement).validity[property], validity)).toBe(true);
  await expectNoSession(page);
  expect(loginRequests).toHaveLength(0);
}

async function expectRejectedLogin(page: Page, message: RegExp) {
  // Bắt đầu đợi phản hồi trước khi click để không bỏ lỡ phản hồi nhanh.
  const responsePromise = page.waitForResponse(response =>
    response.request().method() === 'POST' &&
    new URL(response.url()).pathname === '/api/auth/login');
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  const response = await responsePromise;
  expect(response.status()).toBe(401);
  await expect(page.getByText(message)).toBeVisible();
  await expectNoSession(page);
}

test('LOG-01: Email tồn tại, mật khẩu đúng', async ({ page }) => {
  // Tiền điều kiện: tài khoản tồn tại, đang hoạt động, mật khẩu đúng.
  await fillForm(page, email, password);
  await expectSuccessfulLogin(page);
});

test('LOG-02: Bỏ trống email', async ({ page }) => {
  await fillForm(page, '', password);
  await expectInvalidForm(page, 'email', 'valueMissing');
});

test('LOG-03: Email sai định dạng', async ({ page }) => {
  await fillForm(page, 'userphoneshop.vn', password);
  await expectInvalidForm(page, 'email', 'typeMismatch');
});

test('LOG-04: Email không tồn tại', async ({ page }) => {
  // Tiền điều kiện: email này chưa được đăng ký trong database test.
  await fillForm(page, 'notfound@phoneshop.vn', password);
  await expectRejectedLogin(page, /Invalid email or password|Email hoặc mật khẩu không chính xác/);
});

test('LOG-05: Bỏ trống mật khẩu', async ({ page }) => {
  await fillForm(page, email, '');
  await expectInvalidForm(page, 'password', 'valueMissing');
});

test('LOG-06: Email đúng, mật khẩu sai', async ({ page }) => {
  await fillForm(page, email, `${password}-wrong`);
  await expectRejectedLogin(page, /Invalid email or password|Email hoặc mật khẩu không chính xác/);
});

// Tạo tài khoản riêng qua form: không khóa user/admin đang sử dụng.
async function registerTestUser(page: Page, testEmail: string) {
  await page.goto(`${baseURL}/auth/register`);
  await page.locator('input[name="fullName"]').fill('QA Login Lock');
  await page.locator('input[name="email"]').fill(testEmail);
  await page.locator('input[name="phone"]').fill('0901234567');
  await page.locator('input[name="password"]').fill('QaLogin123');
  const responsePromise = page.waitForResponse(response =>
    response.request().method() === 'POST' &&
    new URL(response.url()).pathname === '/api/auth/register');
  await page.getByRole('button', { name: 'Đăng ký tham gia', exact: true }).click();
  expect((await responsePromise).ok(), 'Đăng ký tài khoản test phải thành công').toBe(true);
  await expect(page).toHaveURL(`${baseURL}/auth/login`);
}

async function findAdminUserRow(page: Page, testEmail: string): Promise<Locator> {
  const loaded = page.waitForResponse(response =>
    response.request().method() === 'GET' &&
    new URL(response.url()).pathname === '/api/users');
  await page.goto(`${baseURL}/admin/users`);
  expect((await loaded).ok()).toBe(true);
  await expect(page.getByRole('heading', { name: 'Quản lý Người dùng' })).toBeVisible();
  // Bảng có phân trang; chuyển trang qua nút giao diện, không gọi API thay UI.
  for (let index = 0; index < 100; index++) {
    await expect(page.locator('table:visible tbody tr').first()).toBeVisible();
    const row = page.locator('table:visible tbody tr').filter({
      has: page.getByRole('cell', { name: testEmail, exact: true }),
    });
    if (await row.count()) return row;
    const next = page.locator('button').filter({ has: page.locator('svg.lucide-chevron-right') });
    if (!await next.count() || !await next.isEnabled()) break;
    const nextLoaded = page.waitForResponse(response =>
      response.request().method() === 'GET' && new URL(response.url()).pathname === '/api/users');
    await next.click();
    expect((await nextLoaded).ok()).toBe(true);
  }
  throw new Error(`Không tìm thấy tài khoản test trong giao diện quản trị: ${testEmail}`);
}

async function setUserActive(page: Page, row: Locator, active: boolean) {
  const expectedStatus = active ? 'Hoạt động' : 'Đã khóa';
  if (await row.getByText(expectedStatus, { exact: true }).count()) return;
  const responsePromise = page.waitForResponse(response =>
    response.request().method() === 'PATCH' &&
    /\/api\/users\/\d+\/status$/.test(new URL(response.url()).pathname));
  await row.getByRole('button', { name: active ? 'Mở khóa' : 'Khóa', exact: true }).click();
  expect((await responsePromise).ok(), 'Cập nhật trạng thái phải thành công').toBe(true);
  await expect(row.getByText(expectedStatus, { exact: true })).toBeVisible();
}

for (const id of ['LOG-07', 'LOG-08']) {
  test(`${id}: ${id === 'LOG-07' ? 'Tài khoản bị khóa, mật khẩu đúng' : 'Đăng nhập sau khi được mở khóa'}`,
    async ({ page, browser }, testInfo) => {
      test.setTimeout(90000);
      const testEmail = `qa.${id.toLowerCase()}.${Date.now()}.${testInfo.workerIndex}@phoneshop.vn`;
      testInfo.annotations.push({ type: 'Tài khoản test', description: testEmail });
      await test.step('1. Tạo tài khoản test riêng qua form đăng ký', async () => {
        await registerTestUser(page, testEmail);
      });

      // Hai phiên độc lập: ADMIN khóa/mở khóa, USER thử đăng nhập.
      const adminContext = await browser.newContext();
      const adminPage = await adminContext.newPage();
      let row: Locator | undefined;
      try {
        await test.step('2. Đăng nhập ADMIN và tìm tài khoản test', async () => {
          await adminPage.goto(`${baseURL}/auth/login`);
          await fillForm(adminPage, adminEmail, adminPassword);
          await expectSuccessfulLogin(adminPage);
          row = await findAdminUserRow(adminPage, testEmail);
        });
        await test.step('3. ADMIN bấm Khóa và kiểm tra trạng thái Đã khóa', async () => {
          await setUserActive(adminPage, row!, false);
        });
        if (id === 'LOG-08') {
          await test.step('4. ADMIN bấm Mở khóa và kiểm tra trạng thái Hoạt động', async () => {
            await setUserActive(adminPage, row!, true);
          });
        }
        await test.step('5. USER đăng nhập và kiểm tra kết quả', async () => {
          await fillForm(page, testEmail, 'QaLogin123');
          if (id === 'LOG-07') {
            await expectRejectedLogin(page, /Account is disabled|Tài khoản.*(khóa|vô hiệu)/i);
          } else {
            await expectSuccessfulLogin(page);
          }
        });
      } finally {
        try {
          if (row) {
            await test.step('6. Dọn dẹp: trả tài khoản test về Hoạt động', async () => {
              await setUserActive(adminPage, row!, true);
            });
          }
        } finally {
          await adminContext.close();
        }
      }
    });
}
