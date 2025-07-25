package com.carrental.car_rental.repository;

import com.carrental.car_rental.entity.FeeLevel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FeeLevelRepository extends JpaRepository<FeeLevel, Integer> {
    List<FeeLevel> findByIsDeletedFalse();

}