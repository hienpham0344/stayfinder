# StayFinder — báo cáo kiểm tra và hoàn thiện backend

Ngày kiểm tra: **19/11/2026**, giờ Việt Nam. Phạm vi: một backend Spring Boot hiện tại, PostgreSQL, CUSTOMER/PARTNER/ADMIN, SePay Test mode, một phòng vật lý mỗi đơn. Không triển khai production hoặc chạy migration trên database đang sử dụng.

**Trạng thái bàn giao mã nguồn:** code chức năng đã triển khai; Maven `verify` cuối có **138 test, 0 failure/error/skipped**, trong đó **23 test tích hợp PostgreSQL**. Migration có **6 test riêng đạt**. Frontend typecheck, 9 test và web export đạt. Bộ đo cache bật/tắt đã đủ sáu lượt, đạt budget trên workload đã đo; không dùng kết quả phiên bị ngắt. Toàn bộ **36 operation quản trị** đã được kiểm tra từ chối anonymous/sai role qua SecurityFilterChain thực.

## 1. Cách đọc bằng chứng

- **Đạt:** có code và kết quả test thực tế trong phạm vi nêu rõ; không đồng nghĩa bảo đảm không có lỗi.
- **Chưa đạt:** có yêu cầu hoặc lỗi chưa xử lý.
- **Chưa xác minh:** chưa chạy kiểm tra tương ứng, hoặc thiếu môi trường/dịch vụ thực.
- Đường dẫn `src/...:dòng` bên dưới tính từ `Backend/`. Kết quả máy đọc nằm trong [docs/evidence](docs/evidence/). Không lưu token, mật khẩu, `.env` hoặc dữ liệu thật vào bằng chứng.
- Baseline ban đầu trong phiên trước: 56 test đạt; raw log tạm không còn sau khi môi trường khởi động lại. Đây là lịch sử quan sát, không thay cho kết quả mới trong [tests.json](docs/evidence/tests.json).

## 2. Phần 0 — môi trường, schema, API

**Hiện trạng ban đầu:** có Java/Spring Security/JPA/JWT/BCrypt và test dùng mock; chưa có bằng chứng PostgreSQL/concurrency/benchmark đầy đủ. Maven Wrapper phải gọi bằng `bash ./mvnw` trên checkout này.

**Đã triển khai:**

- Test dùng `application-test.yaml` qua Surefire `spring.config.location`, tách khỏi cấu hình datasource và `.env` của ứng dụng. Hibernate chỉ `validate`, không `ddl-auto=update`.
- Migration theo thứ tự `000_baseline.sql` → `001_public_local_auth_integrity.sql` → `002_backend_capabilities.sql` → `003_operations_pagination.sql`. `000` chỉ dành cho database trống; không tự chạy migration khi app khởi động.
- Script `scripts/test-database.sh` giới hạn localhost và database `stayfinder_test`. Fixture tích hợp kiểm tra lại tên database trước khi reset đúng nhóm bảng test.
- `scripts/test-migrations.py` dùng database khác `stayfinder_migration_test`, yêu cầu marker riêng trước khi reset schema; kiểm tra dữ liệu cũ, replay và rollback.
- Hợp đồng [OpenAPI](docs/openapi.yaml): 60 path, 71 operation; generator stdlib và test đối chiếu route Spring thực. Có request/response DTO, role, phân trang và lỗi; không thêm thư viện tài liệu.
- CI PostgreSQL 16 + Java 21 chạy migration, Maven verify, regression migration và lưu test reports. Chưa chạy hosted GitHub Actions từ phiên này.

**Kiểm chứng:** PostgreSQL **16.15**, Java **21.0.13**; dựng mới hai database test/benchmark từ migration `000`–`003`; không kết nối database thật. Bộ fixture benchmark: 1.000 accommodation, 10.000 room, 100.000 booking/payment/ledger, 10.000 review. Kết quả legacy migration tại [migrations.json](docs/evidence/migrations.json).

**Trạng thái:** đạt trên database tổng hợp tại máy test; schema và dữ liệu database đang dùng **chưa xác minh**. Hướng backup/backfill/khôi phục trong [OPERATIONS.md](docs/OPERATIONS.md).

