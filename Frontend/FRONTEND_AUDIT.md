# Kiểm tra frontend ngày 05/11/2026

Giữ các thay đổi chưa commit có sẵn; không thêm dependency, sửa backend, commit hoặc push.

## Đã sửa

- Tìm kiếm từ Home mở lại được sau lần hủy trước; bỏ chờ giả 350 ms.
- Cancel trong bộ chọn khách/ngày khôi phục giá trị trước khi mở. Ô điểm đến tìm được tên chỗ ở tự nhập.
- Giá lọc/sắp xếp dựa trên phòng đủ sức chứa và số lượng còn trống. Lọc tiện ích dùng cả ID, hỗ trợ tên dữ liệu tiếng Việt.
- Chọn phòng mặc định phù hợp số khách; chặn đi tiếp khi ngày/phòng không hợp lệ.
- Ảnh phòng thống nhất từ chọn phòng đến thông tin khách, checkout, xác nhận và Bookings. Dùng ảnh Alpine gốc, thêm fallback chung và reset lỗi khi nguồn ảnh đổi.
- Tách context theo booking, wishlist, rewards và reservations; ổn định callback, memo thẻ tìm kiếm, tái sử dụng formatter và giảm tần suất sự kiện carousel.
- Chỉ import 56 Lucide icon đang dùng và font Ionicons cần thiết.

## Kết quả đo

So sánh export production trên cùng môi trường, đơn vị MB thập phân:

| Thành phần | Trước | Sau |
| --- | ---: | ---: |
| JavaScript web | 3,906 MB | 1,621 MB |
| JavaScript web, gzip để so sánh | 0,722 MB | 0,412 MB |
| Hermes Android | 6,495 MB | 4,307 MB |
| Hermes iOS | 6,311 MB | 4,111 MB |
| Tổng font Android | 5,557 MB | 1,870 MB |
| Tổng font iOS | 4,593 MB | 0,906 MB |

JavaScript web giảm 58,5% trước nén. Đây là số đo dung lượng, chưa phải số đo FPS hay thời gian tải trên thiết bị.

## Xác minh

- `npm run typecheck`, `npm test` (5 file), `git diff --check`.
- Export web, Android và iOS bằng Expo; native export tạo bundle Hermes, chưa phải APK/IPA.
- Trình duyệt 390×844 và 320×568: mở lại tìm kiếm, Cancel khách/ngày, ngày quá khứ, tìm tên chỗ ở, lọc Pool.
- Luồng Villa Azure → Premium Suite → thông tin khách → checkout: $1.485, dùng 2.500 điểm còn $1.460; xác nhận lưu đúng phòng và trừ điểm còn 22.000.
- Hủy booking, gửi/mở lại đánh giá, xóa/Undo Wishlist, chuyển modal Settings/Change password và Report/category. Một portal Profile hoạt động tại một thời điểm.
- Không ghi nhận lỗi console hoặc ảnh tải hỏng trong các màn đã kiểm tra.

Chưa xác minh: FPS trên thiết bị thật, bàn phím Android/iOS, chữ phóng lớn, tương tác OS reduced motion và tích hợp backend/auth/thanh toán thực. Các luồng auth/thanh toán vẫn là demo trong bộ nhớ phiên.

## Bổ sung giao diện tối–kem và lỗi flow

Hướng triển khai đã được người dùng duyệt: nền `#1D191A`, điểm nhấn `#F1E5C6`, ảnh lớn, dùng Expo và font có sẵn. Giữ các thay đổi trước đó, không thêm dependency hoặc sửa backend/lockfile.

- Đồng bộ màu nền, chữ, nút và icon trên Home, Search, chi tiết, các bước booking, Bookings, Wishlist, Profile, Rewards và Auth. Web có canvas ứng dụng tối đa 520 px, nền ngoài nâu. Home dùng hero ảnh lớn; bỏ lời quảng cáo giảm 20% chưa được áp dụng trong checkout.
- Search giữ `matchedTierId` khi mở kết quả; chọn mức giá từ $420 vẫn giữ Premium Suite $450 khi sang chi tiết, so sánh và chọn phòng. Quote phòng cơ bản của nhà cung cấp khác không còn được trình bày như quote của Suite.
- Cover/gallery lấy từ catalog dùng ảnh cục bộ; Bookings dùng chung fallback ảnh và hiện loại phòng, số đêm, tổng tiền thực tế.
- Tái hiện lỗi mất lớp phủ ảnh khi trở lại Home: các màn tab lưu trong DOM có ID gradient trùng nhau. Dùng `useId` cho gradient Home, chi tiết và Rewards; xác minh DOM có ID khác nhau và lớp phủ được hiển thị.
- Tái hiện lỗi đổi thưởng trừ điểm nhưng mất lịch sử sau khi rời Rewards. Chuyển số dư và lịch sử vào cùng state phiên; bảo vệ giao dịch trùng ID, chi phí không hợp lệ và không đủ điểm. Điểm dùng cho booking cũng có lịch sử.
- Bổ sung role và trạng thái ARIA cho nút chọn, sao đánh giá, công tắc, tab và nút thao tác. Ngày/phòng/điểm không hợp lệ vẫn bị chặn bởi model và màn nhập.

Xác minh trực tiếp trên trình duyệt:

