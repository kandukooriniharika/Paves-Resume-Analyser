package com.paves.resume_analyser.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import com.paves.resume_analyser.security.JwtFilter;

import lombok.RequiredArgsConstructor;

@Configuration
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtFilter jwtFilter;

    private static final String[] PUBLIC_URLS = {
        "/api/auth/**",
        "/swagger-ui/**",
        "/swagger-ui.html",
        "/v3/api-docs",
        "/v3/api-docs/**",
        "/v3/api-docs.yaml",
        "/webjars/**",
        "/api/screening/files/**",
        // Public career page application endpoint (secured by API key in gateway/nginx)
        "/api/v1/public/applications",
        // LinkedIn webhook — verified by HMAC signature inside the controller
        "/webhooks/linkedin/**",
        // Actuator health check
        "/actuator/health"
    };

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .cors(Customizer.withDefaults())
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(PUBLIC_URLS).permitAll()

                // JD management — HR_ADMIN only for write operations
                .requestMatchers(HttpMethod.POST,  "/api/jd/**").hasAuthority("HR_ADMIN")
                .requestMatchers(HttpMethod.PATCH, "/api/jd/**").hasAuthority("HR_ADMIN")
                .requestMatchers(HttpMethod.GET,   "/api/jd/**").hasAnyAuthority("HR_ADMIN", "RECRUITER", "HIRING_MANAGER")

                // Workflow stage transitions — RECRUITER and HR_ADMIN drive pipeline; HM can move HM_REVIEW stage
                .requestMatchers("/api/workflow/**").hasAnyAuthority("HR_ADMIN", "RECRUITER", "HIRING_MANAGER")

                // Talent pool — RECRUITER and HR_ADMIN
                .requestMatchers("/api/talent-pool/**").hasAnyAuthority("HR_ADMIN", "RECRUITER")

                // Naukri import — RECRUITER and HR_ADMIN
                .requestMatchers("/api/intake/**").hasAnyAuthority("HR_ADMIN", "RECRUITER")

                // Campaigns — HR_ADMIN creates; all roles can read
                .requestMatchers(HttpMethod.POST,   "/api/campaigns").hasAuthority("HR_ADMIN")
                .requestMatchers(HttpMethod.PUT,    "/api/campaigns/**").hasAuthority("HR_ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/campaigns/**").hasAuthority("HR_ADMIN")

                // HR override — HR_ADMIN only
                .requestMatchers(HttpMethod.POST, "/api/results/*/override").hasAuthority("HR_ADMIN")

                // Everything else requires authentication
                .anyRequest().authenticated()
            )
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}
