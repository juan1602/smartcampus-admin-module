package com.uis.smartcampus.admin_module.controller;

import com.uis.smartcampus.admin_module.model.AppUser;
import com.uis.smartcampus.admin_module.model.Role;
import com.uis.smartcampus.admin_module.model.UserResponse;
import com.uis.smartcampus.admin_module.repository.AppUserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final AppUserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @GetMapping
    public List<UserResponse> getAll() {
        return userRepository.findAll().stream()
                .map(u -> new UserResponse(u.getId(), u.getUsername(), u.getRole().name()))
                .toList();
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Map<String, String> body) {
        String username = body.get("username");
        String password = body.get("password");
        String role     = body.get("role");

        if (username == null || username.isBlank() || password == null || password.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Usuario y contraseña son requeridos"));
        }
        if (userRepository.existsByUsername(username)) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", "El usuario ya existe"));
        }

        AppUser user = AppUser.builder()
                .username(username)
                .password(passwordEncoder.encode(password))
                .role(Role.valueOf(role != null ? role : "VIEWER"))
                .build();

        AppUser saved = userRepository.save(user);
        return ResponseEntity.ok(new UserResponse(saved.getId(), saved.getUsername(), saved.getRole().name()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Map<String, String> body) {
        return userRepository.findById(id).map(user -> {
            if (body.containsKey("username") && !body.get("username").isBlank()) {
                String newUsername = body.get("username");
                if (!newUsername.equals(user.getUsername()) && userRepository.existsByUsername(newUsername)) {
                    return ResponseEntity.status(HttpStatus.CONFLICT)
                            .body(Map.of("error", "El nombre de usuario ya está en uso"));
                }
                user.setUsername(newUsername);
            }
            if (body.containsKey("password") && !body.get("password").isBlank()) {
                user.setPassword(passwordEncoder.encode(body.get("password")));
            }
            if (body.containsKey("role") && !body.get("role").isBlank()) {
                user.setRole(Role.valueOf(body.get("role")));
            }
            AppUser saved = userRepository.save(user);
            return ResponseEntity.ok((Object) new UserResponse(saved.getId(), saved.getUsername(), saved.getRole().name()));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        // Evitar que el admin se elimine a sí mismo
        String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findById(id).map(user -> {
            if (user.getUsername().equals(currentUser)) {
                return ResponseEntity.badRequest().body(Map.of("error", "No puedes eliminar tu propio usuario"));
            }
            userRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }).orElse(ResponseEntity.notFound().build());
    }
}
