package com.carrental.car_rental.service;

import com.carrental.car_rental.dto.CreateUserDTO;
import com.carrental.car_rental.dto.UpdateUserDTO;
import com.carrental.car_rental.dto.UserDTO;
import com.carrental.car_rental.entity.*;
import com.carrental.car_rental.mapper.UserMapper;
import com.carrental.car_rental.mapper.UserDetailMapper;
import com.carrental.car_rental.repository.*;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
@RequiredArgsConstructor
public class UserService {

    private static final Logger log = LoggerFactory.getLogger(UserService.class);
    private final UserRepository userRepository;
    private final UserDetailRepository userDetailRepository;
    private final RoleRepository roleRepository;
    private final StatusRepository statusRepository;
    private final CountryCodeRepository countryCodeRepository;
    private final LanguageRepository languageRepository;
    private final UserMapper userMapper;
    private final UserDetailMapper userDetailMapper;
    private final PasswordEncoder passwordEncoder;

    public UserDTO findById(Integer id) {
        User user = userRepository.findById(id)
                .filter(u -> !u.getIsDeleted())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found with id: " + id));
        UserDTO dto = userMapper.toDto(user);
        userDetailRepository.findByUserIdAndIsDeletedFalse(id)
                .ifPresent(ud -> dto.setUserDetail(userDetailMapper.toDTO(ud)));
        return dto;
    }

    public List<UserDTO> findAll() {
        return userRepository.findAllByIsDeletedFalse().stream()
                .map(user -> {
                    UserDTO dto = userMapper.toDto(user);
                    userDetailRepository.findByUserIdAndIsDeletedFalse(user.getId())
                            .ifPresent(ud -> dto.setUserDetail(userDetailMapper.toDTO(ud)));
                    return dto;
                })
                .collect(Collectors.toList());
    }

    public List<UserDTO> findByRoleId(Integer roleId) {
        return userRepository.findByRoleIdAndIsDeletedFalse(roleId).stream()
                .map(user -> {
                    UserDTO dto = userMapper.toDto(user);
                    userDetailRepository.findByUserIdAndIsDeletedFalse(user.getId())
                            .ifPresent(ud -> dto.setUserDetail(userDetailMapper.toDTO(ud)));
                    return dto;
                })
                .collect(Collectors.toList());
    }

    public List<UserDTO> findByCountryCode(String countryCode) {
        CountryCode code = countryCodeRepository.findById(countryCode)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid country code: " + countryCode));
        return userRepository.findByCountryCodeAndIsDeletedFalse(code).stream()
                .map(user -> {
                    UserDTO dto = userMapper.toDto(user);
                    userDetailRepository.findByUserIdAndIsDeletedFalse(user.getId())
                            .ifPresent(ud -> dto.setUserDetail(userDetailMapper.toDTO(ud)));
                    return dto;
                })
                .collect(Collectors.toList());
    }

    public Optional<UserDTO> findByEmail(String email) {
        return userRepository.findByEmailAndIsDeletedFalse(email)
                .map(user -> {
                    UserDTO dto = userMapper.toDto(user);
                    userDetailRepository.findByUserIdAndIsDeletedFalse(user.getId())
                            .ifPresent(ud -> dto.setUserDetail(userDetailMapper.toDTO(ud)));
                    return dto;
                });
    }

    public UserDTO save(CreateUserDTO dto) {
        userRepository.findByEmailAndIsDeletedFalse(dto.getEmail())
                .ifPresent(u -> {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already exists: " + dto.getEmail());
                });
        validateRelations(dto.getRoleId(), dto.getStatusId(), dto.getCountryCode(), dto.getPreferredLanguage());
        User user = userMapper.toEntity(dto);

        user.setPasswordHash(passwordEncoder.encode(
                dto.getPassword() == null ? UUID.randomUUID().toString() : dto.getPassword()
        ));
        user.setCreatedAt(Instant.now());
        user.setUpdatedAt(Instant.now());
        user.setIsDeleted(false);

        // preferredLanguage
        if (dto.getPreferredLanguage() != null) {
            Language lang = languageRepository.findById(dto.getPreferredLanguage())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid preferredLanguage: " + dto.getPreferredLanguage()));
            user.setPreferredLanguage(lang);
        } else {
            user.setPreferredLanguage(null);
        }

        User savedUser = userRepository.save(user);

        // Tạo hoặc update UserDetail
        UserDetail userDetail = createOrUpdateUserDetail(savedUser, dto);

        // Map sang UserDTO & gắn UserDetailDTO
        UserDTO result = userMapper.toDto(savedUser);
        result.setUserDetail(userDetailMapper.toDTO(userDetail));
        return result;
    }

