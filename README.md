# DIGITAL SIGNATURE [RSA]

## 1. Tổng quan:
### a. Front-end:
- Sử dụng react, vite.
- Bảo mật sử dụng gói [jsrsasign]().

### b. Back-end:
- Sử dụng nodejs, web-socket.
- Bảo mật sử dụng gói [jsrsasign]().

## 2. Mô hình triển khai:
  - Máy A và B cùng kết nối đến server, server sẽ lưu lại IP của các thiết bị.
  - Thiết lập kết nối web-socket giữa các thiết bị.
  - Mô hình gửi nhận file như sau: 
    - Máy A -> sinh keys -> kí file và gửi.
    - Phía server -> nhận thông tin -> xác minh -> gửi đến máy B nếu xác minh thành công.
    - Máy B -> nhận thông tin từ server -> xác thực lần nữa -> lưu file (nêu thành công).
  