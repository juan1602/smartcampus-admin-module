package com.uis.smartcampus.admin_module.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "alert_rules")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AlertRule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Propiedad que se evalúa (ej: "temperature", "battery_level")
    @Column(nullable = false)
    private String property;

    // Operador: "GREATER_THAN" o "LESS_THAN"
    @Column(nullable = false)
    private String operator;

    // Valor umbral (ej: 80.0, 10.0)
    @Column(nullable = false)
    private Double threshold;

    // Descripción legible (ej: "Temperatura crítica")
    private String label;

    // Si está activa o no
    @Column(nullable = false)
    private boolean active = true;
}
