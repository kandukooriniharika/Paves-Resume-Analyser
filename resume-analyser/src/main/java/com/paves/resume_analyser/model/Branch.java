package com.paves.resume_analyser.model;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.*;

import java.util.List;

@Entity
@Table(name = "branches")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
// FIX: @EqualsAndHashCode needed when @Data + @OneToMany to prevent StackOverflow
@EqualsAndHashCode(exclude = {"jobRole", "resume", "users"})
@ToString(exclude = {"jobRole", "resume", "users"})
public class Branch {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(nullable = false, unique = true, length = 10)
    private String code;

    private String location;
    private String country;
    private String timezone;

    @Builder.Default
    @Column(nullable = false)
    private boolean isActive = true;

    // FIX: each @JsonManagedReference must have a UNIQUE name
    @OneToMany(mappedBy = "branch", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonManagedReference("branch-jobrole")
    private List<JobRole> jobRole;

    @OneToMany(mappedBy = "branch", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonManagedReference("branch-resume")
    private List<Resume> resume;

    @OneToMany(mappedBy = "branch", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonManagedReference("branch-user")
    private List<User> users;
}
