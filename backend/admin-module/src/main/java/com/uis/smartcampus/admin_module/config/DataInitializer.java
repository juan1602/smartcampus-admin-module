package com.uis.smartcampus.admin_module.config;

import com.uis.smartcampus.admin_module.model.AppUser;
import com.uis.smartcampus.admin_module.model.Role;
import com.uis.smartcampus.admin_module.repository.AppUserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final AppUserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        createUserIfNotExists("admin",  "admin123",  Role.ADMIN);
        createUserIfNotExists("viewer", "viewer123", Role.VIEWER);
    }

    private void createUserIfNotExists(String username, String rawPassword, Role role) {
        if (!userRepository.existsByUsername(username)) {
            userRepository.save(AppUser.builder()
                    .username(username)
                    .password(passwordEncoder.encode(rawPassword))
                    .role(role)
                    .build());
            System.out.println("✅ Usuario creado: " + username + " [" + role + "]");
        }
    }
}
