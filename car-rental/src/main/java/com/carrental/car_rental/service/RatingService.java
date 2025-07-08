package com.carrental.car_rental.service;
import com.carrental.car_rental.dto.RatingDTO;
import com.carrental.car_rental.dto.RatingSummaryDTO;
import com.carrental.car_rental.entity.Rating;
import com.carrental.car_rental.mapper.RatingMapper;
import com.carrental.car_rental.repository.RatingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RatingService {
    private final RatingRepository ratingRepository;
    private final RatingMapper ratingMapper;

    public RatingDTO findById(Integer id) {
        Rating entity = ratingRepository.findById(id)
                .filter(e -> !e.getIsDeleted())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Rating not found with id: " + id));
        return ratingMapper.toDTO(entity);
    }

    public List<RatingDTO> findAll() {
        return ratingRepository.findAll().stream()
                .filter(e -> !e.getIsDeleted())
                .map(ratingMapper::toDTO)
                .collect(Collectors.toList());
    }

    public List<RatingDTO> findByBookingId(Integer bookingId) {
        return ratingRepository.findByBookingIdAndIsDeletedFalse(bookingId)
                .stream()
                .map(ratingMapper::toDTO)
                .collect(Collectors.toList());
    }

    public List<RatingDTO> findByCarId(Integer carId) {
        return ratingRepository.findByCarIdAndIsDeletedFalse(carId)
                .stream()
                .map(ratingMapper::toDTO)
                .collect(Collectors.toList());
    }

    public List<RatingSummaryDTO> getRatingSummaryByCarId(Integer carId) {
        return ratingRepository.findRatingSummaryByCarId(carId)
                .stream()
                .map(projection -> new RatingSummaryDTO(
                        projection.getStars(),
                        projection.getPercentage(),
                        projection.getCount()
                ))
                .collect(Collectors.toList());
    }

    public RatingDTO save(RatingDTO dto) {
        Rating entity = ratingMapper.toEntity(dto);
        entity.setIsDeleted(false);
        return ratingMapper.toDTO(ratingRepository.save(entity));
    }

    public RatingDTO update(Integer id, RatingDTO dto) {
        Rating entity = ratingRepository.findById(id)
                .filter(e -> !e.getIsDeleted())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Rating not found with id: " + id));
        Rating updatedEntity = ratingMapper.toEntity(dto);
        updatedEntity.setId(id);
        updatedEntity.setIsDeleted(false);
        return ratingMapper.toDTO(ratingRepository.save(updatedEntity));
    }

    public void delete(Integer id) {
        Rating entity = ratingRepository.findById(id)
                .filter(e -> !e.getIsDeleted())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Rating not found with id: " + id));
        entity.setIsDeleted(true);
        ratingRepository.save(entity);
    }
}