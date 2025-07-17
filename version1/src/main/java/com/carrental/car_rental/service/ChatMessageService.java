package com.carrental.car_rental.service;

import com.carrental.car_rental.dto.ChatMessageDTO;
import com.carrental.car_rental.entity.ChatMessage;
import com.carrental.car_rental.mapper.ChatMessageMapper;
import com.carrental.car_rental.repository.ChatMessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChatMessageService {
    private final ChatMessageRepository repository;
    private final ChatMessageMapper mapper;

    public ChatMessageDTO findById(Integer id) {
        ChatMessage entity = repository.findById(id)
                .filter(e -> !e.getIsDeleted())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "ChatMessage not found with id: " + id));
        return mapper.toDTO(entity);
    }

    public List<ChatMessageDTO> findAll() {
        return repository.findAll().stream()
                .filter(e -> !e.getIsDeleted())
                .map(mapper::toDTO)
                .collect(Collectors.toList());
    }

    public List<ChatMessageDTO> findByBookingId(Integer bookingId) {
        return repository.findByBookingIdAndIsDeletedFalse(bookingId).stream()
                .map(mapper::toDTO)
                .collect(Collectors.toList());
    }

    public List<ChatMessageDTO> findBySenderIdAndReceiverId(Integer senderId, Integer receiverId) {
        return repository.findBySenderIdAndReceiverIdAndIsDeletedFalse(senderId, receiverId).stream()
                .map(mapper::toDTO)
                .collect(Collectors.toList());
    }

    public ChatMessageDTO save(ChatMessageDTO dto) {
        ChatMessage entity = mapper.toEntity(dto);
        entity.setIsDeleted(false);
        return mapper.toDTO(repository.save(entity));
    }

    public ChatMessageDTO update(Integer id, ChatMessageDTO dto) {
        ChatMessage entity = repository.findById(id)
                .filter(e -> !e.getIsDeleted())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "ChatMessage not found with id: " + id));
        ChatMessage updatedEntity = mapper.toEntity(dto);
        updatedEntity.setId(id);
        updatedEntity.setIsDeleted(false);
        return mapper.toDTO(repository.save(updatedEntity));
    }

    public void delete(Integer id) {
        ChatMessage entity = repository.findById(id)
                .filter(e -> !e.getIsDeleted())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "ChatMessage not found with id: " + id));
        entity.setIsDeleted(true);
        repository.save(entity);
    }
}