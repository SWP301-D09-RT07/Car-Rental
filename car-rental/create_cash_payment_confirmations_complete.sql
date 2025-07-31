-- Complete Cash Payment Confirmations Table Setup
-- This script creates the full cash_payment_confirmations table with all required columns

USE [CarRentalDB];
GO

-- Drop existing table if it exists (with all its constraints and triggers)
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[cash_payment_confirmations]') AND type in (N'U'))
BEGIN
    -- Drop trigger first
    IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'tr_cash_payment_confirmations_updated_at')
    BEGIN
        DROP TRIGGER tr_cash_payment_confirmations_updated_at;
        PRINT 'Dropped existing trigger tr_cash_payment_confirmations_updated_at';
    END
    
    -- Drop table
    DROP TABLE cash_payment_confirmations;
    PRINT 'Dropped existing cash_payment_confirmations table';
END
GO

-- Create the complete cash_payment_confirmations table
CREATE TABLE cash_payment_confirmations (
    id INT IDENTITY(1,1) PRIMARY KEY,
    payment_id INT NOT NULL,
    supplier_id INT NOT NULL,
    amount_received DECIMAL(15,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'VND',
    received_at DATETIME2 DEFAULT GETDATE(),
    confirmation_type VARCHAR(20) DEFAULT 'pickup',
    supplier_confirmation_code VARCHAR(50),
    is_confirmed BIT DEFAULT 0,
    notes VARCHAR(500),
    platform_fee DECIMAL(15,2) NOT NULL,
    platform_fee_status VARCHAR(20) DEFAULT 'pending',
    platform_fee_due_date DATETIME2,
    platform_fee_paid_at DATETIME2 NULL,
    platform_fee_payment_id INT NULL,
    overdue_penalty_rate DECIMAL(5,2) DEFAULT 0.05,
    penalty_amount DECIMAL(15,2) DEFAULT 0,
    total_amount_due DECIMAL(15,2) NULL,
    overdue_since DATETIME NULL,
    escalation_level INT DEFAULT 0,
    is_deleted BIT DEFAULT 0,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    
    CONSTRAINT FK_cash_payment_confirmations_payment_id 
        FOREIGN KEY (payment_id) REFERENCES Payment(payment_id) ON DELETE CASCADE,
    CONSTRAINT FK_cash_payment_confirmations_supplier_id 
        FOREIGN KEY (supplier_id) REFERENCES [User](user_id) ON DELETE CASCADE
);
GO

-- Create indexes
CREATE INDEX idx_cash_payment_confirmations_payment_id ON cash_payment_confirmations(payment_id);
CREATE INDEX idx_cash_payment_confirmations_supplier_id ON cash_payment_confirmations(supplier_id);
CREATE INDEX idx_cash_payment_confirmations_platform_fee_status ON cash_payment_confirmations(platform_fee_status);
CREATE INDEX idx_cash_payment_confirmations_platform_fee_due_date ON cash_payment_confirmations(platform_fee_due_date);
CREATE INDEX idx_cash_payment_confirmations_is_confirmed ON cash_payment_confirmations(is_confirmed);
CREATE INDEX idx_cash_payment_confirmations_is_deleted ON cash_payment_confirmations(is_deleted);
GO

-- Create trigger for updated_at column
CREATE TRIGGER tr_cash_payment_confirmations_updated_at
ON cash_payment_confirmations
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE cash_payment_confirmations 
    SET updated_at = GETDATE()
    FROM cash_payment_confirmations cpc
    INNER JOIN inserted i ON cpc.id = i.id;
END;
GO

-- Add extended property for table description (SQL Server equivalent of COMMENT)
EXEC sp_addextendedproperty 
    @name = N'MS_Description', 
    @value = N'Tracks cash payment confirmations and platform fee management for suppliers',
    @level0type = N'SCHEMA', @level0name = N'dbo',
    @level1type = N'TABLE', @level1name = N'cash_payment_confirmations';
GO

-- Show the table structure
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'cash_payment_confirmations'
ORDER BY ORDINAL_POSITION;

PRINT 'Cash Payment Confirmations table created successfully with all required columns';
