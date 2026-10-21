import { test as base, expect, type Page } from '@playwright/test';
import { randomUUID } from 'node:crypto';

const baseURL = process.env.E2E_BASE_URL || 'http://localhost:3000';
const apiURL = process.env.E2E_API_URL || 'http://localhost:8081/api';
const password = 'QaAddress123';
type AddressData = {
  fullName: string; phone: string; province: string; district: string;
  ward: string; detail: string; isDefault: boolean;
};
const original: AddressData = {
  fullName: 'QA Địa chỉ', phone: '0901234567', province: 'Thành phố Hà Nội',
  district: 'Quận Cầu Giấy', ward: 'Phường Dịch Vọng',
  detail: 'Số 1 Trần Thái Tông', isDefault: true,
};
const second: AddressData = {
  ...original, province: 'Thành phố Đà Nẵng', district: 'Quận Hải Châu',
  ward: 'Phường Thạch Thang', detail: 'Số 20 Bạch Đằng', isDefault: false,
};
type State = {
  email: string; token: string;
  api: (method: 'GET' | 'POST' | 'PUT' | 'DELETE', data?: unknown, id?: number,
    token?: string) => Promise<{ status: number; body: any }>;
};

// Mỗi test có tài khoản USER mới. Teardown chỉ xóa địa chỉ do test này tạo.
const test = base.extend<{ state: State }>({
  state: async ({ request }, use, testInfo) => {
    const email = `qa.address.${randomUUID()}@phoneshop.vn`;
    const registered = await test.step('Chuẩn bị: tạo tài khoản USER riêng', async () => {
      const response = await request.post(`${apiURL}/auth/register`, {
        data: { fullName: original.fullName, phone: original.phone, email, password },
      });
      expect(response.status()).toBe(200);
      return await response.json();
    });
    const token = registered.accessToken;
    expect(token).toBeTruthy();
    const created = new Map<number, string>();
    const api: State['api'] = async (method, data, id, ownerToken = token) => {
      const url = `${apiURL}/addresses${id === undefined ? '' : `/${id}`}`;
      const response = await request.fetch(url, {
        method, headers: { Authorization: `Bearer ${ownerToken}` },
        ...(data === undefined ? {} : { data }),
      });
      const text = await response.text();
      let body: any;
      try { body = JSON.parse(text); } catch { body = text; }
      if (method === 'POST' && response.ok() && typeof body.id === 'number') created.set(body.id, ownerToken);
      if (method === 'DELETE' && response.status() === 204 && id !== undefined) created.delete(id);
      await testInfo.attach(`${method} ${id === undefined ? 'addresses' : `address-${id}`}`, {
        body: Buffer.from(JSON.stringify({ request: { method, url, data },
          response: { status: response.status(), body } }, null, 2)), contentType: 'application/json',
      });
      return { status: response.status(), body };
    };
    try {
      await use({ email, token, api });
    } finally {
      await test.step('Dọn dẹp: xóa địa chỉ của lần chạy này', async () => {
        // Địa chỉ tạo bằng UI: liệt kê trong tài khoản vừa đăng ký, không dùng tài khoản seed.
        const listed = await api('GET');
        expect(listed.status).toBe(200);
        expect(Array.isArray(listed.body)).toBe(true);
        for (const address of listed.body) created.set(address.id, token);
        for (const [id, ownerToken] of created) {
          const result = await api('DELETE', undefined, id, ownerToken);
          expect([204, 404], `Dọn dẹp địa chỉ test #${id}`).toContain(result.status);
        }
        const remaining = await api('GET');
        expect(remaining.body).toEqual([]);
      });
    }
  },
});

test.use({ screenshot: 'on', trace: 'retain-on-failure' });
test.setTimeout(90000);

async function openAddresses(page: Page, state: State) {
  await test.step('Đăng nhập USER và mở Sổ địa chỉ', async () => {
    await page.goto(`${baseURL}/auth/login`);
    await page.locator('input[type="email"]').fill(state.email);
    await page.locator('input[type="password"]').fill(password);
    await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
    await expect(page).toHaveURL(`${baseURL}/`, { timeout: 15000 });
    await page.goto(`${baseURL}/profile`);
    await reloadAddresses(page, false);
  });
}

async function reloadAddresses(page: Page, reload = true) {
  if (reload) await page.reload();
  const loaded = page.waitForResponse(r => r.request().method() === 'GET' &&
    new URL(r.url()).pathname === '/api/addresses');
  await page.getByRole('button', { name: 'Sổ địa chỉ', exact: true }).click();
  expect((await loaded).status()).toBe(200);
  await expect(page.getByRole('heading', { name: 'Sổ địa chỉ', exact: true })).toBeVisible();
}

function modal(page: Page) { return page.locator('div.glass-card').filter({ has: page.locator('form') }); }
function field(page: Page, label: string) {
  return modal(page).locator('label').filter({ hasText: new RegExp(`^${label}$`) }).locator('..');
}
function card(page: Page, detail: string) {
  return page.locator('div.glass-card').filter({ has: page.locator('p').filter({ hasText: detail }) });
}

