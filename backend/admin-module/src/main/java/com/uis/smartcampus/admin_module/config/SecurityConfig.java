package com.uis.smartcampus.admin_module.config;

import com.uis.smartcampus.admin_module.security.JwtFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtFilter jwtFilter;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth

                // Preflight CORS — siempre permitido
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                // Login y WebSocket — públicos
                .requestMatchers("/auth/**").permitAll()
                .requestMatchers("/ws/**").permitAll()

                // Lectura — ADMIN y VIEWER
                .requestMatchers(HttpMethod.GET, "/devices/**").hasAnyRole("ADMIN", "VIEWER")
                .requestMatchers(HttpMethod.GET, "/properties/**").hasAnyRole("ADMIN", "VIEWER")
                .requestMatchers(HttpMethod.GET, "/telemetry/**").hasAnyRole("ADMIN", "VIEWER")
                .requestMatchers(HttpMethod.GET, "/twins/**").hasAnyRole("ADMIN", "VIEWER")

                // Reglas de alerta — solo ADMIN
                .requestMatchers("/alert-rules/**").hasRole("ADMIN")

                // Escritura — solo ADMIN
                .requestMatchers(HttpMethod.POST,   "/devices/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT,    "/devices/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/devices/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.POST,   "/properties/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT,    "/properties/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/properties/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.POST,   "/twins/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT,    "/twins/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/twins/**").hasRole("ADMIN")

                .anyRequest().authenticated()
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

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOriginPatterns(List.of("http://localhost:*", "https://*.vercel.app"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
