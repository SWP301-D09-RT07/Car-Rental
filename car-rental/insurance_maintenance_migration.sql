-- Migration for Insurance and Maintenance tables
-- Add missing fields to existing tables

-- Update Insurance table - add missing fields
ALTER TABLE insurance 
ADD insurance_type NVARCHAR(100) NOT NULL DEFAULT N'Bảo hiểm bắt buộc',
premium DECIMAL(15,2) NOT NULL DEFAULT 0.00,
status NVARCHAR(50) DEFAULT N'Còn hiệu lực',
notes NVARCHAR(1000);

-- Update Maintenance table - add missing fields
ALTER TABLE maintenance 
ADD maintenance_type NVARCHAR(100) NOT NULL DEFAULT N'Bảo trì định kỳ',
service_center NVARCHAR(200) NOT NULL DEFAULT N'Trung tâm bảo trì',
status NVARCHAR(50) DEFAULT N'Đang bảo trì',
notes NVARCHAR(1000);

-- Update existing columns for better precision and length
ALTER TABLE maintenance ALTER COLUMN cost DECIMAL(15,2);
ALTER TABLE maintenance ALTER COLUMN description NVARCHAR(1000);

-- Add indexes for better performance
CREATE INDEX idx_insurance_car_id ON insurance(car_id);
CREATE INDEX idx_insurance_status ON insurance(status);
CREATE INDEX idx_maintenance_car_id ON maintenance(car_id);
CREATE INDEX idx_maintenance_status ON maintenance(status); 