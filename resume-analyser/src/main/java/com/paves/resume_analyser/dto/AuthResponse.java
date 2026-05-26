package com.paves.resume_analyser.dto;

import com.paves.resume_analyser.model.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {

    private String token;
    private AuthUser user;

    public static AuthResponse of(String token, User user) {
        Long branchId = user.getBranch() != null ? user.getBranch().getId() : null;

        return AuthResponse.builder()
                .token(token)
                .user(AuthUser.builder()
                        .id(user.getId())
                        .fullName(user.getFullName())
                        .email(user.getEmail())
                        .role(user.getRoleName())
                        .branchId(branchId)
                        .active(user.isActive())
                        .build())
                .build();
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AuthUser {
        private Long id;
        private String fullName;
        private String email;
        private String role;
        private Long branchId;
        private boolean active;
    }
}
