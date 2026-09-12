# NOVA

NOVA là ứng dụng hỗ trợ tập luyện cá nhân với giao diện Dark Mode. Ứng dụng cung cấp giáo án mẫu, trình tạo giáo án riêng, theo dõi số kg/reps qua từng buổi tập, thống kê tiến độ và trợ lý AI.

## Tính năng

- Giáo án mẫu theo nhóm cơ: ngực, lưng, chân, vai, tay trước và bụng.
- Xem thông tin bài tập, hình ảnh và GIF hướng dẫn từ `public/videos`.
- Tạo, chỉnh sửa, xóa và nhân bản giáo án cá nhân.
- Ghi lại số kg, số reps, số set và thời lượng từng buổi tập.
- Tự điền số kg/reps của lần tập gần nhất khi bắt đầu buổi tập.
- Trang tổng quan và trang theo dõi tiến độ với tổng volume, số buổi tập và kỷ lục cá nhân.
- Trợ lý AI Trainer sử dụng Gemini.
- Đăng nhập và đồng bộ tài khoản bằng Clerk.
- Thanh toán gói dịch vụ qua Stripe.

## Công nghệ

- Next.js 16 với App Router
- React 19 và TypeScript
- Tailwind CSS 4
- Prisma với PostgreSQL
- Clerk cho xác thực
- Gemini API cho AI Trainer
- Stripe cho thanh toán
- Lucide React và Framer Motion

## Yêu cầu

- Node.js 20 trở lên
- PostgreSQL
- Tài khoản Clerk nếu cần đăng nhập
- Gemini API key nếu dùng AI Trainer
- Stripe keys nếu dùng thanh toán

## Cài đặt

```bash
git clone <url-cua-repository>
cd nova
npm install
```

Tạo file `.env` ở thư mục gốc:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/nova"
DATABASE_POOL_MAX="10"

NEXT_PUBLIC_APP_URL="http://localhost:3000"

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."

GEMINI_API_KEY="your-gemini-api-key"

STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
```

Sau đó tạo Prisma Client và chạy migration:

```bash
npx prisma generate
npx prisma migrate dev
```

Để nạp thư viện bài tập và giáo án mẫu:

```bash
npx prisma db seed
```

## Chạy dự án

Chạy môi trường phát triển:

```bash
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000).

Build và chạy production:

```bash
npm run build
npm run start
```

Kiểm tra lint:

```bash
npm run lint
```

## Các trang chính

- `/`: Trang giới thiệu NOVA, tính năng, bảng giá và liên hệ.
- `/programs`: Danh sách giáo án mẫu.
- `/programs/[id]`: Chi tiết và buổi tập của giáo án mẫu.
- `/routine`: Tạo và quản lý giáo án cá nhân.
- `/programs/custom/[id]`: Buổi tập của giáo án cá nhân.
- `/dashboard`: Tổng quan hoạt động tập luyện.
- `/progress`: Lịch sử tập, volume và kỷ lục cá nhân.
- `/trainer`: Trò chuyện với AI Trainer.

## Cấu trúc thư mục quan trọng

```text
src/
  app/                  Các trang và API Route
  components/           Thành phần giao diện
  context/              React Context dùng chung
  data/                 Dữ liệu giáo án và bài tập
  lib/                  Prisma, Stripe và tiện ích xác thực
  types/                Kiểu dữ liệu TypeScript
prisma/
  schema.prisma         Mô hình cơ sở dữ liệu
  seed.ts               Dữ liệu khởi tạo
public/
  images/               Ảnh bài tập và giao diện
  videos/               GIF hướng dẫn bài tập
```

## Dữ liệu bài tập

File `src/data/exercises.json` là dữ liệu bài tập gốc và không nên chỉnh sửa trực tiếp để dịch tên hoặc mô tả. Các bản dịch hiển thị được đặt trong `src/data/exerciseTranslations.ts`.

Ảnh và GIF cục bộ được đọc từ:

- `public/images`
- `public/videos`

## Database

Các bảng chính gồm:

- `User`: tài khoản người dùng.
- `Exercise`: thư viện bài tập.
- `Routine`: giáo án mẫu hoặc giáo án cá nhân.
- `RoutineItem`: bài tập thuộc giáo án.
- `WorkoutLog`: lịch sử buổi tập.
- `WorkoutLogItem`: số kg và reps thực tế của từng set.
- `TrainerSession` và `TrainerMessage`: lịch sử trò chuyện AI.
- `Subscription`: thông tin gói Stripe.

Khi thay đổi schema, tạo migration bằng:

```bash
npx prisma migrate dev --name ten-thay-doi
```

Không commit các khóa bí mật trong `.env` hoặc mã nguồn.
