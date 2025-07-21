# Hướng dẫn xem SQL và Transaction Logs

## Tổng quan

Sau khi cấu hình logging, ứng dụng sẽ tạo ra 3 loại log files chính:

1. **`logs/sql.log`** - Chứa tất cả SQL queries và parameters
2. **`logs/transaction.log`** - Chứa thông tin về transactions, connection pool
3. **`logs/carrental.log`** - Chứa application logs chung

## Cách xem logs

### 1. Sử dụng script CMD (Windows)

```bash
# Script chính với menu đầy đủ
view-logs.bat

# Script theo dõi real-time (thuần CMD)
tail-logs.bat

# Script tìm kiếm trong logs
search-logs.bat
```

### 2. Sử dụng PowerShell script (nếu có PowerShell)

```powershell
# Xem tất cả logs (50 dòng cuối)
.\view-logs.ps1

# Xem chỉ SQL logs
.\view-logs.ps1 -Type sql -Lines 100

# Xem transaction logs real-time
.\view-logs.ps1 -Type transaction -Follow

# Xem application logs
.\view-logs.ps1 -Type app -Lines 200

# Xóa tất cả logs
.\view-logs.ps1 -Clear
```

### 3. Xem trực tiếp từ file

```bash
# Xem SQL logs
type logs\sql.log

# Xem transaction logs
type logs\transaction.log

# Xem application logs
type logs\carrental.log

# Xem real-time (PowerShell)
Get-Content logs\carrental.log -Wait -Tail 10
```

### 4. Sử dụng CMD commands

```bash
# Xem 100 dòng cuối của SQL log
for /f "skip=100" %%i in (logs\sql.log) do echo %%i

# Tìm kiếm trong logs
findstr /i "ERROR" logs\carrental.log
findstr /i "INSERT" logs\sql.log
findstr /i "COMMIT" logs\transaction.log

# Tìm kiếm với context (5 dòng trước và sau)
findstr /i /c:"booking" /b logs\carrental.log
```

## Các script CMD có sẵn

### `view-logs.bat` - Script chính
- Menu đầy đủ với tất cả tính năng
- Xem logs theo loại
- Tìm kiếm trong logs
- Xóa logs
- Real-time monitoring (sử dụng PowerShell nếu có)

### `tail-logs.bat` - Real-time monitoring (thuần CMD)
- Theo dõi SQL logs real-time
- Theo dõi Transaction logs real-time
- Theo dõi Application logs real-time
- Theo dõi tất cả logs cùng lúc
- Không cần PowerShell

### `search-logs.bat` - Tìm kiếm logs
- Tìm kiếm trong SQL logs
- Tìm kiếm trong Transaction logs
- Tìm kiếm trong Application logs
- Tìm kiếm trong tất cả logs
- Sử dụng `findstr` command

## Các loại log được ghi

### SQL Logs (`sql.log`)
- Tất cả SQL queries được thực thi
- Parameters được bind vào queries
- Thời gian thực thi query
- Số lượng rows affected

### Transaction Logs (`transaction.log`)
- Transaction begin/commit/rollback
- Connection pool events
- Database connection events
- JPA/Hibernate events

### Application Logs (`carrental.log`)
- Controller requests/responses
- Service method calls
- Business logic events
- Error messages và exceptions

## Ví dụ log output

### SQL Query Log
```
2025-01-20 10:30:15.123 [http-nio-8080-exec-1] DEBUG org.hibernate.SQL - 
    insert into bookings (car_id, customer_id, pickup_date_time, dropoff_date_time, status, created_at) 
    values (?, ?, ?, ?, ?, ?)
2025-01-20 10:30:15.124 [http-nio-8080-exec-1] TRACE org.hibernate.type.descriptor.sql.BasicBinder - 
    binding parameter [1] as [BIGINT] - [123]
2025-01-20 10:30:15.124 [http-nio-8080-exec-1] TRACE org.hibernate.type.descriptor.sql.BasicBinder - 
    binding parameter [2] as [BIGINT] - [456]
```

