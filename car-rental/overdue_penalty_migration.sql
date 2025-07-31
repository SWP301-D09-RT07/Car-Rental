-- Add penalty and overdue handling fields to cash_payment_confirmations table
-- This handles overdue platform fee penalties and escalation

-- Extend platform_fee_status column to support new statuses
ALTER TABLE cash_payment_confirmations 
ALTER COLUMN platform_fee_status VARCHAR(30);

-- Add penalty and overdue tracking fields
ALTER TABLE cash_payment_confirmations
ADD overdue_penalty_rate DECIMAL(5, 4) DEFAULT 0.05, -- 5% penalty per week
    penalty_amount DECIMAL(15, 2) DEFAULT 0,
    total_amount_due DECIMAL(15, 2) NULL,
    overdue_since DATETIME NULL,
    escalation_level INT DEFAULT 0; -- 0=none, 1=warning, 2=restriction, 3=suspension

-- Create index for overdue queries
CREATE INDEX idx_cash_confirmations_overdue 
ON cash_payment_confirmations(platform_fee_status, overdue_since, escalation_level);

-- Add comments for documentation
EXEC sp_addextendedproperty 
    @name = N'MS_Description', 
    @value = N'Penalty rate per week for overdue platform fees (e.g., 0.05 = 5%)',
    @level0type = N'SCHEMA', @level0name = N'dbo',
    @level1type = N'TABLE', @level1name = N'cash_payment_confirmations',
    @level2type = N'COLUMN', @level2name = N'overdue_penalty_rate';

EXEC sp_addextendedproperty 
    @name = N'MS_Description', 
    @value = N'Accumulated penalty amount for overdue platform fees',
    @level0type = N'SCHEMA', @level0name = N'dbo',
    @level1type = N'TABLE', @level1name = N'cash_payment_confirmations',
    @level2type = N'COLUMN', @level2name = N'penalty_amount';

EXEC sp_addextendedproperty 
    @name = N'MS_Description', 
    @value = N'Total amount due including platform fee and penalties',
    @level0type = N'SCHEMA', @level0name = N'dbo',
    @level1type = N'TABLE', @level1name = N'cash_payment_confirmations',
    @level2type = N'COLUMN', @level2name = N'total_amount_due';

EXEC sp_addextendedproperty 
    @name = N'MS_Description', 
    @value = N'When the platform fee became overdue',
    @level0type = N'SCHEMA', @level0name = N'dbo',
    @level1type = N'TABLE', @level1name = N'cash_payment_confirmations',
    @level2type = N'COLUMN', @level2name = N'overdue_since';

EXEC sp_addextendedproperty 
    @name = N'MS_Description', 
    @value = N'Escalation level: 0=none, 1=warning, 2=restriction, 3=suspension',
    @level0type = N'SCHEMA', @level0name = N'dbo',
    @level1type = N'TABLE', @level1name = N'cash_payment_confirmations',
    @level2type = N'COLUMN', @level2name = N'escalation_level';
