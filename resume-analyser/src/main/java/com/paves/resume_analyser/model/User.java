package com.paves.resume_analyser.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.paves.resume_analyser.enums.UserRole;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(exclude = "branch")
@ToString(exclude = "branch")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String fullName;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserRole role;

    // Only populated for ACQUISITION users
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "branch_id")
    // FIX: reference name must match Branch.users @JsonManagedReference name
    @JsonBackReference("branch-user")
    private Branch branch;

    @Builder.Default
    @Column(nullable = false)
    private boolean isActive = true;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime lastLoginAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public String getRoleName() {
        return role != null ? role.name() : null;
    }

}
