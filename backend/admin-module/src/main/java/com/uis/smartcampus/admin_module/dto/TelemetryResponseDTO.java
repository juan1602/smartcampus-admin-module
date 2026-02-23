package com.uis.smartcampus.admin_module.dto;

import java.time.LocalDateTime;
import java.util.Map;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TelemetryResponseDTO {
    private Long deviceId;
    private String deviceCode;
    private String deviceName;
    private String status;
    private Map<String, Object> telemetry;
    private LocalDateTime lastUpdate;
}
