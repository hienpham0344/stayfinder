# StayFinder

Ứng dụng tìm và đặt chỗ ở: `Frontend/` dùng Expo React Native + TypeScript, `Backend/` dùng Java 21 + Spring Boot và PostgreSQL/Supabase.

## Chuẩn bị

- Git; Node.js 24.3+ thuộc nhánh 24 và npm để chạy frontend và các test TypeScript trực tiếp. Môi trường kiểm tra hiện tại dùng Node 24.14.1.
- JDK 21, đặt `JAVA_HOME` tới thư mục JDK và thêm `JAVA_HOME/bin` vào `PATH`.
- Maven Wrapper có sẵn trong `Backend/`; lần chạy đầu cần Internet để tải Maven/dependencies. Có thể dùng Maven 3.9.16 đã cài trên máy nếu wrapper gặp lỗi.
- PostgreSQL hoặc Supabase có schema StayFinder tương ứng với các entity backend. Repo hiện không có migration/SQL khởi tạo; cần lấy schema từ nhóm dự án. `ddl-auto: validate` chỉ kiểm tra schema, không tạo bảng.

Các ví dụ dưới đây dùng PowerShell và bắt đầu từ thư mục gốc repository. Trên macOS/Linux, thay `.\mvnw.cmd` bằng `./mvnw`.

Nếu chưa có source code:

```powershell
git clone https://github.com/hienpham0344/stayfinder.git
cd stayfinder
```

## Backend: cấu hình và chạy

```powershell
cd Backend
if (!(Test-Path .env)) { Copy-Item .env.example .env }
```

Chỉ copy khi chưa có `.env`; nếu đã có, giữ cấu hình của bạn. Sửa `.env` bằng thông tin môi trường của bạn:

| Biến | Giá trị cần cấu hình |
| --- | --- |
| `SPRING_DATASOURCE_URL` | JDBC URL PostgreSQL; dùng `sslmode=require` khi nhà cung cấp yêu cầu |
| `SPRING_DATASOURCE_USERNAME` | Username database của bạn |
| `SPRING_DATASOURCE_PASSWORD` | Password database của bạn |
| `JWT_SECRET_BASE64` | Secret Base64 giải mã được thành ít nhất 32 bytes ngẫu nhiên |
| `JWT_EXPIRATION_MINUTES` | Thời hạn JWT, mặc định `60` |
| `CORS_ALLOWED_ORIGINS` | Origin frontend được phép gọi API, phân tách bằng dấu phẩy; ví dụ `http://localhost:8081` khi Expo dùng cổng này |
| `SEPAY_WEBHOOK_SECRET` | Secret của môi trường SePay được cấp; để trống thì webhook không được xác thực thành công |

`.env.example` chỉ là mẫu; thay URL/username mẫu trước khi chạy. Không commit `.env`, mật khẩu hoặc secret. Để tạo JWT secret, dùng bộ sinh ngẫu nhiên mật mã, ví dụ chạy `node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"` trên máy của bạn và lưu kết quả vào `.env`.

Chạy từ `Backend/` để Spring đọc `.env` ở đúng thư mục:

```powershell
java -version
.\mvnw.cmd -version
.\mvnw.cmd spring-boot:run
```

API mặc định tại `http://localhost:8080`. Nếu dùng Maven đã cài, thay `.\mvnw.cmd` bằng `mvn`. Lỗi thiếu biến datasource, JWT secret, kết nối database hoặc schema không khớp cần được xử lý trong cấu hình/database trước khi app khởi động được.

Nếu test báo `class file version 65.0` nhưng runtime chỉ hỗ trợ `61.0`, Maven đang dùng Java 17. Kiểm tra `mvn -version` (hoặc `.\mvnw.cmd -version`) và sửa `JAVA_HOME` tới JDK 21 trở lên; `java -version` trên `PATH` có thể trỏ sang JDK khác với Maven.

## Backend: test và build

Chạy unit test không khởi động Spring context/database:

```powershell
cd Backend
.\mvnw.cmd '-Dtest=!StayfinderApplicationTests' test
```

Chạy toàn bộ test và build JAR sau khi database/schema đã sẵn sàng:

```powershell
.\mvnw.cmd test
.\mvnw.cmd verify
java -jar target/stayfinder-0.0.1-SNAPSHOT.jar
```

`StayfinderApplicationTests` là test khởi động Spring context và cần datasource hoạt động; test này không chứng minh toàn bộ luồng API hay thanh toán end-to-end. Kết quả test nằm trong `Backend/target/surefire-reports/`.

## Frontend: cài đặt và chạy

Mở terminal riêng từ thư mục gốc:

```powershell
cd Frontend
node --version
npm ci
npm run web
```

`npm ci` cài đúng dependency trong `package-lock.json`. Dùng URL được Expo in ra trong terminal. Các lệnh khác:

```powershell
npm start          # mở Expo dev server và quét QR trên thiết bị tương thích
npm run android   # cần Android emulator hoặc thiết bị được kết nối
npm run ios       # cần macOS và iOS Simulator
```

