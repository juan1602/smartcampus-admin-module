package com.uis.smartcampus.admin_module.model;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name="digital_twins")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DigitalTwin {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;

    // relacion 1-1 con device
    @OneToOne
    @JoinColumn(name = "device_id",nullable=false,unique = true)
    @JsonIgnore
    private Device device;

    //Estado dinámico
    private String status;//online,offline,error

    private LocalDateTime lastUpdate;

    // Telemetría flexible
    @Column(columnDefinition = "TEXT")
    private String telemetryJson;

    // Ejemplos de métricas
    private Double temperature;
    private Double batteryLevel;

}