- 320×568, 390×844 và canvas desktop; không thấy ảnh đã tải bị hỏng hoặc trang tràn ngang ở Home đã kiểm tra.
- Luồng Suite $450 → tổng $1.485 → đổi 2.500 điểm còn $1.460 → xác nhận → Bookings; hủy booking chuyển sang Cancelled.
- Đánh giá 4 sao và bình luận giữ nguyên khi mở lại; xóa/Undo Wishlist; Settings → Change password → Cancel; Rewards trừ 5.000 điểm còn 19.500 và giữ lịch sử khi rời rồi mở lại.
- Home Hotel → See all giữ đúng loại chỗ ở; không ghi nhận page console error trong tab kiểm thử cuối. Công cụ trình duyệt gặp treo trên tab cũ khi máy thiếu RAM; đã kiểm tra tiếp bằng tab mới. Metro/export được giới hạn 2 workers.

Kiểm tra tự động cuối: `npm run typecheck`, `npm test` (6 file) và `git diff --check` đạt. Export production cuối `npx expo export --platform all --max-workers 2 --output-dir /tmp/stayfinder-dark-cream-final` đạt (web, Android và iOS); log `/tmp/stayfinder-dark-cream-final.log`.

Giới hạn vẫn áp dụng: native export là bundle Hermes, chưa phải APK/IPA hoặc kiểm thử trên thiết bị thật. Auth/payment vẫn mô phỏng, dữ liệu phiên được đặt lại khi refresh.


## Tiếp nối motion, hiệu năng và độ rõ của thành phần

- Thêm reveal theo vùng nhìn, stagger nội dung Home, chuyển màn/tab, hero drift và phản hồi card; dùng CSS transform/opacity trên web, native driver cho các primitive native. Dùng chung bộ theo dõi reduced motion và IntersectionObserver; hero dừng khi khuất. Search, Compare Prices, Bookings và Rewards dùng motion chung cho các sheet/dialog đã sửa.
- Tái hiện navigator bị nhân đôi khi Rewards trở về tab. Đổi đường quay về thành `dismissTo`; ba vòng Profile → Rewards → Home giữ nguyên 511 phần tử, một Home và một tablist.
- Tách màu nền/thẻ booking, bỏ opacity toàn thẻ Completed/Cancelled, làm rõ Rebook/Earn More/nút Back trên ảnh sáng. Tăng viền điều khiển, thêm focus bàn phím và tăng vùng chạm Edit Profile. Chữ nhỏ trên hero có nền tối; màu kem tiếp tục dành cho hành động/trạng thái chính.
- Tái hiện ảnh hero giữ kích thước gốc 512×279 trong khung 350×390 gây vệt ngang. Đặt chiều rộng/cao 100%; ảnh và khung đo cùng 358×399 khi đang scale trên màn 390 px, cũng phủ kín tại 320 px.
- Sửa hydration khi tải trực tiếp `/room/select?id=villa-azure`: chờ hydration trước khi mount phần chọn phòng dựa trên query. Bản export không còn xuất MissingStay cho shell này; trình duyệt mở đúng phòng, không ghi nhận React hydration error trong lượt cuối.

Xác minh cuối: `npm run typecheck`, `npm test` (8 file, 0 lỗi), `git diff --check`; export web/Android/iOS với một worker vào `/tmp/stayfinder-motion-final`, log `/tmp/stayfinder-motion-final.log`. Preview production đang chạy ở localhost:8082. Không thêm dependency hoặc sửa lockfile/backend.

Trình duyệt cuối: 320×568, 390×844 và canvas desktop; Suite → checkout → dùng 2.500 điểm → Bookings giữ $1.460; mở/đóng/hủy booking, Rebook, lưu/mở lại đánh giá 4 sao và bình luận; đổi Free Breakfast giữ số dư 17.000 và hai khoản trừ trong lịch sử; Earn More quay Home không nhân navigator. Ảnh đã tải ở Home không hỏng, không thấy trang tràn ngang ở 320 px; hero dừng khi cuộn khuất. Focus bàn phím hiện viền kem 2 px và offset 3 px. Một số cặp màu đo được: viền điều khiển/nền nhập 3,57:1; chữ phụ/thẻ booking 6,57:1. Đây là các cặp lấy mẫu, chưa phải chứng nhận mọi trạng thái đạt chuẩn truy cập.

Probe chỉ chạy khi URL có `?measureMotion=1`. Mẫu production mobile 5 giây: 240 khoảng frame, median 20,8 ms, p95 34,7 ms, max 214,6 ms, 28 khoảng trên 32 ms và một long task 222 ms. Vẫn có khung chậm khi tải; các mẫu trước khác viewport/runtime nên không thể suy ra phần trăm cải thiện hoặc khẳng định hết lag. Chi tiết phép đo và baseline: `docs/superpowers/plans/2026-11-05-motion-performance.md`.

Không ghi nhận console error mới ở lượt cuối; vẫn có cảnh báo một số Animated effect cũ ở confirmation/toast fallback sang JS trên web. Chưa đo FPS native, bàn phím thiết bị, tương tác OS reduced motion hoặc chữ hệ thống phóng lớn. Native export chỉ tạo bundle Hermes. Ảnh xác minh được lưu trong thư mục visualization của chat: `stayfinder-motion-contrast.png` và `stayfinder-bookings-contrast.png`.
