package com.uis.smartcampus.admin_module.dto;

import java.util.Map;

import lombok.Data;

@Data
public class TelemetryRequest {

    private String status;
    private Map<String, Object> telemetry;

}

