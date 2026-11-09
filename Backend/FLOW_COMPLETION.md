# Danh sách mã luồng Backend StayFinder

Ngày đối chiếu: 09/11/2026. Nhánh `stayfinder-booking-flows`.

Kết quả xác minh cuối: `mvnw.cmd -B -ntp verify` BUILD SUCCESS, **317 test, 0 failures, 0 errors, 0 skipped**. Tăng 59 test so với mốc 258 trước đợt này. Nhóm PostgreSQL bị loại theo cấu hình mặc định, không nằm trong số 317. Build bằng Java 25.0.4 với compiler release 21. `git diff --check` không phát hiện lỗi whitespace.

Lượt verify đầu có 2 test Admin HTTP thất bại vì controller chưa được import vào test context. Đã sửa cấu hình test, chạy focused thành công và chạy lại toàn bộ verify đạt kết quả trên. Chưa chạy FE, DB migration, email hoặc Supabase thật.

Mã UC, ACT và SEQ dưới đây lấy từ `StayFinder-38-Diagrams-Reviewed.zip`. “Đã code BE” nghĩa là có API và nghiệp vụ phía server; không đồng nghĩa đã nghiệm thu trên Supabase/PostgreSQL thật hoặc đã có giao diện. Bảng này không xác nhận hoàn thành toàn bộ 38 diagram vì bộ nguồn còn có class/state diagram và các yêu cầu ngoài phạm vi đợt triển khai.

## Các luồng đã có triển khai Backend

API trong bảng đều có tiền tố `/api`.

| Mã Use Case | Activity và Sequence | Chức năng | API chính | Phạm vi kiểm chứng |
| --- | --- | --- | --- | --- |
| UC-USER-01 | ACT-01 / SEQ-01 | Đăng ký | POST /auth/register | Legacy auth có test; Supabase proxy có test offline, trả 202 nếu cần xác nhận email; chờ Supabase thật |
| UC-USER-02 | ACT-02 / SEQ-02 | Đăng nhập và duy trì phiên | POST /auth/login, /auth/refresh | Kiểm tra chữ ký, issuer, audience, thời hạn, phiên và vai trò đáng tin cậy; test offline |
| UC-USER-03 | Không có ACT/SEQ riêng | Hồ sơ cá nhân | GET, PATCH /users/me | Đã code và có test hồ sơ |
| UC-USER-04 | Không có ACT/SEQ riêng | Đăng xuất | POST /auth/logout | Thu hồi phiên; Supabase remote cần xác minh trực tiếp |
| UC-USER-05 | ACT-03 / SEQ-03 | Tìm kiếm và lọc | GET /accommodations, /catalog/filters, /locations/suggestions | Có test catalog/validation; cần DB có dữ liệu |
| UC-USER-06 | Không có ACT/SEQ riêng | Chi tiết chỗ nghỉ và phòng | GET /accommodations/{id}, /accommodations/{id}/rooms | Trả thông tin, tọa độ và phòng khả dụng; bản đồ SDK thuộc FE |
| UC-USER-07 | ACT-04 / SEQ-04 | So sánh giá mock Multi-source | GET /accommodations/{id}/price-comparisons | Adapter seed, decimal USD và nested minor units; test tổng tiền, phí và giá tốt nhất |
| UC-USER-08 | ACT-05 / SEQ-05 | Báo giá và đặt phòng | POST /booking-quotes, /bookings | Có test nghiệp vụ; cạnh tranh giữ phòng cần chạy lại PostgreSQL |
| UC-USER-09 | ACT-06 / SEQ-06 | Thanh toán mô phỏng | POST, GET /bookings/{id}/payment-simulations | CUSTOMER đúng chủ; SUCCESS/FAILURE/CANCEL; lịch sử, idempotency, retry. Dùng booking pay_at_property confirmed và payment pending |
| UC-USER-10 | Không có ACT/SEQ riêng | Lịch sử và chi tiết booking | GET /bookings, /bookings/{id} | Phân trang, trạng thái và quyền sở hữu |
| UC-USER-11 | ACT-07 / SEQ-07 | Đánh giá và bình luận | /accommodations/{id}/reviews, /reviews/{id} | Kiểm tra kỳ lưu trú đủ điều kiện, quyền sửa và điểm; bổ sung ẩn review bị kiểm duyệt |
| UC-USER-12 | Không có ACT/SEQ riêng | Yêu thích | GET /favorites; PUT, DELETE /favorites/{id} | Có test độc lập từng User và thao tác lặp |
| UC-USER-13 | ACT-08 / SEQ-08 | Điểm thưởng và ưu đãi | /rewards/wallet, /history, /catalog, /claims | Nghiệp vụ hiện có; kiểm thử giao dịch DB vẫn là bước nghiệm thu riêng |
| UC-USER-15 | Không có ACT/SEQ riêng | Lưu lựa chọn ngôn ngữ | GET, PATCH /users/me/preferences | BE lưu preference; không xác nhận toàn bộ giao diện đã dịch |
| UC-USER-16 | Không có ACT/SEQ riêng | Gửi báo cáo | POST /support/reports | Có API và test; Admin xử lý qua API riêng |
| UC-PARTNER-01 | ACT-09 / SEQ-09 | Quản lý cơ sở lưu trú | GET, POST /partner/accommodations; GET, PUT /partner/accommodations/{id} | Đúng chủ, validation, bảo toàn trạng thái bị Admin chặn |
| UC-PARTNER-02 | ACT-10 / SEQ-10 | Quản lý phòng và số lượng | GET, POST /partner/accommodations/{id}/rooms; PUT /partner/accommodations/{id}/rooms/{roomId} | Đúng chủ; chặn giảm sức chứa/tồn kho khi có giữ chỗ |
| UC-PARTNER-03 | ACT-11 / SEQ-11 | Giá và trạng thái phòng | PUT /partner/accommodations/{id}/rooms/{roomId}/offer | Có test cập nhật giá và giữ nguyên giá lịch sử |
| UC-PARTNER-05 | Không có ACT/SEQ riêng | Xem và phản hồi đánh giá | GET /partner/accommodations/{id}/reviews; PUT /partner/accommodations/{id}/reviews/{reviewId}/reply | Một phản hồi hiện tại; không sửa điểm/bình luận của khách; cần migration 013 |
| UC-ADMIN-01 | ACT-13 / SEQ-13 | Quản lý User | GET /admin/users?role=customer; GET /admin/users/{id}; PATCH /admin/users/{id}/access | Tìm kiếm, khóa/mở, role; chống tự khóa/hạ quyền và mất Admin cuối |
| UC-ADMIN-02 | ACT-13 / SEQ-13 | Quản lý Partner | GET /admin/users?role=partner; PATCH /admin/users/{id}/access | Dùng cùng nghiệp vụ quản lý tài khoản đáng tin cậy |
| UC-ADMIN-04 | ACT-12 / SEQ-12 | Kiểm duyệt nội dung | /admin/accommodations, /admin/reviews và các PATCH moderation | Lưu quyết định/lý do; ẩn cơ sở/review, loại review khỏi rating và chặn media bị ẩn |

