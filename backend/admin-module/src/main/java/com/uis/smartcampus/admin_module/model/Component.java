package com.uis.smartcampus.admin_module.model;

import java.time.LocalDateTime;
import java.util.Set;

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

    @Column(nullable = false, unique = true)
    private String name; // temperature, humidity, pressure, battery_level, etc.

    private String unit; // °C, %, hPa, %, etc.

    private String description;

    @ManyToMany(mappedBy = "components")
    private Set<Device> devices;

    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        createdAt = LocalDateTime.now();
    }
}
