package com.carrental.car_rental.service;

import com.carrental.car_rental.dto.FavoriteDTO;
import com.carrental.car_rental.entity.Favorite;
import com.carrental.car_rental.entity.User;
import com.carrental.car_rental.mapper.FavoriteMapper;
import com.carrental.car_rental.repository.FavoriteRepository;
import com.carrental.car_rental.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class FavoriteService {
    private final FavoriteRepository favoriteRepository;
    private final FavoriteMapper favoriteMapper;
    private final UserRepository userRepository;

    public FavoriteService(FavoriteRepository favoriteRepository, FavoriteMapper favoriteMapper, UserRepository userRepository) {
        this.favoriteRepository = favoriteRepository;
        this.favoriteMapper = favoriteMapper;
        this.userRepository = userRepository;
    }

    public List<FavoriteDTO> findByCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User user = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        return favoriteRepository.findByUserIdAndIsDeletedFalse(user.getId())
                .stream()
                .map(favoriteMapper::toDTO)
                .collect(Collectors.toList());
    }

    public FavoriteDTO save(FavoriteDTO dto) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User user = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        Favorite favorite = favoriteMapper.toEntity(dto);
        favorite.setUser(user);
        return favoriteMapper.toDTO(favoriteRepository.save(favorite));
    }

    public void delete(Integer id) {
        Favorite favorite = favoriteRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Favorite not found"));
        favorite.setIsDeleted(true);
        favoriteRepository.save(favorite);
    }
}
