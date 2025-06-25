USE CarRentalDB;

-- Thêm dữ liệu mẫu cho xe và booking để làm phong phú báo cáo

-- 1. Thêm thêm xe mẫu
INSERT INTO Car (supplier_id, license_plate, model, [year], color, status_id, num_of_seats, daily_rate, region_id, brand_id, fuel_type_id, features, image, created_at, updated_at, is_deleted)
VALUES 
-- Xe của supplier 2 (NguyenVanHung)
(2, '30A-12345', 'Civic', 2020, 'Trắng', 11, 5, 800000, 1, 1, 1, 'AC, GPS, Bluetooth', '/images/Honda_Civic_2020_5.jpg', GETDATE(), GETDATE(), 0),
(2, '30A-12346', 'City', 2018, 'Đen', 11, 5, 600000, 1, 1, 1, 'AC, GPS', '/images/Honda_City_2018_2.jpg', GETDATE(), GETDATE(), 0),
(2, '30A-12347', 'BR-V', 2024, 'Xanh', 11, 7, 900000, 1, 1, 1, 'AC, GPS, Bluetooth, Camera lùi', '/images/Honda_BRV_G_2024_2.jpeg', GETDATE(), GETDATE(), 0),

-- Xe của supplier 3 (LeThiMai)
(3, '30B-54321', 'Accent', 2020, 'Bạc', 11, 5, 500000, 1, 2, 1, 'AC, GPS', '/images/Hyundai_Accent_2020_6.jpg', GETDATE(), GETDATE(), 0),
(3, '30B-54322', 'Elantra', 2021, 'Đỏ', 11, 5, 700000, 1, 2, 1, 'AC, GPS, Bluetooth', '/images/HUYNDAI_ELANTRA_1.jpg', GETDATE(), GETDATE(), 0),
(3, '30B-54323', 'Grand i10', 2022, 'Trắng', 11, 5, 400000, 1, 2, 1, 'AC', '/images/HUYNDAI_GRAND_i10_1.jpg', GETDATE(), GETDATE(), 0),

-- Xe của supplier 4 (TranVanNam)
(4, '30C-98765', 'Carnival', 2022, 'Đen', 11, 8, 1200000, 1, 3, 1, 'AC, GPS, Bluetooth, Camera lùi, Màn hình DVD', '/images/KIA_Carnival_2022_6.jpg', GETDATE(), GETDATE(), 0),
(4, '30C-98766', 'Carens', 2023, 'Trắng', 11, 7, 1000000, 1, 3, 1, 'AC, GPS, Bluetooth, Camera lùi', '/images/KIA_Carens_2023_5.jpg', GETDATE(), GETDATE(), 0),
(4, '30C-98767', 'Sorento', 2021, 'Xanh', 11, 7, 1100000, 1, 3, 1, 'AC, GPS, Bluetooth, Camera lùi', '/images/KIA_Sorento_2021_5.jpg', GETDATE(), GETDATE(), 0),

-- Xe của supplier 5 (PhamThiLan)
(5, '30D-11111', 'Mazda 3', 2021, 'Đỏ', 11, 5, 750000, 1, 4, 1, 'AC, GPS, Bluetooth', '/images/Mazda_3_2021_5.jpg', GETDATE(), GETDATE(), 0),
(5, '30D-11112', 'Mazda 6', 2017, 'Bạc', 11, 5, 650000, 1, 4, 1, 'AC, GPS', '/images/Mazda_6_2017_5.jpg', GETDATE(), GETDATE(), 0),
(5, '30D-11113', 'CX-8', 2020, 'Đen', 11, 7, 950000, 1, 4, 1, 'AC, GPS, Bluetooth, Camera lùi', '/images/Mazda_CX8_2020_6.jpg', GETDATE(), GETDATE(), 0);

