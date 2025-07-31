-- Rename column 'status' to 'status_id' in Insurance table if it exists
IF EXISTS (
    SELECT 1
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'Insurance'
      AND COLUMN_NAME = 'status'
)
BEGIN
    EXEC sp_rename 'Insurance.status', 'status_id', 'COLUMN';
    PRINT 'Renamed column status to status_id in Insurance.';
END
ELSE
BEGIN
    PRINT 'Column status does not exist in Insurance.';
END

-- Rename column 'status' to 'status_id' in Maintenance table if it exists
IF EXISTS (
    SELECT 1
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'Maintenance'
      AND COLUMN_NAME = 'status'
)
BEGIN
    EXEC sp_rename 'Maintenance.status', 'status_id', 'COLUMN';
    PRINT 'Renamed column status to status_id in Maintenance.';
END
ELSE
BEGIN
    PRINT 'Column status does not exist in Maintenance.';
END

-- Ensure all NULL status_id are set to default value (8 = Đang hiệu lực)
UPDATE Insurance
SET status_id = 8
WHERE status_id IS NULL;

UPDATE Maintenance
SET status_id = 8
WHERE status_id IS NULL;

-- Create index on Insurance.status_id if not exists
IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IX_Insurance_status_id'
      AND object_id = OBJECT_ID('Insurance')
)
BEGIN
    CREATE INDEX IX_Insurance_status_id ON Insurance(status_id);
    PRINT 'Created index IX_Insurance_status_id.';
END

-- Create index on Maintenance.status_id if not exists
IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IX_Maintenance_status_id'
      AND object_id = OBJECT_ID('Maintenance')
)
BEGIN
    CREATE INDEX IX_Maintenance_status_id ON Maintenance(status_id);
    PRINT 'Created index IX_Maintenance_status_id.';
END

-- Optional: Add foreign key if Status table exists
-- ALTER TABLE Insurance
-- ADD CONSTRAINT FK_Insurance_Status FOREIGN KEY (status_id) REFERENCES Status(status_id);

-- ALTER TABLE Maintenance
-- ADD CONSTRAINT FK_Maintenance_Status FOREIGN KEY (status_id) REFERENCES Status(status_id);
