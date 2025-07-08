package com.carrental.car_rental.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessageDTO {
    private Integer chatMessageId;
    private Integer bookingId;
    private Integer senderId;
    private String senderEmail;
    private Integer receiverId;
    private String receiverEmail;
    private String messageContent;
    private LocalDateTime sentAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}