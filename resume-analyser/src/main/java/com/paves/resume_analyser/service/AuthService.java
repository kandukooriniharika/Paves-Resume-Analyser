package com.paves.resume_analyser.service;

import com.paves.resume_analyser.dto.*;
import com.paves.resume_analyser.enums.UserRole;
import com.paves.resume_analyser.model.*;
import com.paves.resume_analyser.repository.*;
import com.paves.resume_analyser.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final BranchRepository branchRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public String register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("User already exists with this email");
        }

        Branch branch = null;
        if (request.getRole() == UserRole.ACQUISITION) {
            if (request.getBranchId() == null) {
                throw new RuntimeException("Branch ID is required for ACQUISITION role");
            }
            branch = branchRepository.findById(request.getBranchId())
                    .orElseThrow(() -> new RuntimeException("Branch not found"));
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

    public String login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid credentials"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid credentials");
        }

        org.springframework.security.core.userdetails.UserDetails userDetails =
                org.springframework.security.core.userdetails.User.builder()
                        .username(user.getEmail())
                        .password(user.getPassword())
                        .roles(user.getRoleName())
                        .build();

        return jwtUtil.generateToken(
                userDetails,
                user.getId(),
                user.getRoleName(),
                user.getBranch() != null ? user.getBranch().getId() : null
        );
    }
}