| Phần | Kết luận | Giới hạn cần giữ rõ |
| --- | --- | --- |
| 0 — môi trường/schema/API | Đạt trên database test mới và legacy fixture | Database thật và hosted CI chưa xác minh |
| 1 — bảo mật/tài khoản | Đạt automated auth/RBAC/ownership | Chưa pentest bên ngoài hoặc kiểm tra reverse proxy thực |
| 2 — dữ liệu CUSTOMER | Đạt backend test và frontend build/checks | Chưa thao tác trên thiết bị thật |
| 3 — PARTNER | Đạt API/ownership/moderation/concurrency | Chưa có UI hoặc HTTP load test riêng |
| 4 — ADMIN | Đạt API/RBAC/audit/last-admin | Chưa có UI hoặc HTTP load test riêng |
| 5 — booking/payment/review | Đạt PostgreSQL và SePay sandbox E2E qua CLI chính thức | Chưa kiểm tra chuyển khoản thật/public HTTPS production |
| 6 — rewards/voucher | Đạt nghiệp vụ, concurrency và legacy migration | Chính sách không hoàn điểm voucher hết hạn được giữ rõ |
| 7 — recommendations | Đạt heuristic/batch/filter trong fixture | Chưa đánh giá chất lượng trên dữ liệu người dùng thật |
| Cache/hiệu năng | Đạt correctness, SQL budget và sáu lượt benchmark | Chưa chứng minh cache tăng tốc HTTP ổn định hoặc SLA mọi API |

## 3. Phần 1 — bảo mật và tài khoản CUSTOMER

**Đã có trước:** JWT, BCrypt, ownership một số tài nguyên, chữ ký webhook. Thiếu RBAC thực thi đầy đủ, cơ chế thu hồi phiên và vòng đời tài khoản.

**Đã triển khai:**

- `/api/admin/**` chỉ ADMIN; `/api/partner/**` chỉ PARTNER. Chức năng cá nhân cho tài khoản đã xác thực và đang hoạt động. CUSTOMER gửi yêu cầu partner; không tự cấp quyền khi đăng ký/cập nhật profile.
- JWT mỗi request đối chiếu `enabled`, role và `authVersion` trong DB. Đổi mật khẩu, logout toàn bộ phiên, khóa tài khoản và đổi quyền làm token cũ mất hiệu lực. Legacy JWT không có version chỉ được dùng khi DB còn version 0 và token chưa hết hạn.
- `PATCH /api/users/me`: chỉ `fullName`, `phone`, `avatarUrl`. `PUT /api/users/me/password`: cần mật khẩu hiện tại. `POST /api/auth/logout`: thu hồi các phiên của tài khoản.
- Rate limit đăng nhập/đăng ký có cấu hình, bounded Caffeine, khóa theo IP socket và fingerprint email chuẩn hóa; không tin `X-Forwarded-For`. Login tài khoản không tồn tại/bị khóa vẫn thực hiện BCrypt giả với mật khẩu hợp lệ về kích thước.
- CORS allowlist, DTO validation, giới hạn trang và sort allowlist. Password hash/JPA entity không xuất ra API. Lỗi nội bộ trả mã chung, log chỉ có diagnostic ID và loại lỗi.

**Bằng chứng code:** `security/SecurityConfig.java:69`, `security/JwtAuthenticationFilter.java:33`, `security/AuthRateLimiter.java:50`, `user/service/UserServiceImpl.java:39` và `:57`.

**Kiểm thử:** `SecurityHttpTest`, `JwtServiceTest`, `AuthRateLimiterTest`, `UserServiceTest`; tích hợp đăng ký/login/đổi mật khẩu/logout, khóa và thay quyền, ownership A/B. Full SecurityFilterChain được sử dụng, repository thật trong integration và repository mock trong HTTP slice được phân biệt rõ.

**Giới hạn:** limiter và cache cho một instance; TLS/reverse proxy/trusted proxy, quản lý secret vận hành và pentest từ bên ngoài chưa xác minh. Không thêm OAuth/email/reset mật khẩu theo phạm vi đã chốt.

