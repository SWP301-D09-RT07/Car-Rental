-- 31. Tạo bảng ChatMessage (Phiên bản tối ưu)
CREATE TABLE ChatMessage (
    message_id INT IDENTITY(1,1) PRIMARY KEY,
    sender_id INT NOT NULL,
    receiver_id INT NOT NULL,
    booking_id INT,
    message_content NVARCHAR(1000) NOT NULL,
    sent_at DATETIME2 NOT NULL DEFAULT GETDATE(), -- Đổi từ DATETIME sang DATETIME2 để tương thích với Instant
    is_read BIT DEFAULT 0,
    is_translated BIT DEFAULT 0,
    original_language VARCHAR(2),
    is_deleted BIT DEFAULT 0,
    FOREIGN KEY (sender_id) REFERENCES [User](user_id) ON DELETE NO ACTION,
    FOREIGN KEY (receiver_id) REFERENCES [User](user_id) ON DELETE NO ACTION,
    FOREIGN KEY (booking_id) REFERENCES Booking(booking_id) ON DELETE SET NULL,
    FOREIGN KEY (original_language) REFERENCES Language(language_code) ON DELETE SET NULL
);

-- Indexes tối ưu cho performance
CREATE INDEX idx_chatmessage_booking_id ON ChatMessage(booking_id);
CREATE INDEX idx_chatmessage_sent_at ON ChatMessage(sent_at);
CREATE INDEX idx_chatmessage_sender_receiver ON ChatMessage(sender_id, receiver_id); -- Index mới cho query conversation
CREATE INDEX idx_chatmessage_is_read ON ChatMessage(is_read) WHERE is_read = 0; -- Index filtered cho unread messages

GO

EXEC sys.sp_addextendedproperty 
    @name=N'MS_Description', 
    @value=N'Lưu trữ lịch sử tin nhắn trong chatbox với hỗ trợ real-time messaging', 
    @level0type=N'SCHEMA', @level0name=N'dbo', 
    @level1type=N'TABLE', @level1name=N'ChatMessage';

-- Thêm description cho từng column
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'ID tin nhắn tự tăng', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'ChatMessage', @level2type=N'COLUMN', @level2name=N'message_id';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'ID người gửi', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'ChatMessage', @level2type=N'COLUMN', @level2name=N'sender_id';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'ID người nhận', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'ChatMessage', @level2type=N'COLUMN', @level2name=N'receiver_id';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'ID booking liên quan (có thể null)', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'ChatMessage', @level2type=N'COLUMN', @level2name=N'booking_id';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'Nội dung tin nhắn', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'ChatMessage', @level2type=N'COLUMN', @level2name=N'message_content';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'Thời gian gửi tin nhắn', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'ChatMessage', @level2type=N'COLUMN', @level2name=N'sent_at';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'Đã đọc tin nhắn chưa', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'ChatMessage', @level2type=N'COLUMN', @level2name=N'is_read';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'Đã dịch tin nhắn chưa', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'ChatMessage', @level2type=N'COLUMN', @level2name=N'is_translated';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'Ngôn ngữ gốc của tin nhắn', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'ChatMessage', @level2type=N'COLUMN', @level2name=N'original_language';
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'Đã xóa tin nhắn chưa (soft delete)', @level0type=N'SCHEMA', @level0name=N'dbo', @level1type=N'TABLE', @level1name=N'ChatMessage', @level2type=N'COLUMN', @level2name=N'is_deleted';

GO
