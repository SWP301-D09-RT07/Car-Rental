package com.carrental.car_rental.controller;

import com.carrental.car_rental.dto.RatingDTO;
import com.carrental.car_rental.dto.RatingSummaryDTO;
import com.carrental.car_rental.service.RatingService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ratings")
public class RatingController {
    private static final Logger logger = LoggerFactory.getLogger(RatingController.class);
    private final RatingService service;

    public RatingController(RatingService service) {
        this.service = service;
    }

    @GetMapping("/{id}")
    public ResponseEntity<RatingDTO> getRating(@PathVariable Integer id) {
        logger.info("Request to get rating by ID: {}", id);
        return ResponseEntity.ok(service.findById(id));
    }

    @GetMapping
    public ResponseEntity<List<RatingDTO>> getAllRatings() {
        logger.info("Request to get all ratings");
        return ResponseEntity.ok(service.findAll());
    }

    @GetMapping(params = "carId")
    public ResponseEntity<List<RatingDTO>> getRatingsByCarId(@RequestParam Integer carId) {
        logger.info("Request to get ratings for car ID: {}", carId);
        return ResponseEntity.ok(service.findByCarId(carId));
    }

    @GetMapping(params = "bookingId")
    public ResponseEntity<List<RatingDTO>> getRatingsByBookingId(@RequestParam Integer bookingId) {
        logger.info("Request to get ratings for booking ID: {}", bookingId);
        return ResponseEntity.ok(service.findByBookingId(bookingId));
    }

    @GetMapping("/summary")
    public ResponseEntity<List<RatingSummaryDTO>> getRatingSummaryByCarId(@RequestParam Integer carId) {
        logger.info("Request to get rating summary for car ID: {}", carId);
        return ResponseEntity.ok(service.getRatingSummaryByCarId(carId));
    }

    @PostMapping
    public ResponseEntity<RatingDTO> createRating(@RequestBody RatingDTO dto) {
        logger.info("Request to create a new rating");
        return ResponseEntity.status(201).body(service.save(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<RatingDTO> updateRating(@PathVariable Integer id, @RequestBody RatingDTO dto) {
        logger.info("Request to update rating with ID: {}", id);
        return ResponseEntity.ok(service.update(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRating(@PathVariable Integer id) {
        logger.info("Request to delete rating with ID: {}", id);
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}