### Transaction Log
```
2025-01-20 10:30:15.120 [http-nio-8080-exec-1] DEBUG org.springframework.transaction - 
    Creating new transaction with name [com.carrental.car_rental.service.BookingService.createBooking]
2025-01-20 10:30:15.125 [http-nio-8080-exec-1] DEBUG org.springframework.transaction - 
    Initiating transaction commit
2025-01-20 10:30:15.126 [http-nio-8080-exec-1] DEBUG org.springframework.transaction - 
    Committing JPA transaction
```

### Application Log
```
2025-01-20 10:30:15.100 [http-nio-8080-exec-1] DEBUG com.carrental.car_rental.controller.BookingController - 
    Creating booking for car ID: 123
2025-01-20 10:30:15.130 [http-nio-8080-exec-1] DEBUG com.carrental.car_rental.service.BookingService - 
    Booking created successfully with ID: 789
```

## Debugging booking timeout issue

Để debug vấn đề timeout khi tạo booking:

### 1. Bật real-time monitoring:
```bash
# Sử dụng CMD script
tail-logs.bat

# Hoặc PowerShell (nếu có)
.\view-logs.ps1 -Type all -Follow
```

### 2. Tạo booking từ frontend và quan sát logs

### 3. Tìm kiếm các patterns:
```bash
# Tìm booking creation
search-logs.bat
# Chọn option 3 (Application Logs) và tìm "booking"

# Hoặc sử dụng CMD trực tiếp
findstr /i "booking" logs\carrental.log
findstr /i "INSERT" logs\sql.log
findstr /i "transaction" logs\transaction.log
```

### 4. Kiểm tra connection pool:
```bash
findstr /i "Hikari" logs\transaction.log
findstr /i "timeout" logs\carrental.log
findstr /i "connection" logs\transaction.log
```

## Cấu hình logging levels

Trong `application.properties`, bạn có thể điều chỉnh logging levels:

```properties
# Tắt SQL logging (production)
logging.level.org.hibernate.SQL=OFF

# Chỉ hiển thị SQL queries, không hiển thị parameters
logging.level.org.hibernate.SQL=DEBUG
logging.level.org.hibernate.type.descriptor.sql.BasicBinder=OFF

# Hiển thị tất cả SQL details
logging.level.org.hibernate.SQL=DEBUG
logging.level.org.hibernate.type.descriptor.sql.BasicBinder=TRACE
```

## Troubleshooting

### Log files không được tạo
1. Kiểm tra thư mục `logs/` có tồn tại không
2. Kiểm tra quyền ghi file
3. Kiểm tra application có chạy không

### Log quá nhiều
1. Giảm logging level trong `application.properties`
2. Xóa logs cũ: `view-logs.bat` → chọn option 7
3. Điều chỉnh log rotation trong `logback-spring.xml`

### Performance impact
- Logging có thể ảnh hưởng performance
- Trong production, chỉ bật logging khi cần debug
- Sử dụng log rotation để tránh file quá lớn

## Quick Commands

### Xem logs nhanh:
```bash
# Xem SQL logs
type logs\sql.log

# Xem transaction logs
type logs\transaction.log

# Xem application logs
type logs\carrental.log
```

### Tìm kiếm nhanh:
```bash
# Tìm lỗi
findstr /i "ERROR" logs\carrental.log

# Tìm booking
findstr /i "booking" logs\carrental.log

# Tìm SQL queries
findstr /i "INSERT" logs\sql.log
findstr /i "UPDATE" logs\sql.log
findstr /i "SELECT" logs\sql.log
```

### Real-time monitoring:
```bash
# Sử dụng script CMD
tail-logs.bat

# Hoặc PowerShell (nếu có)
Get-Content logs\carrental.log -Wait -Tail 10
``` 