async function fillAddress(page: Page, data: AddressData) {
  await field(page, 'Họ tên').locator('input').fill(data.fullName);
  await field(page, 'Số điện thoại').locator('input').fill(data.phone);
  const province = field(page, 'Tỉnh / Thành phố').locator('select');
  const district = field(page, 'Quận / Huyện').locator('select');
  const ward = field(page, 'Phường / Xã').locator('select');
  // Dùng danh sách tỉnh/quận/phường thật từ provinces.open-api.vn, không mock.
  await expect(province.locator('option').filter({ hasText: data.province })).toHaveCount(1, { timeout: 15000 });
  await province.selectOption({ label: data.province });
  await expect(district).toBeEnabled({ timeout: 15000 });
  await district.selectOption({ label: data.district });
  await expect(ward).toBeEnabled({ timeout: 15000 });
  await ward.selectOption({ label: data.ward });
  await field(page, 'Địa chỉ chi tiết').locator('input').fill(data.detail);
  await page.getByLabel('Đặt làm địa chỉ mặc định').setChecked(data.isDefault);
}

async function createUI(page: Page, data: AddressData) {
  await page.getByRole('button', { name: 'Thêm địa chỉ', exact: true }).click();
  await fillAddress(page, data);
  const saved = page.waitForResponse(r => r.request().method() === 'POST' &&
    new URL(r.url()).pathname === '/api/addresses');
  await modal(page).getByRole('button', { name: 'Thêm địa chỉ', exact: true }).click();
  expect((await saved).status()).toBe(200);
  await expect(page.getByText('Đã thêm địa chỉ mới', { exact: true })).toBeVisible();
  await expect(card(page, data.detail)).toBeVisible();
}

test.afterEach(async ({ page }, testInfo) => {
  if (!page.isClosed()) await testInfo.attach('Ảnh kết quả địa chỉ', {
    body: await page.screenshot({ fullPage: true }), contentType: 'image/png',
  });
});

// Chỉ tạo địa chỉ tạm isDefault=false cho ADMIN; không thay địa chỉ mặc định có sẵn.
async function prepareAdminAddress(state: State, request: import('@playwright/test').APIRequestContext) {
  const login = await request.post(`${apiURL}/auth/login`, { data: {
    email: process.env.E2E_ADMIN_EMAIL || 'admin@phoneshop.vn',
    password: process.env.E2E_ADMIN_PASSWORD || '123456',
  } });
  expect(login.status()).toBe(200);
  const auth = await login.json();
  expect(auth.user.role).toBe('ADMIN');
  const data = { ...original, fullName: 'QA Địa chỉ ADMIN', detail: `QA ADMIN ${randomUUID()}`, isDefault: false };
  const result = await state.api('POST', data, undefined, auth.accessToken);
  expect(result.status).toBe(200);
  return { id: result.body.id as number, token: auth.accessToken as string, data };
}

test('ADDR-01: Chỉ xem địa chỉ của mình, không thấy địa chỉ ADMIN', async ({ page, request, state }) => {
  const own = await state.api('POST', original);
  expect(own.status).toBe(200);
  const other = await prepareAdminAddress(state, request);
  await openAddresses(page, state);
  await test.step('Kiểm tra danh sách trên UI và API', async () => {
    await expect(card(page, original.detail)).toBeVisible();
    await expect(page.locator('body')).not.toContainText(other.data.detail);
    const list = await state.api('GET');
    expect(list.status).toBe(200);
    expect(list.body.map((a: any) => a.id)).toEqual([own.body.id]);
  });
});

test('ADDR-02: Tạo địa chỉ hợp lệ, dữ liệu còn sau tải lại', async ({ page, state }) => {
  await openAddresses(page, state);
  await test.step('Nhập form và tạo địa chỉ mới', async () => { await createUI(page, second); });
  await test.step('Tải lại và đối chiếu dữ liệu backend', async () => {
    await reloadAddresses(page);
    await expect(card(page, second.detail)).toBeVisible();
    const list = await state.api('GET');
    expect(list.body).toHaveLength(1);
    expect(list.body[0]).toMatchObject(second);
  });
});

test('ADDR-03: Backend từ chối thiếu từng trường bắt buộc', async ({ state }) => {
  for (const name of ['fullName', 'phone', 'province', 'district', 'ward']) {
    await test.step(`Bỏ trống ${name}: phải trả 400 và không tạo địa chỉ`, async () => {
      const result = await state.api('POST', { ...second, [name]: '' });
      expect.soft(result.status).toBe(400);
      expect.soft(result.body.id).toBeUndefined();
    });
  }
  const list = await state.api('GET');
  expect(list.body).toEqual([]);
});

