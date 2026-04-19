package com.uis.smartcampus.admin_module.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "unknown_device_events")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UnknownDeviceEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String deviceCode;

    @Column(columnDefinition = "TEXT")
    private String telemetryJson;

    private LocalDateTime receivedAt;

    @Builder.Default
    private boolean ignored = false;
}
