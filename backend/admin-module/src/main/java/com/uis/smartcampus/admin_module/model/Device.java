package com.uis.smartcampus.admin_module.model;

import java.time.LocalDateTime;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "devices")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Device {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(mappedBy = "device", cascade = CascadeType.ALL)
    private DigitalTwin twin;


    // Identificación
    @Column(nullable = false, unique = true)
    private String code;

    private String name;

    private String type; // SENSOR, ACTUATOR, CAMERA

    // Estado
    private String status; // ONLINE, OFFLINE, ERROR

    private String location;

    private LocalDateTime lastSeen;

    // Configuración flexible
    @Column(columnDefinition = "TEXT")
    private String configJson;

    // Auditoría
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {
        createdAt = LocalDateTime.now();
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
}

