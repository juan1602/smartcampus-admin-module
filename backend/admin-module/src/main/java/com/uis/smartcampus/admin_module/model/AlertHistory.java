package com.uis.smartcampus.admin_module.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "alert_history")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AlertHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String deviceCode;
    private String property;
    private Double value;
    private Double threshold;
    private String operator;
    private String label;

    private LocalDateTime triggeredAt;
}
