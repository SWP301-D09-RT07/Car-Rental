package com.carrental.car_rental.mapper;

import com.carrental.car_rental.dto.ChatMessageDTO;
import com.carrental.car_rental.entity.ChatMessage;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring", uses = CommonMapper.class)
public interface ChatMessageMapper {
    @Mapping(source = "id", target = "chatMessageId")
    @Mapping(source = "booking.id", target = "bookingId")
    @Mapping(source = "sender.id", target = "senderId")
    @Mapping(source = "sender.email", target = "senderEmail")
    @Mapping(source = "receiver.id", target = "receiverId")
    @Mapping(source = "receiver.email", target = "receiverEmail")
    @Mapping(source = "messageContent", target = "messageContent")
    @Mapping(source = "sentAt", target = "sentAt", qualifiedByName = "instantToLocalDateTime")
    @Mapping(target = "createdAt", ignore = true) // Bỏ qua vì không có trong entity
    @Mapping(target = "updatedAt", ignore = true) // Bỏ qua vì không có trong entity
    ChatMessageDTO toDTO(ChatMessage entity);

    @Mapping(source = "chatMessageId", target = "id")
    @Mapping(source = "bookingId", target = "booking.id")
    @Mapping(source = "senderId", target = "sender.id")
    @Mapping(source = "receiverId", target = "receiver.id")
    @Mapping(source = "messageContent", target = "messageContent")
    @Mapping(source = "sentAt", target = "sentAt", qualifiedByName = "localDateTimeToInstant")
    @Mapping(target = "isRead", ignore = true)
    @Mapping(target = "isTranslated", ignore = true)
    @Mapping(target = "originalLanguage", ignore = true)
    @Mapping(target = "isDeleted", ignore = true)
    ChatMessage toEntity(ChatMessageDTO dto);
}