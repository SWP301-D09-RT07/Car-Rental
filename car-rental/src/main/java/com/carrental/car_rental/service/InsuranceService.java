package com.carrental.car_rental.service;
import com.carrental.car_rental.dto.InsuranceDTO;
import com.carrental.car_rental.entity.Insurance;
import com.carrental.car_rental.mapper.InsuranceMapper;
import com.carrental.car_rental.repository.InsuranceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InsuranceService {
    private final InsuranceRepository repository;
    private final InsuranceMapper mapper;

    public InsuranceDTO findById(Integer id) {
        Insurance entity = repository.findById(id)
                .filter(e -> !e.getIsDeleted())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Insurance not found with id: " + id));
        return mapper.toDTO(entity);
    }

    public List<InsuranceDTO> findAll() {
        return repository.findAll().stream()
                .filter(e -> !e.getIsDeleted())
                .map(mapper::toDTO)
                .collect(Collectors.toList());
    }

    public List<InsuranceDTO> findByBookingId(Integer bookingId) {
        return repository.findByBookingIdAndIsDeletedFalse(bookingId).stream()
                .map(mapper::toDTO)
                .collect(Collectors.toList());
    }

    public InsuranceDTO save(InsuranceDTO dto) {
        Insurance entity = mapper.toEntity(dto);
        entity.setIsDeleted(false);
        return mapper.toDTO(repository.save(entity));
    }

    public InsuranceDTO update(Integer id, InsuranceDTO dto) {
        Insurance entity = repository.findById(id)
                .filter(e -> !e.getIsDeleted())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Insurance not found with id: " + id));
        Insurance updatedEntity = mapper.toEntity(dto);
        updatedEntity.setId(id);
        updatedEntity.setIsDeleted(false);
        return mapper.toDTO(repository.save(updatedEntity));
    }

    public void delete(Integer id) {
        Insurance entity = repository.findById(id)
                .filter(e -> !e.getIsDeleted())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Insurance not found with id: " + id));
        entity.setIsDeleted(true);
        repository.save(entity);
    }
}