    private UserDetail createOrUpdateUserDetail(User user, CreateUserDTO dto) {
        Optional<UserDetail> userDetailOptional = userDetailRepository.findById(user.getId());
        UserDetail userDetail;
        if (userDetailOptional.isPresent()) {
            userDetail = userDetailOptional.get();
            log.info("Updating EXISTING UserDetail: id={}, instance={}, hash={}", userDetail.getId(), System.identityHashCode(userDetail), userDetail);
        } else {
            userDetail = new UserDetail();
            userDetail.setId(user.getId());
            userDetail.setUser(user);
            userDetail.setIsDeleted(false);
            userDetail.setAddress("");
            log.info("Creating NEW UserDetail: id={}, instance={}, hash={}", userDetail.getId(), System.identityHashCode(userDetail), userDetail);
        }
        userDetail.setName(dto.getUserDetail() != null && dto.getUserDetail().getFullName() != null
                ? dto.getUserDetail().getFullName() : dto.getUsername());
        userDetail.setAddress(dto.getUserDetail() != null && dto.getUserDetail().getAddress() != null
                ? dto.getUserDetail().getAddress() : "");
        userDetail.setTaxcode(dto.getUserDetail() != null ? dto.getUserDetail().getTaxcode() : null);
        userDetail.setIsDeleted(false);

        log.info("Saving UserDetail: id={}, instance={}, hash={}", userDetail.getId(), System.identityHashCode(userDetail), userDetail);
        return userDetailRepository.save(userDetail);
    }

    public UserDTO update(Integer id, UpdateUserDTO dto) {
        User existingUser = userRepository.findById(id)
                .filter(u -> !u.getIsDeleted())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found with id: " + id));
        userRepository.findByEmailAndIsDeletedFalse(dto.getEmail())
                .filter(u -> !u.getId().equals(id))
                .ifPresent(u -> {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already exists: " + dto.getEmail());
                });
        validateRelations(dto.getRoleId(), dto.getStatusId(), dto.getCountryCode(), dto.getPreferredLanguage());
        User updatedUser = userMapper.toEntity(dto);
        updatedUser.setId(id);
        updatedUser.setPasswordHash(dto.getPassword() != null && !dto.getPassword().isBlank()
                ? passwordEncoder.encode(dto.getPassword())
                : existingUser.getPasswordHash());
        updatedUser.setCreatedAt(existingUser.getCreatedAt());
        updatedUser.setUpdatedAt(Instant.now());
        updatedUser.setLastLogin(existingUser.getLastLogin());
        updatedUser.setIsDeleted(false);
        userRepository.save(updatedUser);

        Optional<UserDetail> userDetailOptional = userDetailRepository.findByUserIdAndIsDeletedFalse(id);
        UserDetail userDetail;
        if (userDetailOptional.isPresent()) {
            userDetail = userDetailOptional.get();
            // KHÔNG set lại id, user
        } else {
            userDetail = new UserDetail();
            userDetail.setId(id);
            userDetail.setUser(updatedUser);
            userDetail.setIsDeleted(false);
        }
        userDetail.setName(dto.getUserDetail() != null && dto.getUserDetail().getFullName() != null
                ? dto.getUserDetail().getFullName() : userDetail.getName());
        userDetail.setAddress(dto.getUserDetail() != null && dto.getUserDetail().getAddress() != null
                ? dto.getUserDetail().getAddress() : "");
        userDetail.setTaxcode(dto.getUserDetail() != null ? dto.getUserDetail().getTaxcode() : userDetail.getTaxcode());
        userDetailRepository.save(userDetail);

        UserDTO result = userMapper.toDto(updatedUser);
        result.setUserDetail(userDetailMapper.toDTO(userDetail));
        return result;
    }

    public void delete(Integer id) {
        User user = userRepository.findById(id)
                .filter(u -> !u.getIsDeleted())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found with id: " + id));
        user.setIsDeleted(true);
        userRepository.save(user);
        userDetailRepository.findByUserIdAndIsDeletedFalse(id)
                .ifPresent(ud -> {
                    ud.setIsDeleted(true);
                    userDetailRepository.save(ud);
                });
    }

    public void changePassword(String email, String currentPassword, String newPassword) {
        User user = userRepository.findByEmailAndIsDeletedFalse(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found with email: " + email));
        if (!passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Current password is incorrect");
        }
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    private void validateRelations(Integer roleId, Integer statusId, String countryCode, String preferredLanguage) {
        roleRepository.findById(roleId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid roleId: " + roleId));
        statusRepository.findById(statusId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid statusId: " + statusId));
        countryCodeRepository.findById(countryCode)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid countryCode: " + countryCode));
        if (preferredLanguage != null) {
            languageRepository.findById(preferredLanguage)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid preferredLanguage: " + preferredLanguage));
        }
    }
}