package com.carrental.car_rental.repository;

import com.carrental.car_rental.entity.Favorite;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FavoriteRepository extends JpaRepository<Favorite, Integer> {
    List<Favorite> findByUserIdAndIsDeletedFalse(Integer userId);
}