test('ADDR-04: Tạo mặc định mới, địa chỉ cũ bỏ mặc định', async ({ page, state }) => {
  const old = await state.api('POST', original);
  expect(old.status).toBe(200);
  await openAddresses(page, state);
  const newDefault = { ...second, isDefault: true };
  await test.step('Tạo địa chỉ mới và chọn Đặt làm địa chỉ mặc định', async () => { await createUI(page, newDefault); });
  await test.step('Tải lại, kiểm tra chỉ còn một mặc định', async () => {
    await reloadAddresses(page);
    await expect(card(page, second.detail).getByText('Mặc định', { exact: true })).toBeVisible();
    await expect(card(page, original.detail).getByText('Mặc định', { exact: true })).toHaveCount(0);
    const list = await state.api('GET');
    expect(list.body.filter((a: any) => a.isDefault)).toHaveLength(1);
    expect(list.body.find((a: any) => a.id === old.body.id).isDefault).toBe(false);
    expect(list.body.find((a: any) => a.detail === second.detail)).toMatchObject(newDefault);
  });
});

test('ADDR-05: Sửa địa chỉ của mình, dữ liệu còn sau tải lại', async ({ page, state }) => {
  const created = await state.api('POST', original);
  expect(created.status).toBe(200);
  await openAddresses(page, state);
  const updated = { ...original, phone: '0987654321', detail: 'Số 15 Trần Thái Tông' };
  await test.step('Bấm sửa, thay số điện thoại/chi tiết và lưu', async () => {
    await card(page, original.detail).locator('button').filter({ has: page.locator('svg.lucide-pencil') }).click();
    await field(page, 'Số điện thoại').locator('input').fill(updated.phone);
    await field(page, 'Địa chỉ chi tiết').locator('input').fill(updated.detail);
    const saved = page.waitForResponse(r => r.request().method() === 'PUT' &&
      new URL(r.url()).pathname === `/api/addresses/${created.body.id}`);
    await modal(page).getByRole('button', { name: 'Cập nhật', exact: true }).click();
    expect((await saved).status()).toBe(200);
    await expect(page.getByText('Đã cập nhật địa chỉ', { exact: true })).toBeVisible();
  });
  await test.step('Tải lại và đối chiếu địa chỉ đã sửa', async () => {
    await reloadAddresses(page);
    await expect(card(page, updated.detail)).toContainText(updated.phone);
    const list = await state.api('GET');
    expect(list.body.find((a: any) => a.id === created.body.id)).toMatchObject(updated);
  });
});

for (const confirm of [true, false]) {
  test(`${confirm ? 'ADDR-06: Xóa địa chỉ và xác nhận' : 'ADDR-07: Hủy thao tác xóa địa chỉ'}`,
    async ({ page, state }) => {
      const created = await state.api('POST', second);
      expect(created.status).toBe(200);
      await openAddresses(page, state);
      const deletes: string[] = [];
      page.on('request', r => { if (r.method() === 'DELETE' &&
        new URL(r.url()).pathname === `/api/addresses/${created.body.id}`) deletes.push(r.url()); });
      await test.step(`Bấm xóa và ${confirm ? 'xác nhận' : 'hủy'} hộp thoại`, async () => {
        const handled = new Promise<void>(resolve => page.once('dialog', async dialog => {
          expect(dialog.type()).toBe('confirm');
          expect(dialog.message()).toContain('Bạn có chắc muốn xóa');
          if (confirm) await dialog.accept(); else await dialog.dismiss();
          resolve();
        }));
        const deleted = confirm ? page.waitForResponse(r => r.request().method() === 'DELETE' &&
          new URL(r.url()).pathname === `/api/addresses/${created.body.id}`) : undefined;
        await card(page, second.detail).locator('button').filter({ has: page.locator('svg.lucide-trash-2') }).click();
        await handled;
        if (deleted) expect((await deleted).status()).toBe(204);
      });
      await test.step('Tải lại và kiểm tra kết quả trong danh sách', async () => {
        await reloadAddresses(page);
        const list = await state.api('GET');
        if (confirm) {
          expect(deletes).toHaveLength(1);
          await expect(card(page, second.detail)).toHaveCount(0);
          expect(list.body.some((a: any) => a.id === created.body.id)).toBe(false);
        } else {
          expect(deletes).toHaveLength(0);
          await expect(card(page, second.detail)).toBeVisible();
          expect(list.body.find((a: any) => a.id === created.body.id)).toMatchObject(second);
        }
      });
    });
}

test('ADDR-08: USER không được sửa/xóa địa chỉ của ADMIN', async ({ request, state }) => {
  const other = await prepareAdminAddress(state, request);
  await test.step('USER gửi PUT vào ID địa chỉ ADMIN, phải bị từ chối', async () => {
    const result = await state.api('PUT', { ...other.data, detail: 'USER sửa trái phép' }, other.id);
    expect.soft([403, 404]).toContain(result.status);
    const ownerList = await state.api('GET', undefined, undefined, other.token);
    expect.soft(ownerList.body.find((a: any) => a.id === other.id)).toMatchObject(other.data);
  });
  await test.step('USER gửi DELETE vào ID địa chỉ ADMIN, địa chỉ phải còn nguyên', async () => {
    const result = await state.api('DELETE', undefined, other.id);
    expect.soft([403, 404]).toContain(result.status);
    const ownerList = await state.api('GET', undefined, undefined, other.token);
    expect.soft(ownerList.body.find((a: any) => a.id === other.id)).toMatchObject(other.data);
  });
});
