package com.paves.resume_analyser.config;

import org.springframework.context.annotation.*;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
public class GeminiConfig {

    @Bean
    public WebClient webClient() {
        return WebClient.builder().build();
    }
}