package com.carrental.car_rental.controller;

import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import com.carrental.car_rental.dto.ChatMessage;

@Controller
public class ChatController {

    @MessageMapping("/chat.sendMessage")
    public void sendMessage(@Payload ChatMessage chatMessage, SimpMessagingTemplate messagingTemplate) {
        String topic = "/topic/chat." + chatMessage.getSenderId() + "." + chatMessage.getReceiverId();
        messagingTemplate.convertAndSend(topic, chatMessage);
        // Nếu muốn gửi cho cả chiều ngược lại (supplier trả lời user):
        String reverseTopic = "/topic/chat." + chatMessage.getReceiverId() + "." + chatMessage.getSenderId();
        if (!topic.equals(reverseTopic)) {
            messagingTemplate.convertAndSend(reverseTopic, chatMessage);
        }
    }

    @MessageMapping("/chat.addUser")
    @SendTo("/topic/messages")
    public ChatMessage addUser(@Payload ChatMessage chatMessage, SimpMessageHeaderAccessor headerAccessor) {
        // Add username in web socket session
        headerAccessor.getSessionAttributes().put("username", chatMessage.getSender());
        return chatMessage;
    }
} 