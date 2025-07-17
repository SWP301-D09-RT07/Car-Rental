package com.carrental.car_rental.repository;

import com.carrental.car_rental.entity.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Integer> {
    List<ChatMessage> findByBookingIdAndIsDeletedFalse(Integer bookingId);
    List<ChatMessage> findBySenderIdAndReceiverIdAndIsDeletedFalse(Integer senderId, Integer receiverId);
}