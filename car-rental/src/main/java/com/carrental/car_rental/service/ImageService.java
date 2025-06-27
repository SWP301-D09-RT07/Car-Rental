package com.carrental.car_rental.service;
import com.carrental.car_rental.dto.ImageDTO;
import com.carrental.car_rental.entity.Image;
import com.carrental.car_rental.mapper.ImageMapper;
import com.carrental.car_rental.repository.ImageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ImageService {
    private final ImageRepository repository;
    private final ImageMapper mapper;

    public ImageDTO findById(Integer id) {
        Image entity = repository.findById(id)
                .filter(e -> !e.getIsDeleted())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Hình ảnh không tìm thấy với id: " + id));
        return mapper.toDTO(entity);
    }

    public List<ImageDTO> findAll() {
        return repository.findAll().stream()
                .filter(e -> !e.getIsDeleted())
                .map(mapper::toDTO)
                .collect(Collectors.toList());
    }

    public List<ImageDTO> findByCarId(Integer carId) {
        return repository.findByCarIdAndIsDeletedFalse(carId).stream()
                .map(mapper::toDTO)
                .collect(Collectors.toList());
    }

    public ImageDTO save(ImageDTO dto) {
        Image entity = mapper.toEntity(dto);
        entity.setIsDeleted(false);
        return mapper.toDTO(repository.save(entity));
    }

    public ImageDTO update(Integer id, ImageDTO dto) {
        Image existing = repository.findById(id)
                .filter(e -> !e.getIsDeleted())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Hình ảnh không tìm thấy với id: " + id));

        mapper.partialUpdate(existing, dto); // Create this method in your mapper
        existing.setIsDeleted(false); // Ensure it's not marked deleted
        return mapper.toDTO(repository.save(existing));
    }



    public void delete(Integer id) {
        Image entity = repository.findById(id)
                .filter(e -> !e.getIsDeleted())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Hình ảnh không tìm thấy với id: " + id));
        entity.setIsDeleted(true);
        repository.save(entity);
    }
}