## 4. Phần 2 — tìm kiếm, phòng trống, wishlist và review

**Đã triển khai:**

- Filter server theo tên/địa chỉ, type, feature, khoảng giá, ngày và khách; tính giá từ **phòng đáp ứng đồng thời các điều kiện**. `matchedRoomId`/`matchedPrice` tránh lấy giá phòng đơn rẻ cho tìm kiếm phòng bốn người.
- Room có capacity; từ chối ngày quá khứ, ngày không đủ cặp, check-out không sau check-in, quá 365 đêm, số khách không hợp lệ. Availability loại hold đã hết hạn ngay cả khi scheduler chậm.
- Catalog, booking, wishlist và review có phân trang, giới hạn kích thước và ID tie-breaker. Giữ list wishlist/review cũ để tương thích; client mới dùng endpoint trang và nút tải thêm.
- Wishlist có trang accommodation của chính người dùng; không phụ thuộc catalog đã tải. Chặn response cũ ghi đè state sau logout/đổi phiên/thay wishlist.
- Review cần booking hoàn tất thuộc người viết, DB constraint chống trùng, không công khai review bị ẩn hoặc tài sản chưa xuất bản.

**Bằng chứng code:** `accommodation/repository/AccommodationSearchRepository.java:23`; `room/service/RoomServiceImpl.java`; `favorite/service/FavoriteServiceImpl.java`; `review/service/ReviewServiceImpl.java`.

**Kiểm thử:** filter capacity/price/features, tài sản ẩn, ngày sai, giá matching-room, stable recommendation; giới hạn SQL availability. DTO/contract cũ được giữ, frontend API client được chuyển sang phân trang. Typecheck + 9 test + web export đạt; chưa có kiểm thử thao tác trên thiết bị thật.

## 5. Phần 3 — PARTNER

**Đã triển khai:**

- CUSTOMER nộp application, ADMIN duyệt/từ chối trước khi cấp PARTNER; duyệt lại cùng quyết định không cấp quyền lặp.
- API property/room/list/detail/create/update/deactivate; quản lý giá, capacity, trạng thái, feature và URL ảnh. `partnerId` lấy từ tài khoản xác thực. Không có upload ảnh/storage ngoài trong phạm vi này.
- Property mới hoặc sửa nội dung/phòng về `PENDING`; partner không tự xuất bản. Ngừng kinh doanh giữ dữ liệu và snapshot lịch sử.
- Optimistic version cho thay đổi; khóa theo accommodation → room để nhất quán với booking. Response phiên bản cũ trả conflict, không âm thầm ghi đè.
- Booking/payment/statistics giới hạn theo tài sản của partner ở truy vấn, gồm cả lịch sử từ snapshot; người khác không đọc chéo được.

**Bằng chứng code:** `partner/service/PartnerApplicationService.java:44` và `:81`; `partner/service/PartnerPropertyService.java:93` và `:139`; `management/service/OperationsQueryService.java`.

**Kiểm thử:** partner A/B, sửa metadata về PENDING, stale version, approval idempotency/token revocation, snapshot và truy vấn phạm vi. Regression mới tái hiện booking chờ partner edit rồi đọc phòng chưa duyệt, sau sửa trả 404 và không tạo đơn: [booking-race-regression.md](docs/evidence/booking-race-regression.md).

## 6. Phần 4 — ADMIN

**Đã triển khai:**

- Danh sách/lọc/trang tài khoản, application, accommodation/room, review, booking, payment, anomaly và audit log.
- Quản lý role/khóa/mở tài khoản; bảo vệ admin hoạt động cuối cùng bằng cùng thứ tự khóa kể cả hai admin thao tác đồng thời.
- Kiểm duyệt property/review có lý do, actor, thời điểm và version; approval application retry không sinh tác động lặp.
- Thống kê tách pending/cancelled và doanh thu từ payment SUCCESS. Không sửa payment history; anomaly chỉ đọc để đối soát.
- Admin quản lý reward catalog; thao tác nhạy cảm ghi audit trong transaction cùng thay đổi.

