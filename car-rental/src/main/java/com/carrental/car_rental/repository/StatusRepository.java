package com.carrental.car_rental.repository;

import com.carrental.car_rental.entity.Status;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface StatusRepository extends JpaRepository<Status, Integer> {
    Optional<Status> findByStatusName(String statusName);
}