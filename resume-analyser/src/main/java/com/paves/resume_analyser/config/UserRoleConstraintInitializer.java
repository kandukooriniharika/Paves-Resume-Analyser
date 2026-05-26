package com.paves.resume_analyser.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;

@Slf4j
@Component
@RequiredArgsConstructor
public class UserRoleConstraintInitializer {

    private final JdbcTemplate jdbcTemplate;
    private final DataSource dataSource;

    @EventListener(ApplicationReadyEvent.class)
    void refreshRoleConstraint() {
        try (Connection connection = dataSource.getConnection()) {
            String productName = connection.getMetaData().getDatabaseProductName();
            if (productName == null || !productName.toLowerCase().contains("postgresql")) {
                return;
            }

            jdbcTemplate.execute("""
                    DO $$
                    BEGIN
                        IF EXISTS (
                            SELECT 1
                            FROM pg_constraint
                            WHERE conname = 'users_role_check'
                        ) THEN
                            ALTER TABLE users DROP CONSTRAINT users_role_check;
                        END IF;

                        ALTER TABLE users
                            ADD CONSTRAINT users_role_check
                            CHECK (role IN ('HEAD', 'ACQUISITION', 'ADMIN', 'HR', 'GENERAL'));
                    EXCEPTION
                        WHEN duplicate_object THEN NULL;
                    END $$;
                    """);
        } catch (Exception ex) {
            log.warn("Could not refresh users_role_check constraint: {}", ex.getMessage());
        }
    }
}
