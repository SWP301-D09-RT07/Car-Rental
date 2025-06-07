package com.carrental.car_rental.repository;

import com.carrental.car_rental.entity.Car;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface CarRepository extends JpaRepository<Car, Integer> {
    @Query("SELECT c FROM Car c JOIN FETCH c.brand JOIN FETCH c.fuelType JOIN FETCH c.region JOIN FETCH c.status WHERE c.isDeleted = false AND c.status.id = 11")
    Page<Car> findFeaturedCars(Pageable pageable);

    @Query("SELECT c FROM Car c JOIN FETCH c.brand JOIN FETCH c.fuelType JOIN FETCH c.region JOIN FETCH c.status WHERE c.isDeleted = false AND c.status.id = 11")
    Page<Car> findPopularCars(Pageable pageable);

    @Query("SELECT c FROM Car c JOIN FETCH c.brand JOIN FETCH c.fuelType JOIN FETCH c.region JOIN FETCH c.status WHERE c.isDeleted = false")
    Page<Car> searchCars(Pageable pageable);

    @Query("SELECT c FROM Car c JOIN FETCH c.brand JOIN FETCH c.fuelType JOIN FETCH c.region JOIN FETCH c.status WHERE c.isDeleted = false")
    List<Car> findAllWithRelations();

    @Query("SELECT c FROM Car c JOIN FETCH c.brand JOIN FETCH c.fuelType JOIN FETCH c.region JOIN FETCH c.status WHERE c.supplier.id = :supplierId AND c.isDeleted = false")
    List<Car> findBySupplierIdAndIsDeletedFalse(Integer supplierId);

    @Query("SELECT c FROM Car c JOIN FETCH c.brand JOIN FETCH c.fuelType JOIN FETCH c.region JOIN FETCH c.status WHERE c.brand.id = :brandId AND c.isDeleted = false")
    List<Car> findByBrand_IdAndIsDeletedFalse(Integer brandId);

    @Query("SELECT c FROM Car c JOIN FETCH c.brand JOIN FETCH c.fuelType JOIN FETCH c.region JOIN FETCH c.status WHERE c.fuelType.id = :fuelTypeId AND c.isDeleted = false")
    List<Car> findByFuelTypeIdAndIsDeletedFalse(Integer fuelTypeId);

    @Query("SELECT c FROM Car c JOIN FETCH c.brand JOIN FETCH c.fuelType JOIN FETCH c.region JOIN FETCH c.status WHERE c.status.id = :statusId AND c.isDeleted = false")
    List<Car> findByStatusIdAndIsDeletedFalse(Integer statusId);

    @Query(value = "EXEC sp_GetAvailableCars :startDate, :endDate", nativeQuery = true)
    List<Car> findAvailableCars(Instant startDate, Instant endDate);

    @Query("SELECT c FROM Car c JOIN FETCH c.brand JOIN FETCH c.fuelType JOIN FETCH c.region JOIN FETCH c.status WHERE c.id = :id AND c.isDeleted = false")
    Optional<Car> findByIdWithRelations(Integer id);

    @Query("SELECT c FROM Car c JOIN FETCH c.brand JOIN FETCH c.fuelType JOIN FETCH c.region JOIN FETCH c.status WHERE c.isDeleted = false")
    Page<Car> findAllWithRelations(Pageable pageable);

    @Query("SELECT c FROM Car c JOIN FETCH c.brand JOIN FETCH c.fuelType JOIN FETCH c.region JOIN FETCH c.status WHERE c.region.id = :regionId AND c.isDeleted = false")
    List<Car> findByRegionIdAndIsDeletedFalse(Integer regionId);
}