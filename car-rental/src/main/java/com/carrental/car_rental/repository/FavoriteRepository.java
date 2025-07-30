package com.carrental.car_rental.repository;

import com.carrental.car_rental.entity.Favorite;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface FavoriteRepository extends JpaRepository<Favorite, Integer> {
    List<Favorite> findByUserIdAndIsDeletedFalse(Integer userId);

    @Query("SELECT f FROM Favorite f JOIN FETCH f.car WHERE f.user.id = :userId AND f.isDeleted = false")
    List<Favorite> findByUserIdAndIsDeletedFalseFetchCar(@Param("userId") Integer userId);
}