package com.uis.smartcampus.admin_module.config;

import com.uis.smartcampus.admin_module.model.AlertRule;
import com.uis.smartcampus.admin_module.model.AppUser;
import com.uis.smartcampus.admin_module.model.Role;
import com.uis.smartcampus.admin_module.repository.AlertRuleRepository;
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
    private final AlertRuleRepository alertRuleRepository;

    @Override
    public void run(String... args) {
        createUserIfNotExists("admin",  "admin123",  Role.ADMIN);
        createUserIfNotExists("viewer", "viewer123", Role.VIEWER);
        createDefaultAlertRules();
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

    private void createDefaultAlertRules() {
        if (alertRuleRepository.count() == 0) {
            alertRuleRepository.save(AlertRule.builder()
                    .property("temperature")
                    .operator("GREATER_THAN")
                    .threshold(80.0)
                    .label("Temperatura crítica (>80°C)")
                    .active(true)
                    .build());
            alertRuleRepository.save(AlertRule.builder()
                    .property("battery_level")
                    .operator("LESS_THAN")
                    .threshold(10.0)
                    .label("Batería baja (<10%)")
                    .active(true)
                    .build());
            System.out.println("✅ Reglas de alerta por defecto creadas");
        }
    }
}