-- 2. Thêm booking mẫu cho các xe (tạo nhiều booking cho xe phổ biến)
-- Booking cho xe Civic (xe phổ biến nhất)
INSERT INTO Booking (car_id, customer_id, start_date, end_date, booking_date, status_id, region_id, promo_id, is_deleted)
VALUES 
(1, 6, '2024-01-15', '2024-01-17', '2024-01-10', 2, 1, NULL, 0),
(1, 7, '2024-02-20', '2024-02-22', '2024-02-15', 2, 1, NULL, 0),
(1, 8, '2024-03-10', '2024-03-12', '2024-03-05', 2, 1, NULL, 0),
(1, 9, '2024-04-05', '2024-04-07', '2024-04-01', 2, 1, NULL, 0),
(1, 10, '2024-05-12', '2024-05-14', '2024-05-08', 2, 1, NULL, 0),
(1, 6, '2024-06-18', '2024-06-20', '2024-06-13', 2, 1, NULL, 0),
(1, 7, '2024-07-25', '2024-07-27', '2024-07-20', 2, 1, NULL, 0),
(1, 8, '2024-08-30', '2024-09-01', '2024-08-25', 2, 1, NULL, 0);

-- Booking cho xe Accent (xe phổ biến thứ 2)
INSERT INTO Booking (car_id, customer_id, start_date, end_date, booking_date, status_id, region_id, promo_id, is_deleted)
VALUES 
(4, 6, '2024-01-20', '2024-01-22', '2024-01-15', 2, 1, NULL, 0),
(4, 7, '2024-02-25', '2024-02-27', '2024-02-20', 2, 1, NULL, 0),
(4, 8, '2024-03-15', '2024-03-17', '2024-03-10', 2, 1, NULL, 0),
(4, 9, '2024-04-10', '2024-04-12', '2024-04-05', 2, 1, NULL, 0),
(4, 10, '2024-05-17', '2024-05-19', '2024-05-13', 2, 1, NULL, 0),
(4, 6, '2024-06-23', '2024-06-25', '2024-06-18', 2, 1, NULL, 0);

-- Booking cho xe Carnival
INSERT INTO Booking (car_id, customer_id, start_date, end_date, booking_date, status_id, region_id, promo_id, is_deleted)
VALUES 
(7, 6, '2024-01-25', '2024-01-27', '2024-01-20', 2, 1, NULL, 0),
(7, 7, '2024-02-28', '2024-03-02', '2024-02-23', 2, 1, NULL, 0),
(7, 8, '2024-03-20', '2024-03-22', '2024-03-15', 2, 1, NULL, 0),
(7, 9, '2024-04-15', '2024-04-17', '2024-04-10', 2, 1, NULL, 0);

-- Booking cho xe Mazda 3
INSERT INTO Booking (car_id, customer_id, start_date, end_date, booking_date, status_id, region_id, promo_id, is_deleted)
VALUES 
(10, 6, '2024-01-30', '2024-02-01', '2024-01-25', 2, 1, NULL, 0),
(10, 7, '2024-03-05', '2024-03-07', '2024-02-28', 2, 1, NULL, 0),
(10, 8, '2024-04-25', '2024-04-27', '2024-04-20', 2, 1, NULL, 0);

-- 3. Thêm BookingFinancials cho các booking
-- Civic bookings
INSERT INTO BookingFinancials (booking_id, base_fare, insurance_cost, delivery_fee, tax_amount, discount_amount, total_fare, created_at, updated_at, is_deleted)
VALUES 
(1, 1600000, 100000, 0, 80000, 0, 1780000, GETDATE(), GETDATE(), 0),
(2, 1600000, 100000, 0, 80000, 0, 1780000, GETDATE(), GETDATE(), 0),
(3, 1600000, 100000, 0, 80000, 0, 1780000, GETDATE(), GETDATE(), 0),
(4, 1600000, 100000, 0, 80000, 0, 1780000, GETDATE(), GETDATE(), 0),
(5, 1600000, 100000, 0, 80000, 0, 1780000, GETDATE(), GETDATE(), 0),
(6, 1600000, 100000, 0, 80000, 0, 1780000, GETDATE(), GETDATE(), 0),
(7, 1600000, 100000, 0, 80000, 0, 1780000, GETDATE(), GETDATE(), 0),
(8, 1600000, 100000, 0, 80000, 0, 1780000, GETDATE(), GETDATE(), 0);

