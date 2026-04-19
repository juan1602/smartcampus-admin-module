package com.uis.smartcampus.admin_module.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "alert_rules")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AlertRule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String property;   // ej: temperature, battery_level
    private String operator;   // GREATER_THAN | LESS_THAN
    private Double threshold;
    private String label;

    @Builder.Default
    private boolean active = true;
}