**Bằng chứng code:** `admin/service/AdminAccountService.java:48`; `admin/service/AdminModerationService.java:87` và `:118`; `management/service/OperationsQueryService.java:101`; `rewards/service/RewardCatalogService.java`.

**Kiểm thử:** unit quản trị, HTTP RBAC, tích hợp bảo vệ admin cuối cùng, hai admin khóa chéo đồng thời, audit catalog/version, doanh thu chỉ sau thanh toán thành công. Giao diện admin/partner không nằm trong phạm vi.

## 7. Phần 5 — booking, SePay và đánh giá

**Đã triển khai:**

- Giá do server tính, quantity = 1, khóa phòng chống overlap, capacity và snapshot thương mại. Sửa giá sau đó không sửa giá đơn cũ.
- Hold mặc định 15 phút (`expiresAt`); expiry chuyển `CANCELLED` với lý do `EXPIRED`, hủy tay chỉ khi chưa thanh toán. Voucher được giải phóng khi hủy/hết hạn.
- Hoàn tất sau checkout mặc định 12:00 Asia/Ho_Chi_Minh, chỉ khi CONFIRMED và tổng SUCCESS payment khớp; scheduler batch giới hạn, transaction từng đơn, chạy lại an toàn.
- SePay provider abstraction; HMAC-SHA256 ký timestamp + raw body, cửa sổ 300 giây, đối chiếu tài khoản, chiều tiền, payment code và số tiền. Transaction ID unique.
- Webhook lặp/đồng thời không xác nhận hai lần. Chuyển tiền sai điều kiện/đến muộn được ghi anomaly; không tự hồi sinh booking hết hạn. Xử lý thất bại kết thúc transaction trước khi ghi anomaly, tránh giữ hai connection trên mỗi webhook lỗi.
- Review chỉ sau hoàn tất, chỉ chủ booking; validation và DB constraint chống trùng.

**Bằng chứng code:** `booking/service/BookingServiceImpl.java:94`; `booking/service/BookingLifecycleService.java:24` và `:34`; `payment/service/SepayWebhookService.java:19`; `payment/service/SepayWebhookProcessor.java:27`.

**Kiểm thử PostgreSQL:** nhiều booking cùng phòng, expiry đúng ranh giới 900 giây, late webhook replay, 20 signed invalid transfer không làm cạn pool, cùng transaction ID cho hai đơn, webhook đua cancel, rollback/voucher state và complete/earn chạy lại. Clock test được kiểm soát; chữ ký fixture dùng raw bytes.

