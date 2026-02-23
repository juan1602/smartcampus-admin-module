package com.uis.smartcampus.admin_module.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "components")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Component {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "device_id", nullable = false)
    private Device device;

    // Información del componente
    @Column(nullable = false)
    private String name; // ejemplo: temperature, humidity, pressure

    @Column(nullable = false)
    private String type; // SENSOR, ACTUATOR

    private String dataType; // FLOAT, INTEGER, BOOLEAN, STRING

    private String unit; // °C, %, hPa, etc

    private Double minValue;
    private Double maxValue;

    private String description;

    @Column(columnDefinition = "TEXT")
    private String metadata; // JSON adicional si es necesario
}
