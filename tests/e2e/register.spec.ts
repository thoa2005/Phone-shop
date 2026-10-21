import { test, expect, type Page } from '@playwright/test';

// Chạy frontend, backend và database test trước. Các API không được mock.
const baseURL = process.env.E2E_BASE_URL || 'http://localhost:3000';
type FormData = { fullName: string; email: string; phone: string; password: string };
type Field = keyof FormData;
type RegisterCase = {
  id: string;
  description: string;
  kind: 'success' | 'native-invalid' | 'backend-invalid' | 'duplicate';
  changes?: Partial<FormData>;
  invalidField?: Field;
  validity?: 'valueMissing' | 'typeMismatch' | 'tooShort';
};

const cases: RegisterCase[] = [
  { id: 'REG-01', description: 'Dữ liệu hợp lệ', kind: 'success' },
  { id: 'REG-02', description: 'Họ và tên để trống', kind: 'native-invalid',
    changes: { fullName: '' }, invalidField: 'fullName', validity: 'valueMissing' },
  { id: 'REG-03', description: 'Họ và tên chỉ gồm khoảng trắng', kind: 'backend-invalid',
    changes: { fullName: '   ' } },
  { id: 'REG-04', description: 'Email để trống', kind: 'native-invalid',
    changes: { email: '' }, invalidField: 'email', validity: 'valueMissing' },
  { id: 'REG-05', description: 'Email sai định dạng', kind: 'native-invalid',
    changes: { email: 'nguyenvanan' }, invalidField: 'email', validity: 'typeMismatch' },
  { id: 'REG-06', description: 'Email đã tồn tại', kind: 'duplicate' },
  { id: 'REG-07', description: 'Số điện thoại để trống', kind: 'native-invalid',
    changes: { phone: '' }, invalidField: 'phone', validity: 'valueMissing' },
  { id: 'REG-08', description: 'Mật khẩu để trống', kind: 'native-invalid',
    changes: { password: '' }, invalidField: 'password', validity: 'valueMissing' },
  { id: 'REG-09', description: 'Mật khẩu dưới biên: 5 ký tự', kind: 'native-invalid',
    changes: { password: '12345' }, invalidField: 'password', validity: 'tooShort' },
  { id: 'REG-10', description: 'Mật khẩu đúng biên: 6 ký tự', kind: 'success',
    changes: { password: '123456' } },
  { id: 'REG-11', description: 'Mật khẩu trên biên: 7 ký tự', kind: 'success',
    changes: { password: '1234567' } },
];

test.use({ screenshot: 'on', trace: 'retain-on-failure' });

async function openRegisterForm(page: Page): Promise<void> {
  await page.goto(`${baseURL}/auth/register`);
  await expect(page.getByRole('heading', { name: 'Tạo tài khoản', exact: true })).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  await openRegisterForm(page);
});

async function fillForm(page: Page, data: FormData): Promise<void> {
  await page.locator('input[name="fullName"]').fill(data.fullName);
  await page.locator('input[name="email"]').fill(data.email);
  await page.locator('input[name="phone"]').fill(data.phone);
  const passwordInput = page.locator('input[name="password"]');
  await passwordInput.fill('');
  // Gõ như người dùng thật để trình duyệt áp dụng minlength đúng cho REG-09.
  if (data.password) await passwordInput.pressSequentially(data.password);
}

async function submitRegister(page: Page) {
  // Đợi phản hồi trước khi click để không bỏ lỡ API trả về nhanh.
  const responsePromise = page.waitForResponse(response =>
    response.request().method() === 'POST' &&
    new URL(response.url()).pathname === '/api/auth/register');
  await page.getByRole('button', { name: 'Đăng ký tham gia', exact: true }).click();
  return await responsePromise;
}

async function expectNoSession(page: Page): Promise<void> {
  const cookies = await page.context().cookies(baseURL);
  expect(cookies.some(cookie =>
    ['accessToken', 'refreshToken', 'user'].includes(cookie.name)
  ), 'Đăng ký không được tự tạo phiên đăng nhập trên trình duyệt').toBe(false);
}

// Mỗi phần tử trong cases sinh ra một testcase, có kết quả riêng trong báo cáo.
for (const item of cases) {
  test(`${item.id}: ${item.description}`, async ({ page }, testInfo) => {
    const data: FormData = {
      fullName: 'Nguyễn Văn An',
      email: `qa.${item.id.toLowerCase()}.${Date.now()}.${testInfo.workerIndex}@phoneshop.vn`,
      phone: '0901234567',
      password: '123456',
      ...item.changes,
    };
    testInfo.annotations.push({ type: 'Email test', description: data.email || '(để trống)' });

    if (item.kind === 'duplicate') {
      await test.step('Chuẩn bị: đăng ký tài khoản để email chắc chắn đã tồn tại', async () => {
        await fillForm(page, data);
        expect((await submitRegister(page)).ok()).toBe(true);
        await expect(page).toHaveURL(`${baseURL}/auth/login`, { timeout: 15000 });
        await openRegisterForm(page);
      });
    }

    await test.step('1. Nhập dữ liệu của testcase', async () => {
      await fillForm(page, data);
    });

    if (item.kind === 'native-invalid') {
      const requests: string[] = [];
      page.on('request', request => {
        if (request.method() === 'POST' &&
          new URL(request.url()).pathname === '/api/auth/register') requests.push(request.url());
      });
      await test.step('2. Bấm Đăng ký', async () => {
        await page.getByRole('button', { name: 'Đăng ký tham gia', exact: true }).click();
      });
      await test.step('3. Kiểm tra trình duyệt chặn đúng trường, không gửi API', async () => {
        const input = page.locator(`input[name="${item.invalidField}"]`);
        await expect(input).toBeFocused();
        expect(await input.evaluate((element, property) =>
          (element as HTMLInputElement).validity[property], item.validity!)).toBe(true);
        expect(await input.evaluate(element =>
          (element as HTMLInputElement).validationMessage)).not.toBe('');
        await expect(page).toHaveURL(`${baseURL}/auth/register`);
        await expectNoSession(page);
        expect(requests).toHaveLength(0);
      });
    } else {
      const response = await test.step('2. Bấm Đăng ký và nhận phản hồi', async () => {
        return await submitRegister(page);
      });
      await test.step('3. Kiểm tra kết quả mong đợi', async () => {
        if (item.kind === 'success') {
          expect(response.ok(), 'API đăng ký phải trả 2xx').toBe(true);
          await expect(page.getByText('Đăng ký thành công! Hãy đăng nhập.', { exact: true })).toBeVisible();
          await expect(page).toHaveURL(`${baseURL}/auth/login`, { timeout: 15000 });
        } else {
          expect(response.status()).toBe(400);
          const body = await response.json();
          if (item.kind === 'duplicate') {
            expect(body.message).toBe('Email already in use');
            await expect(page.getByText('Email already in use', { exact: true })).toBeVisible();
          } else {
            // REG-03: tên toàn khoảng trắng phải bị backend từ chối.
            expect(body.errors?.fullName).toBe('Full name is required');
          }
          await expect(page).toHaveURL(`${baseURL}/auth/register`);
        }
        await expectNoSession(page);
      });
    }

    await test.step('4. Lưu ảnh bằng chứng', async () => {
      await testInfo.attach(`${item.id} - kết quả`, {
        body: await page.screenshot({ fullPage: true }), contentType: 'image/png',
      });
    });
  });
}
