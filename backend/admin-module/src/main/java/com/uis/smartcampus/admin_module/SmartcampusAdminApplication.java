package com.uis.smartcampus.admin_module;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@EnableScheduling
@SpringBootApplication
public class SmartcampusAdminApplication {

	public static void main(String[] args) {
		SpringApplication.run(SmartcampusAdminApplication.class, args);
	}

}