## Chức năng bổ sung không tự đặt mã diagram

| Chức năng | API hoặc cấu hình | Ghi chú |
| --- | --- | --- |
| Quên mật khẩu | POST /auth/forgot-password | Chế độ Supabase; phản hồi không tiết lộ tài khoản; gửi email phụ thuộc Supabase |
| Đặt lại mật khẩu | POST /auth/reset-password | Recovery tokenHash một lần, thu hồi phiên cũ; cần cấu hình template email |
| Phân quyền Supabase và Spring | stayfinder.auth.mode=supabase | JWT RS256/ES256 qua JWKS; CUSTOMER/PARTNER/ADMIN lấy từ DB ứng dụng, bỏ qua role trong user_metadata |
| Xử lý report | GET /admin/reports; PATCH /admin/reports/{id} | submitted → in_review/resolved/dismissed; có audit |
| Cấu hình hỗ trợ | GET /admin/settings; PUT /admin/settings/{key} | Chỉ SUPPORT_EMAIL và SUPPORT_RESPONSE_HOURS; không phải trình chỉnh mọi cấu hình hệ thống |
| Đọc phản hồi Partner | GET /accommodations/{id}/reviews/{reviewId}/partner-reply | Không công khai phản hồi của review ẩn hoặc cơ sở inactive |

## Phần chưa được đánh dấu hoàn thiện

| Mã | Phần còn thiếu hoặc giới hạn |
| --- | --- |
| UC-USER-14 | Có thứ tự gợi ý curated hiện tại; chưa triển khai hệ thống cá nhân hóa đầy đủ |
| UC-PARTNER-04 | Chưa có API quản lý khuyến mãi riêng của Partner trong đợt này |
| UC-ADMIN-03 | Mới có cấu hình hỗ trợ; chưa có bộ CRUD quản trị toàn bộ danh mục |
| UC-ADMIN-05 | Có xử lý report do User gửi; chưa có dashboard thống kê kinh doanh |
| UC-ADMIN-06 | Chưa có API Admin quản trị điểm thưởng/ưu đãi |

Quyền dùng chung của Admin trên các chức năng Partner trong UCD-04 chưa được triển khai toàn bộ. API Partner vẫn yêu cầu PARTNER và đúng chủ sở hữu; không được coi phần này đã hoàn tất chỉ vì có vai trò ADMIN.

## Điều kiện chạy khi hạ tầng hoạt động lại

1. Giữ nguyên dữ liệu hiện tại; rà soát và áp dụng migrations 011, 012, 013 trên schema test đã chọn sau 000–009. Không có migration 010 trong đợt này. Chưa chạy bất kỳ migration/seed nào trong phiên làm việc này.
2. Bật Supabase theo `AUTH.md`, cung cấp URL và publishable key qua môi trường. Project phải hỗ trợ signing key bất đối xứng. FE cần xử lý đăng ký 202 và recovery tokenHash.
3. Bật `STAYFINDER_PAYMENT_SIMULATION_ENABLED=true` và `STAYFINDER_CATALOG_MOCK_SOURCES_ENABLED=true` chỉ trên môi trường demo/test khi cần.
4. Áp dụng bộ seed đã rà soát nếu DB chưa có catalog. Các adapter mock không thay thế DB cho chỗ nghỉ, phòng và tồn kho.
5. Chạy PostgreSQL integration/concurrency test và hành trình API thực tế. Test mặc định loại nhóm postgres; chưa xác nhận khóa DB, constraint, email Supabase và provider thật.

Tài liệu chi tiết: `AUTH.md`, `ADMIN.md`, `SIMULATED_PAYMENTS.md`, `PARTNER_REVIEWS.md`, `MULTI_SOURCE_PRICES.md`.
