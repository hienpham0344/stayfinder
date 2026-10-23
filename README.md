# StayFinder

Ứng dụng tìm và đặt chỗ ở: `Frontend/` dùng Expo React Native + TypeScript, `Backend/` dùng Java 21 + Spring Boot và PostgreSQL/Supabase.

## Chuẩn bị

- Git; Node.js 24.3+ thuộc nhánh 24 và npm để chạy frontend và các test TypeScript trực tiếp. Môi trường kiểm tra hiện tại dùng Node 24.14.1.
- JDK 21, đặt `JAVA_HOME` tới thư mục JDK và thêm `JAVA_HOME/bin` vào `PATH`.
- Maven Wrapper có sẵn trong `Backend/`; lần chạy đầu cần Internet để tải Maven/dependencies. Có thể dùng Maven 3.9.16 đã cài trên máy nếu wrapper gặp lỗi.
- PostgreSQL/Supabase chỉ lưu database; Spring Security quản lý authentication/authorization và JWT. SQL bootstrap/migrations nằm trong [Backend/database](Backend/database/README.md). `ddl-auto: validate` kiểm tra schema, không tạo bảng. Các batch đã phê duyệt mới áp dụng cho schema thử nghiệm; rollout `public` cần phê duyệt riêng.

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
| Access JWT | Thời hạn cố định 15 phút; xem [AUTH](Backend/AUTH.md) |
| `CORS_ALLOWED_ORIGINS` | Origin frontend được phép gọi API, phân tách bằng dấu phẩy; ví dụ `http://localhost:8081` khi Expo dùng cổng này |
| `SEPAY_*` | Cấu hình SePay Test Mode riêng theo [SEPAY](Backend/SEPAY.md); chưa đủ cấu hình thì bank transfer bị tắt |
| `MEDIA_SIGNING_SECRET` | Key riêng ít nhất 32 bytes cho URL ảnh review; xem [MEDIA](Backend/MEDIA.md) |

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

Chạy test không dùng PostgreSQL (các test gắn tag postgres được loại mặc định):

```powershell
cd Backend
.\mvnw.cmd test
```

Build JAR với bộ test mặc định:

```powershell
.\mvnw.cmd test
.\mvnw.cmd verify
java -jar target/stayfinder-0.0.1-SNAPSHOT.jar
```

`StayfinderApplicationTests` và các integration test dùng PostgreSQL chỉ chạy khi bật gate schema thử nghiệm rõ ràng; chúng không tự dùng datasource/public mặc định. Lệnh `verify` đầy đủ có gate và bảng đối chiếu 50 API nằm trong [USER API coverage](Backend/USER_API_COVERAGE.md). Kết quả Maven nằm trong `Backend/target/surefire-reports/`. G3 SePay thật và kiểm tra thiết bị native vẫn riêng biệt.

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

Cấu hình `EXPO_PUBLIC_API_BASE_URL` theo `Frontend/.env.example` (bao gồm `/api`) rồi khởi động lại Expo. Trên thiết bị, dùng địa chỉ API mà thiết bị truy cập được; localhost của thiết bị không trỏ tới máy phát triển. Với web localhost, cấu hình exact CORS origin và cookie theo [AUTH](Backend/AUTH.md).

Các màn USER đã nối production API adapters: tìm kiếm/catalog, wishlist, quote/booking, bank transfer hoặc pay at property, rewards, profile/settings/reports, review/ảnh và inbox. Giá USD cents, trạng thái và quyền thao tác lấy từ server. Dữ liệu so sánh giá/perk là demo có nhãn; không scrape hay hứa dịch vụ thật. `/ui-gallery` vẫn là gallery giao diện.

Route chi tiết dùng UUID từ API: `/room/{id}`. Kiểm tra thêm `/notifications`, các tab và các route booking. Chưa rollout/seed public nên không coi một backend trỏ tới schema public cũ là môi trường đã sẵn sàng.

## Frontend: test và kiểm tra export

Chạy từ `Frontend/`:

```powershell
$taskTests=@(rg --files -g '*.test.mjs' -g '!tests/userApiJourney.test.mjs')
node --test $taskTests
node node_modules/typescript/bin/tsc --noEmit
node node_modules/expo/bin/cli export --platform web --output-dir dist
```

Các test utility/service/store kiểm tra validation, adapters, phiên đăng nhập, stale responses, retry/idempotency, draft booking, rewards, profile/reviews và inbox. HTTP journey được Maven harness cung cấp fixture schema thử nghiệm và chạy riêng; không tính một lần standalone skip là pass. Repo chưa có script lint/test; dùng lệnh trực tiếp. Warning Node không thay thế việc kiểm tra exit code và tổng pass/fail.

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