Frontend hiện dùng sample data/local mock cho các màn USER; chưa có API client hay biến base URL để kết nối backend. Có thể chạy UI mà không mở backend. Auth, booking, payment và rewards demo không tạo tài khoản, booking hoặc giao dịch thật.

Một số màn dùng fixture cố định để tái hiện Figma: tổng tiền checkout/confirmation chưa tính lại theo hạng phòng hoặc switch đổi điểm; màn chi tiết hiện hiển thị Villa Azure Retreat. Không dùng các màn demo này để kiểm chứng tính đúng của giá hay luồng đặt phòng thực tế.

Các điểm cần review thêm: Cancel/dismiss trong search picker hiện giữ lại chỉnh sửa; date sheet có thể clipping nút Apply/Cancel trên viewport thấp như 320×568. Các unit test utility bên dưới chưa bao phủ handler/state của màn UI.

Các route để kiểm tra: `/`, `/search`, `/room/villa-azure`, `/room/select`, `/booking/guest-info`, `/booking/checkout`, `/booking/confirmation`, `/bookings`, `/wishlist`, `/rewards`, `/profile`, `/auth/demo` và `/ui-gallery` (các trạng thái shared UI).

## Frontend: test và kiểm tra export

Chạy từ `Frontend/`:

```powershell
node --test utils/bookingPrice.test.mjs utils/demoBookings.test.mjs utils/guestValidation.test.mjs
node node_modules/typescript/bin/tsc --noEmit
node node_modules/expo/bin/cli export --platform web --output-dir dist
```

Ba file test hiện kiểm tra tính giá booking, chuyển trạng thái booking demo và validation thông tin khách. Repo chưa khai báo script lint/test trong `package.json`; dùng các lệnh trực tiếp ở trên. Node có thể báo `MODULE_TYPELESS_PACKAGE_JSON` khi đọc file `.ts`; đây là warning, cần xem exit code và tổng số test pass/fail.

Kiểm tra UI bằng trình duyệt tại viewport **390×844**, rồi **320×844** và **430×844**: xem ảnh/text/icon, spacing, clipping/overflow; thao tác search/filter, chọn phòng, guest validation, các trạng thái checkout, cancellation/review, wishlist, rewards và profile. Kiểm tra console có runtime exception và lưu screenshot cho từng trạng thái cần đối chiếu Figma.

Web export/typecheck/unit test không thay thế kiểm tra trên thiết bị. Animation, blur, shadow, keyboard, safe area và thao tác native cần kiểm tra riêng trên Android/iOS trước khi kết luận parity native.

## QA giao diện và evidence Figma

Chạy `npm run web` từ `Frontend/`, mở URL Expo in ra và dùng chế độ thiết bị của trình duyệt. Reference chuẩn là **390×844**; kiểm tra thêm **320×844**, **430×844** và màn hình thấp như **320×568** để phát hiện overflow hoặc nút bị che. Trên thiết bị Android/iOS, kiểm tra riêng keyboard, safe area, gesture, animation, blur và shadow.

Với từng frame/state cần đối chiếu:

1. Mở đúng Figma node, xem component/state context và prototype; ghi node ID, route và file/component triển khai.
2. So screenshot implementation 390×844 với Figma: kích thước/vị trí, spacing, typography, sample text, ảnh/icon, màu, radius/border, shadow/scrim/opacity và clipping.
3. Thao tác để tái hiện state: chọn tab/filter/ngày/khách/phòng, validation guest, checkout processing/success/failure, cancellation/review, wishlist, rewards và profile. Kiểm tra selected/disabled states, Apply/Cancel, back và dismiss.
4. Chụp thêm 320/430, kiểm tra containment và console không có runtime exception.
5. Ghi screenshot, viewport, platform, source commit/bundle, thao tác đã thực hiện, checks pass/fail và phần chưa kiểm chứng vào evidence report.

Chỉ đánh dấu một row `Verified` khi đủ các gate tương ứng; giữ `Implemented` khi còn khác biệt hoặc thiếu kiểm chứng, và dùng `Blocked` khi thiếu đúng Figma context/assets. Evidence Expo web không chứng nhận behavior native.

QA được giữ local trong `Frontend/qa/`, gồm screenshot, logs, manifest, reports và capture scripts. Thư mục này được ignore bởi `.gitignore`; một bản clone mới không có các evidence/helper local đó. Nếu đã có bộ SE121 local, inventory nằm ở `Frontend/qa/se121/manifest.md`. Không dùng link tới QA local làm bằng chứng mà người review trên GitHub có thể truy cập; chia sẻ evidence riêng khi cần.

Ví dụ cách đặt tên evidence: `Frontend/qa/se121/home-390.png`, `home-320.png`, `home-430.png` và report ghi rõ node/state/platform. Kiểm tra ignore từ thư mục gốc:

```powershell
git check-ignore -v --no-index Frontend/qa/se121/home-390.png
git status --short
```

Ignore không tự bỏ tracking của file đã commit ở nhánh cũ. Nhánh tài liệu này được tạo từ `main` không chứa QA; không cần xóa screenshot hoặc dữ liệu local để áp dụng quy tắc ignore.
