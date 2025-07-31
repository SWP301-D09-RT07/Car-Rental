-- Fix CashPaymentConfirmation table issues
-- This script fixes the MS_Description conflict and ensures all columns exist

USE [CarRentalDB];
GO

-- Check if columns exist and add them if missing
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'cash_payment_confirmations' AND COLUMN_NAME = 'platform_fee_payment_id')
BEGIN
    ALTER TABLE cash_payment_confirmations ADD platform_fee_payment_id INT NULL;
    PRINT 'Added platform_fee_payment_id column';
END
ELSE
BEGIN
    PRINT 'platform_fee_payment_id column already exists';
END

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'cash_payment_confirmations' AND COLUMN_NAME = 'platform_fee_status')
BEGIN
    ALTER TABLE cash_payment_confirmations ADD platform_fee_status NVARCHAR(30) NULL DEFAULT 'pending';
    PRINT 'Added platform_fee_status column';
END
ELSE
BEGIN
    PRINT 'platform_fee_status column already exists';
END

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'cash_payment_confirmations' AND COLUMN_NAME = 'updated_at')
BEGIN
    ALTER TABLE cash_payment_confirmations ADD updated_at DATETIME2 NULL;
    PRINT 'Added updated_at column';
END
ELSE
BEGIN
    PRINT 'updated_at column already exists';
END

-- Remove any conflicting MS_Description properties
IF EXISTS (SELECT * FROM sys.extended_properties WHERE major_id = OBJECT_ID('cash_payment_confirmations') AND name = 'MS_Description' AND minor_id = 0)
BEGIN
    EXEC sp_dropextendedproperty 'MS_Description', 'SCHEMA', 'dbo', 'TABLE', 'cash_payment_confirmations';
    PRINT 'Removed existing MS_Description for cash_payment_confirmations table';
END

-- Check current table structure
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'cash_payment_confirmations'
ORDER BY ORDINAL_POSITION;

PRINT 'CashPaymentConfirmation table structure updated successfully';
