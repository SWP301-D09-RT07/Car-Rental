package com.carrental.car_rental.service;
import com.carrental.car_rental.dto.ImageDTO;
import com.carrental.car_rental.entity.Image;
import com.carrental.car_rental.mapper.ImageMapper;
import com.carrental.car_rental.repository.ImageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.stream.Collectors;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ImageService {
    private final ImageRepository repository;
    private final ImageMapper mapper;

    @Value("${app.upload.dir}")
    private String uploadDir;

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

    public String saveImage(MultipartFile file, String type) throws IOException {
        // Tạo thư mục nếu chưa tồn tại
        Path uploadPath = Paths.get(uploadDir + "/" + type);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        // Tạo tên file ngẫu nhiên
        String fileName = UUID.randomUUID().toString() + getFileExtension(file.getOriginalFilename());
        Path filePath = uploadPath.resolve(fileName);

        // Lưu file
        Files.copy(file.getInputStream(), filePath);

        return "/uploads/" + type + "/" + fileName;
    }

    public void deleteImage(String imagePath) throws IOException {
        Path filePath = Paths.get(uploadDir + imagePath);
        Files.deleteIfExists(filePath);
    }

    private String getFileExtension(String fileName) {
        if (fileName == null) return "";
        int lastDotIndex = fileName.lastIndexOf(".");
        return lastDotIndex == -1 ? "" : fileName.substring(lastDotIndex);
    }
}