-- Accent bookings
INSERT INTO BookingFinancials (booking_id, base_fare, insurance_cost, delivery_fee, tax_amount, discount_amount, total_fare, created_at, updated_at, is_deleted)
VALUES 
(9, 1000000, 80000, 0, 50000, 0, 1130000, GETDATE(), GETDATE(), 0),
(10, 1000000, 80000, 0, 50000, 0, 1130000, GETDATE(), GETDATE(), 0),
(11, 1000000, 80000, 0, 50000, 0, 1130000, GETDATE(), GETDATE(), 0),
(12, 1000000, 80000, 0, 50000, 0, 1130000, GETDATE(), GETDATE(), 0),
(13, 1000000, 80000, 0, 50000, 0, 1130000, GETDATE(), GETDATE(), 0),
(14, 1000000, 80000, 0, 50000, 0, 1130000, GETDATE(), GETDATE(), 0);

-- Carnival bookings
INSERT INTO BookingFinancials (booking_id, base_fare, insurance_cost, delivery_fee, tax_amount, discount_amount, total_fare, created_at, updated_at, is_deleted)
VALUES 
(15, 2400000, 150000, 0, 120000, 0, 2670000, GETDATE(), GETDATE(), 0),
(16, 2400000, 150000, 0, 120000, 0, 2670000, GETDATE(), GETDATE(), 0),
(17, 2400000, 150000, 0, 120000, 0, 2670000, GETDATE(), GETDATE(), 0),
(18, 2400000, 150000, 0, 120000, 0, 2670000, GETDATE(), GETDATE(), 0);

-- Mazda 3 bookings
INSERT INTO BookingFinancials (booking_id, base_fare, insurance_cost, delivery_fee, tax_amount, discount_amount, total_fare, created_at, updated_at, is_deleted)
VALUES 
(19, 1500000, 100000, 0, 75000, 0, 1675000, GETDATE(), GETDATE(), 0),
(20, 1500000, 100000, 0, 75000, 0, 1675000, GETDATE(), GETDATE(), 0),
(21, 1500000, 100000, 0, 75000, 0, 1675000, GETDATE(), GETDATE(), 0);

-- 4. Thêm hình ảnh cho xe mới
INSERT INTO [Image] (car_id, image_url, description, is_main, created_at, updated_at, is_deleted)
VALUES 
-- Hình ảnh cho xe Civic
(1, '/images/Honda_Civic_2020_5.jpg', 'Honda Civic 2020 - Góc trước', 1, GETDATE(), GETDATE(), 0),
(1, '/images/Honda_Civic_2020_6.jpg', 'Honda Civic 2020 - Nội thất', 0, GETDATE(), GETDATE(), 0),
(1, '/images/Honda_Civic_2020_9.jpg', 'Honda Civic 2020 - Góc sau', 0, GETDATE(), GETDATE(), 0),

-- Hình ảnh cho xe Accent
(4, '/images/Hyundai_Accent_2020_6.jpg', 'Hyundai Accent 2020 - Góc trước', 1, GETDATE(), GETDATE(), 0),
(4, '/images/Hyundai_Accent_2020_7.jpg', 'Hyundai Accent 2020 - Nội thất', 0, GETDATE(), GETDATE(), 0),
(4, '/images/Hyundai_Accent_2020_8.jpg', 'Hyundai Accent 2020 - Góc sau', 0, GETDATE(), GETDATE(), 0),

-- Hình ảnh cho xe Carnival
(7, '/images/KIA_Carnival_2022_6.jpg', 'KIA Carnival 2022 - Góc trước', 1, GETDATE(), GETDATE(), 0),
(7, '/images/KIA_Carnival_2022_7.jpg', 'KIA Carnival 2022 - Nội thất', 0, GETDATE(), GETDATE(), 0),
(7, '/images/KIA_Carnival_2022_13.jpg', 'KIA Carnival 2022 - Góc sau', 0, GETDATE(), GETDATE(), 0),

-- Hình ảnh cho xe Mazda 3
(10, '/images/Mazda_3_2021_5.jpg', 'Mazda 3 2021 - Góc trước', 1, GETDATE(), GETDATE(), 0),
(10, '/images/Mazda_3_2021_6.jpg', 'Mazda 3 2021 - Nội thất', 0, GETDATE(), GETDATE(), 0),
(10, '/images/Mazda_3_2021_7.jpg', 'Mazda 3 2021 - Góc sau', 0, GETDATE(), GETDATE(), 0);

PRINT 'Đã thêm dữ liệu mẫu thành công!';
PRINT 'Xe Honda Civic sẽ là xe phổ biến nhất với 8 lượt đặt';
PRINT 'Xe Hyundai Accent sẽ là xe phổ biến thứ 2 với 6 lượt đặt'; 