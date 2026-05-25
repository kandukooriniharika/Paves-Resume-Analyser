package com.paves.resume_analyser;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

// Scan the full base package so new screening sub-packages are included automatically
@SpringBootApplication
@EnableJpaRepositories(basePackages = "com.paves.resume_analyser")
@EntityScan(basePackages = "com.paves.resume_analyser")
public class ResumeAnalyserApplication {

	public static void main(String[] args) {
		SpringApplication.run(ResumeAnalyserApplication.class, args);
	}

}

