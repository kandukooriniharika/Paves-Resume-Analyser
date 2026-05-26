package com.paves.resume_analyser.service;

import com.paves.resume_analyser.dto.AuthResponse;
import com.paves.resume_analyser.dto.LoginRequest;
import com.paves.resume_analyser.dto.RegisterRequest;
import com.paves.resume_analyser.enums.UserRole;
import com.paves.resume_analyser.model.Branch;
import com.paves.resume_analyser.model.User;
import com.paves.resume_analyser.repository.BranchRepository;
import com.paves.resume_analyser.repository.UserRepository;
import com.paves.resume_analyser.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final BranchRepository branchRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public String register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "User already exists with this email");
        }

        Branch branch = null;
        if (request.getRole().requiresBranch()) {
            if (request.getBranchId() == null) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Branch ID is required for ACQUISITION or HR role"
                );
            }
            branch = branchRepository.findById(request.getBranchId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Branch not found"));
        }

        User user = User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(request.getRole())
                .branch(branch)
                .isActive(true)
                .build();

        userRepository.save(user);
        return "User registered successfully";
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }

        UserDetails userDetails = org.springframework.security.core.userdetails.User.builder()
                .username(user.getEmail())
                .password(user.getPassword())
                .roles(user.getRoleName())
                .build();

        String token = jwtUtil.generateToken(
                userDetails,
                user.getId(),
                user.getRoleName(),
                user.getBranch() != null ? user.getBranch().getId() : null
        );

        return AuthResponse.of(token, user);
    }
}
