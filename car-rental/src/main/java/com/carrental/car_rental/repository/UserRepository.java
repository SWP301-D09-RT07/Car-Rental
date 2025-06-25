package com.carrental.car_rental.repository;

import com.carrental.car_rental.entity.CountryCode;
import com.carrental.car_rental.entity.User;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Integer> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT u FROM User u WHERE u.email = :email AND u.isDeleted = false")
    Optional<User> findByEmailAndIsDeletedFalse(@Param("email") String email);
    Optional<User> findByUsernameOrEmail(String username, String email);
    List<User> findByRoleIdAndIsDeletedFalse(Integer roleId);
    List<User> findAllByIsDeletedFalse();
    List<User> findByCountryCodeAndIsDeletedFalse(CountryCode countryCode);    Optional<User> findByUsername(String username);
    Optional<User> findByUsernameAndIsDeletedFalse(String username);
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);
    Optional<User> findByEmail(String email);
}