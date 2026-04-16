package com.paves.resume_analyser.controller;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody(required = false) RegisterPayload payload) {
        if (payload == null || !StringUtils.hasText(payload.email()) || !StringUtils.hasText(payload.password())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email and password are required");
        }

        String normalizedEmail = payload.email().trim().toLowerCase();
        String displayName = StringUtils.hasText(payload.fullName()) ? payload.fullName().trim() : normalizedEmail;

        return ResponseEntity.status(HttpStatus.CREATED).body(new AuthResponse(
                normalizedEmail,
                displayName,
                "STUDENT",
                issueToken(normalizedEmail),
                "Registration successful"));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody(required = false) LoginPayload payload) {
        if (payload == null || !StringUtils.hasText(payload.email()) || !StringUtils.hasText(payload.password())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email and password are required");
        }

        String normalizedEmail = payload.email().trim().toLowerCase();
        String displayName = normalizedEmail.contains("@")
                ? normalizedEmail.substring(0, normalizedEmail.indexOf('@'))
                : normalizedEmail;

        return ResponseEntity.ok(new AuthResponse(
                normalizedEmail,
                displayName,
                "STUDENT",
                issueToken(normalizedEmail),
                "Login successful"));
    }

    @GetMapping("/me")
    public AuthProfile me() {
        return new AuthProfile(
                "guest@paves.com",
                "Guest User",
                "STUDENT",
                List.of("resume-upload", "job-role-explorer", "analytics-dashboard"));
    }

    private String issueToken(String email) {
        String payload = email + ":" + Instant.now();
        return Base64.getUrlEncoder()
                .withoutPadding()
                .encodeToString(payload.getBytes(StandardCharsets.UTF_8));
    }

    public record RegisterPayload(String fullName, String email, String password) {
    }

    public record LoginPayload(String email, String password) {
    }

    public record AuthResponse(String email, String fullName, String role, String token, String message) {
    }

    public record AuthProfile(String email, String fullName, String role, List<String> features) {
    }
}