**Đạt SePay sandbox E2E ngày 19/11:** CLI chính thức 0.1.9 mô phỏng giao dịch trên tài khoản ngân hàng giả; relay giữ nguyên raw body/header HMAC từ provider vào backend riêng. Đúng tiền 380.000 VND → payment SUCCESS/booking CONFIRMED, replay cùng giao dịch HTTP 200 không ghi nhận lần hai; sai tiền HTTP 400/AMOUNT_MISMATCH; đơn hủy hoặc quá expiresAt HTTP 409/BOOKING_NOT_PAYABLE, payment vẫn PENDING và có anomaly. Ca hết hạn điều chỉnh expiresAt của đúng đơn fixture, scheduler tắt nên chưa đổi status sang CANCELLED trong ca này. Cấu trúc mã SF + 26 ký tự được SePay nhận diện từ nội dung đầy đủ. Đã dừng relay/backend riêng và revoke/logout CLI. [Bằng chứng đã lược dữ liệu riêng tư](docs/evidence/sepay-sandbox-e2e.json); [công thức HMAC chính thức](https://developer.sepay.vn/vi/sepay-webhooks/xac-thuc). Chưa xác minh chuyển tiền thật hoặc public HTTPS deployment. Không hoàn tiền hoặc hủy booking đã trả theo phạm vi.

## 8. Phần 6 — rewards và voucher

**Đã triển khai:** ledger bền vững có nguồn/idempotency key, balance có khóa, earn sau completed = floor(VND thực trả / 1.000). Đổi điểm yêu cầu UUID retry key; catalog mặc định 1.000 điểm → giảm 10.000 VND, min spend 100.000, hạn 30 ngày. Voucher cá nhân AVAILABLE → RESERVED → USED; release về AVAILABLE khi đơn chưa trả hủy/hết hạn, không tiêu hai lần. Snapshot giảm giá/chính sách trong booking; payment nhận đúng tổng sau giảm. Voucher hết hạn không hoàn điểm.

**Bằng chứng code:** `rewards/service/RewardsService.java:60`, `:85`, `:128`; `rewards/entity/RewardLedger.java`; migration `002_backend_capabilities.sql:57`.

**Kiểm thử:** redemption đồng thời cùng key/different key, không âm điểm, hai đơn không reserve cùng voucher, retry hoàn tất không earn lặp, reserve/consume/expiry/cancel, đối chiếu balance và ledger. Migration giữ opening balance cũ; replay không thêm opening cho tài khoản đã có lịch sử; mismatch/negative balance dừng transaction thay vì sửa/xóa điểm. Sáu ca migration và hai regression trước sửa có trong [migrations.json](docs/evidence/migrations.json).

## 9. Phần 7 — gợi ý chỗ nghỉ

**Đã triển khai:** tối đa 200 candidate đủ điều kiện tìm kiếm, tối đa 50 tài sản lịch sử của chính tài khoản; chấm điểm theo type, feature và khoảng giá, tiếp theo rating/count và UUID. Người mới có fallback. Feature/rating đọc batch, không gọi riêng từng accommodation, không dùng AI/dịch vụ ngoài.

**Bằng chứng:** `recommendation/service/RecommendationService.java:21`, `recommendation/repository/RecommendationRepository.java:13`. Unit test người mới/có lịch sử, tích hợp thứ tự ổn định, filter capacity và property ẩn. Chất lượng cá nhân hóa ngoài bộ fixture **chưa xác minh**; heuristic chỉ xếp hạng trong tập candidate đã giới hạn.

## 10. Cache, query và benchmark

### Cache

Spring Cache + Caffeine là hai dependency runtime mới đã được duyệt; không đổi Spring Boot parent. Cache DTO detail tối đa 2.000 entry, TTL 60 giây; metadata tối đa 100 entry, TTL 10 phút; có bật/tắt. Detail luôn kiểm tra ACTIVE/version ở DB, key có version, eviction sau commit. Không cache quyền, balance, booking/payment hoặc availability.

Đã test hit/miss, TTL và max-size bằng ticker kiểm soát, cache disabled, version/hidden property, rollback và concurrent edit. Lỗi đọc status cũ nhưng metadata chưa duyệt mới đã tái hiện rồi sửa bằng REPEATABLE_READ: [cache-race-regression.md](docs/evidence/cache-race-regression.md). Bằng chứng code `config/CacheConfig.java:25`, `accommodation/service/AccommodationServiceImpl.java:65`, `accommodation/service/AccommodationDetailCache.java:28`.

### Số SQL và EXPLAIN

- Test hiện kiểm tra trang 1 và **20 booking** trên 21 đơn: tối đa 5 SQL nghiệp vụ + 1 lookup JWT, không tăng theo số phần tử. Availability tối đa 3 SQL; thêm 20 phòng không tăng số query.
- PostgreSQL `EXPLAIN (ANALYZE, BUFFERS)` trên fixture cố định, trước/sau index migration 003; đây là single measurement, không phải p95 HTTP hoặc so sánh với toàn bộ code ban đầu.

| Query | Trước 003 (ms) | Sau 003 (ms) |
| --- | ---: | ---: |
| booking-page | 4,925 | 0,614 |
| availability | 0,614 | 0,569 |
| catalog | 5,523 | 1,664 |
| partner-bookings | 372,838 | 2,028 |
| admin-counts | 41,879 | 40,452 |
| admin-revenue | 75,111 | 91,431 |
| rewards-history | 0,078 | 0,145 |
| normalized-email | 0,083 | 0,132 |

Index giúp tránh sort/scan toàn bộ cho trang operations; không kết luận mọi query đều nhanh hơn. Aggregate doanh thu vẫn đọc dữ liệu SUCCESS tương ứng, số đo có biến động. Raw plans: [trước](docs/evidence/query-plans-before.json), [sau](docs/evidence/query-plans-after.json). Budget SQL là regression guard; EXPLAIN dùng để kiểm tra đường truy cập/index.

### HTTP benchmark

**Đạt budget trên workload đã đo.** Hai chế độ cache bật/tắt, heap 256–768 MB, pool 10, 20 client; mỗi chế độ 30 giây warm-up + 300 giây đo × 3 lượt. Tổng **1.542.190 request**, **0 lỗi đo, 0 lỗi warm-up**. Cùng bản jar, cùng PostgreSQL và fixture; không chạy Maven test đồng thời với benchmark.

| Workload | Cache bật: p95 cao nhất trong 3 lượt (ms) | Cache tắt: p95 cao nhất trong 3 lượt (ms) | Budget p95 (ms) |
| --- | ---: | ---: | ---: |
| Catalog | 115.88 | 87.79 | 300 |
| Detail hot | 54.53 | 39.74 | 300 |
| Detail varied | 53.84 | 39.51 | 300 |
| Availability | 60.03 | 42.69 | 300 |
| Booking page | 76.96 | 54.65 | 300 |
| Wishlist PUT | 55.66 | 37.28 | 700 |

- Cache bật: 782.007 request; throughput từng lượt **1.043,55 / 999,57 / 563,57 request/s**.
- Cache tắt: 760.183 request; throughput từng lượt **834,22 / 905,32 / 794,40 request/s**.
- Pool active tối đa quan sát 10 ở cả hai chế độ; pending tối đa quan sát **6 / 8**, lấy mẫu mỗi 5 giây. Không gọi đây là peak tuyệt đối hoặc khẳng định pool không phải điểm nghẽn.
- p50/p95/p99, số request từng workload và samples đầy đủ trong [cache-on](docs/evidence/performance-cache-on.json), [cache-off](docs/evidence/performance-cache-off.json), [summary đã kiểm tra đủ vòng/budget](docs/evidence/benchmark-summary.json), [môi trường và SHA256 jar](docs/evidence/benchmark-environment.json). Bảng giữ percentile từng lượt; không coi max p95 là percentile gộp.

**Kết luận cache:** correctness và giảm query metadata khi hit đã được test; benchmark HTTP có biến thiên đáng kể, chưa chứng minh cache tăng tốc ổn định. Không quy nguyên nhân biến thiên cho hạ tầng hoặc cache khi chưa có bằng chứng. Không loại lượt chậm để làm đẹp số liệu.

Đây là sáu workload catalog/detail/availability/booking page/wishlist PUT trên loopback; **không** chứng minh SLA cho mọi API ghi, mạng di động, kết nối SePay hoặc deployment khác. Admin/partner có smoke HTTP riêng: không lỗi hợp đồng nhưng p95 vượt budget; đang tối ưu và đo lại đầy đủ. Không gộp kết quả này vào sáu workload đã đạt. Không dùng round bị ngắt của phiên trước để nghiệm thu.

## 11. Bảo trì và phát triển

- Giữ Controller → Service → Repository; DTO tại biên HTTP, MapStruct cho mapping hiện có; không trả JPA entity. Module booking dùng interface lookup/payment/rewards thay vì truy cập chéo repository tùy tiện.
- Tách policy/clock, lifecycle, provider, anomaly recorder, rewards, catalog search và operations queries; không tạo service toàn hệ thống hoặc microservice mới.
- Transaction và lock order được ghi rõ, optimistic version cho edit, unique constraint cho dữ liệu cần idempotency, regression test cho các race tìm thấy.
- SQL tham số hóa, allowlist sort và giới hạn trang/candidate; booking response giữ batch snapshot lookup. Migration có preflight/backfill và rollback bằng transaction khi dữ liệu không hợp lệ.
- Frontend chỉ chỉnh client, state và live screens cần tích hợp; không thiết kế lại giao diện. Giữ API cũ khi có thể; OpenAPI và test route giúp phát hiện thiếu hợp đồng.
- CI đã cấu hình nhưng chưa chạy hosted. Chưa có SAST/DAST/pentest ngoài máy test hoặc kiểm định vận hành production; không suy diễn kết quả unit test thành chứng nhận an toàn.

## 12. Vòng kiểm tra → sửa → kiểm thử lại

| Phát hiện | Xử lý | Bằng chứng kiểm thử lại |
| --- | --- | --- |
| Thiếu RBAC/session revocation/role lifecycle | SecurityFilterChain, DB role/enabled/version, limiter | HTTP security + PostgreSQL account flow |
| Giá thấp từ phòng không đủ capacity | Lateral matching-room search | Search integration guests=4/maxPrice và matchedPrice |
| Partner có thể tự lộ nội dung mới | PENDING + admin approval + version | Partner ownership/moderation integration |
| Cache đọc metadata chưa duyệt sau concurrent edit | Snapshot REPEATABLE_READ | Latch test trước FAIL, sau PASS |
| Booking chờ room lock dùng phòng vừa sửa chưa duyệt | Khóa accommodation trước room | PostgreSQL trước HTTP200 sai, sau HTTP404 |
| Webhook lỗi giữ nested connection | Kết thúc processing transaction trước anomaly transaction | 20 webhook lỗi đồng thời, không pool exhaustion |
| Provider transaction ID đua giữa hai đơn | DB unique + rollback/anomaly sau commit failure | Chỉ một payment/booking thành công |
| Voucher/điểm bị retry hoặc tiêu đồng thời | Row lock + ledger key + unique | Redemption/booking/voucher concurrency |
| Replay migration có thể thêm điểm opening sai | Chỉ backfill tài khoản chưa có ledger, kiểm tra tổng | Hai RED trước sửa, 6 migration test GREEN |
| Wishlist response cũ và Home giữ filter Search | Generation guard + focus reset | Review độc lập, frontend typecheck/test/export |
| Operations pagination scan/sort lớn | Index createdAt/id phù hợp | EXPLAIN raw trước/sau migration 003 |
| Partner statistics kích hoạt JIT bởi nullable OR | Tách global/owned aggregate; semi-join không nhân payment khi legacy nhiều dòng | Regression PostgreSQL + EXPLAIN; HTTP budget còn đang kiểm chứng |

Review độc lập đã đọc auth, ownership, transaction, rewards, migration, search/cache và frontend tích hợp. Hai finding bổ sung (booking/approval race và migration replay) đã xử lý. Không còn Critical/High cụ thể chưa xử lý được biết trong phạm vi review này; đây không phải kết luận pentest toàn hệ thống.

## 13. Điều kiện chốt và việc chưa xác minh

| Nhóm | Kết luận hiện tại |
| --- | --- |
| CUSTOMER | Chức năng MVP đã triển khai, automated flow đạt; benchmark workload đã đạt, thiết bị thật và SePay E2E chưa xác minh |
| PARTNER | API và ownership/moderation đã triển khai, automated tests đạt; không xây giao diện quản trị |
| ADMIN | API và role/audit/last-admin protection đã triển khai, automated tests đạt; hosted CI và kiểm tra vận hành ngoài máy test chưa xác minh |
| Hiệu năng/cache | SQL budget/cache regression và sáu lượt HTTP benchmark đạt trên workload nêu ở phần 10; chưa có HTTP load test riêng cho admin/partner và mọi API ghi |

Triển khai và kiểm chứng tự động tại máy test đã hoàn thành trong phạm vi nêu trên; SePay E2E chỉ được xác minh trong sandbox qua relay chính thức, chưa xác nhận production. Chưa kiểm tra schema/database thật, triển khai production, hoàn tiền, nhiều phòng/đơn, OAuth/email, storage upload, Redis/multi-instance hoặc AI ngoài. Hướng chạy lại chính xác trong [OPERATIONS.md](docs/OPERATIONS.md); bằng chứng đã hoàn thành lưu trong repository để không phụ thuộc `/tmp`.
