package com.uis.smartcampus.admin_module.controller;

import com.uis.smartcampus.admin_module.model.AppUser;
import com.uis.smartcampus.admin_module.repository.AppUserRepository;
import com.uis.smartcampus.admin_module.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final AppUserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        log.info("POST /auth/login");
        String username = body.get("username");
        String password = body.get("password");

        AppUser user = userRepository.findByUsername(username)
                .orElse(null);

        if (user == null || !passwordEncoder.matches(password, user.getPassword())) {
            log.warn("Login fallido para usuario: {}", username);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Usuario o contraseña incorrectos"));
        }

        String token = jwtUtil.generateToken(user.getUsername(), user.getRole().name());
        log.info("Login exitoso para usuario: {}", username);

        return ResponseEntity.ok(Map.of(
                "token", token,
                "username", user.getUsername(),
                "role", user.getRole().name()
        ));
    }
}