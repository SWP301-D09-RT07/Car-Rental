package com.carrental.car_rental.service;
import com.carrental.car_rental.dto.MaintenanceDTO;
import com.carrental.car_rental.entity.Maintenance;
import com.carrental.car_rental.mapper.MaintenanceMapper;
import com.carrental.car_rental.repository.MaintenanceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MaintenanceService {
    private final MaintenanceRepository repository;
    private final MaintenanceMapper mapper;

    public MaintenanceDTO findById(Integer id) {
        Maintenance entity = repository.findById(id)
                .filter(e -> !e.getIsDeleted())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Maintenance not found with id: " + id));
        return mapper.toDTO(entity);
    }

    // Lấy tất cả bảo trì (của hoàng)
    public List<MaintenanceDTO> findAll() {
        return repository.findAll().stream()
                .filter(e -> !e.getIsDeleted())
                .map(mapper::toDTO)
                .collect(Collectors.toList());
    }

    public List<MaintenanceDTO> findByCarId(Integer carId) {
        return repository.findByCarIdAndIsDeletedFalse(carId).stream()
                .map(mapper::toDTO)
                .collect(Collectors.toList());
    }

    // Lưu bảo trì mới (của hoàng)
    public MaintenanceDTO save(MaintenanceDTO dto) {
        Maintenance entity = mapper.toEntity(dto);
        entity.setIsDeleted(false);
        return mapper.toDTO(repository.save(entity));
    }

    public MaintenanceDTO update(Integer id, MaintenanceDTO dto) {
        Maintenance entity = repository.findById(id)
                .filter(e -> !e.getIsDeleted())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Maintenance not found with id: " + id));
        Maintenance updatedEntity = mapper.toEntity(dto);
        updatedEntity.setId(id);
        updatedEntity.setIsDeleted(false);
        return mapper.toDTO(repository.save(updatedEntity));
    }

    public void delete(Integer id) {
        Maintenance entity = repository.findById(id)
                .filter(e -> !e.getIsDeleted())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Maintenance not found with id: " + id));
        entity.setIsDeleted(true);
        repository.save(entity);
    }
}