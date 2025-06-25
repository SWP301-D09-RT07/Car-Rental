# Hướng dẫn Debug và Test Admin Dashboard

## Vấn đề hiện tại
Bạn đang gặp lỗi 401 Unauthorized khi truy cập trang Admin Dashboard. Đây là do:
1. Endpoint `/api/reports/**` yêu cầu role "admin"
2. User hiện tại có thể không có role admin hoặc token không hợp lệ

## Các bước để sửa lỗi:

### 1. Thêm User Admin vào Database
Chạy script SQL `add_admin_user.sql` trong SQL Server Management Studio hoặc Azure Data Studio:
- Username: `admin`
- Password: `password`
- Email: `admin@carrental.com`
- Role: `admin`

### 2. Test Backend Endpoints
Sau khi backend đã chạy, test các endpoint sau:

#### Test endpoint kiểm tra admin users:
```bash
curl -X GET http://localhost:8080/api/reports/test-admin
```

#### Test endpoint reports overview (cần token):
```bash
curl -X GET http://localhost:8080/api/reports/overview \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 3. Đăng nhập với tài khoản Admin
1. Mở frontend (http://localhost:5173)
2. Đăng nhập với:
   - Username: `admin`
   - Password: `password`
3. Kiểm tra trong browser console xem role có được lưu đúng không

### 4. Debug Frontend
Mở browser console và kiểm tra:
- Token có được lưu trong localStorage không
- Role có được lưu đúng là "admin" không
- API calls có gửi token trong header không

### 5. Kiểm tra Logs
Backend logs sẽ hiển thị:
- Token validation
- Role checking
- API access attempts

## Các thay đổi đã thực hiện:

### Backend:
1. **SecurityConfig.java**: Thêm `.requestMatchers("/api/reports/**").hasRole("admin")`
2. **ReportController.java**: Thêm endpoint test `/api/reports/test-admin`
3. **UserService.java**: Thêm method `countUsersByRole()`
4. **ReportService.java**: Cập nhật để lấy thống kê đăng ký người dùng theo tháng

### Frontend:
1. **Home.jsx**: Thêm role checking và redirect logic
2. **api.js**: Đã có interceptor để thêm token vào header

## Nếu vẫn gặp lỗi:
1. Kiểm tra backend logs để xem chi tiết lỗi
2. Kiểm tra browser console để xem token và role
3. Đảm bảo user có role "admin" trong database
4. Kiểm tra token có hợp lệ không 