package com.uis.smartcampus.admin_module.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "telemetry_records")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TelemetryRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Relación muchos registros → un device
    @ManyToOne
    @JoinColumn(name = "device_id", nullable = false)
    private Device device;

    @Column(columnDefinition = "TEXT")
    private String telemetryJson;

    private LocalDateTime timestamp;
}