# DIGITAL SIGNATURE [RSA]

## 1. Tổng quan:
### a. Front-end:
- Sử dụng react, vite.
- Bảo mật sử dụng gói [jsrsasign](https://github.com/kjur/jsrsasign).

### b. Back-end:
- Sử dụng nodejs, web-socket.
- Bảo mật sử dụng gói [jsrsasign](https://github.com/kjur/jsrsasign).

## 2. Mô hình triển khai:
  - Máy A và B cùng kết nối đến server, server sẽ lưu lại IP của các thiết bị.
  - Thiết lập kết nối web-socket giữa các thiết bị.
  - Mô hình gửi nhận file như sau: 
    - Máy A -> sinh keys -> kí file và gửi.
    - Phía server -> nhận thông tin -> xác minh -> gửi đến máy B nếu xác minh thành công.
    - Máy B -> nhận thông tin từ server -> xác thực lần nữa -> lưu file (nêu thành công).

## 3. Chi tiết cách hoạt động:
- Ở phía client:
  -  Sau khi sinh keys (private and public), thì private sẽ được lưu vào localStogare của trình duyệt.
  -  File (chỉ dùng văn bản) sẽ được mã hóa bằng hệ base64, sau đó sẽ được kí bằng private key.
  -  Như vậy, client sẽ gửi (nhận) hai thành phần: file mã hóa và file mã hóa đã kí.
  -  Ở phía người nhận, thông tin file sẽ được xác thực 1 lần nữa trước khi lưu lại.
- Ở phía server:
  - Sau khi tiếp nhận thông tin từ client, server sẽ xác minh lần 1 và cập nhật public key (nếu chưa lưu).
  - Sau đó, server sẽ tìm địa chỉ người nhận và tiến hành gửi thông tin đi.

## 4. Cách chạy demo:
### a. Về phía front-end (client):
- Di chuyển vào thư mục .\src.
- Dùng lệnh sau:
  ```
  npm run dev
  ```
- Điều này cho phép khởi chạy web và bạn sẽ thấy cái dòng đại loại như:
  ```
  local: http://192.168.x.x
  network: http://169.x.x.x
  network: http://192.x.x.x
  ```
- Hãy chú ý dòng network vì bạn sẽ truy cập đường dẫn đó ở máy ảo.

> [!IMPORTANT]
> Yêu cầu phải kết nối trong cùng 1 mạng, nếu bạn muốn kết nói tới máy khác thay vì máy ảo.

### b. Về phía back-end (server):
- Di chuyển vào thư mục .\src.
- Dùng lệnh sau:
  ```
  npm start
  ```
- Hãy chú ý ở màn hình terminal, bạn sẽ thấy log mà server ghi ra, đại loại như:
  ```
   Server đang chạy tại: http://169.x.x.x:3000
   Server đang chạy tại: http://192.x.x.x:3000
  ```
- Đó là địa chỉ chạy server.

### c. Kết nối client-server:
- Trong file .env của front-end, hãy chỉnh sửa dòng sau:
   ```
   VITE_SERVER_DOMAIN=192.x.x.x
   ```
- Thành địa chỉ của server (ở trên).
      
      



  
