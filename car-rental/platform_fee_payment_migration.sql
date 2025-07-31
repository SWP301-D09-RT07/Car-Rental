-- Add platform_fee_payment_id field to cash_payment_confirmations table
-- This field will link to Payment record when supplier initiates platform fee payment

ALTER TABLE cash_payment_confirmations
ADD platform_fee_payment_id INT NULL;

-- Add foreign key constraint (optional - depends on your preference)
-- ALTER TABLE cash_payment_confirmations
-- ADD CONSTRAINT FK_cash_confirmations_platform_fee_payment 
-- FOREIGN KEY (platform_fee_payment_id) REFERENCES Payment(payment_id);

-- Update platform_fee_status values to include 'processing'
-- existing values: 'pending', 'paid', 'overdue'
-- new value: 'processing' (when payment is initiated but not yet completed)

-- Add index for better performance
CREATE INDEX idx_cash_confirmations_platform_fee_payment 
ON cash_payment_confirmations(platform_fee_payment_id);

-- Add comment for documentation
EXEC sp_addextendedproperty 
    @name = N'MS_Description', 
    @value = N'Reference to Payment record when supplier initiates platform fee payment',
    @level0type = N'SCHEMA', @level0name = N'dbo',
    @level1type = N'TABLE', @level1name = N'cash_payment_confirmations',
    @level2type = N'COLUMN', @level2name = N'platform_fee_payment_id';
