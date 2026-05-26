package com.paves.resume_analyser.enums;

import com.fasterxml.jackson.annotation.JsonCreator;

import java.util.Arrays;

public enum UserRole {
    HEAD,
    ACQUISITION,
    ADMIN,
    HR,
    GENERAL;

    @JsonCreator
    public static UserRole fromValue(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        return Arrays.stream(values())
                .filter(role -> role.name().equalsIgnoreCase(value))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException(
                        "Invalid role '" + value + "'. Allowed values: HEAD, ACQUISITION, ADMIN, HR, GENERAL"
                ));
    }

    public boolean requiresBranch() {
        return this == ACQUISITION || this == HR;
    }
}
