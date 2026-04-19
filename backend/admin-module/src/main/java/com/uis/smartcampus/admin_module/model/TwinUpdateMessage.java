package com.uis.smartcampus.admin_module.model;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class TwinUpdateMessage {
    private String deviceCode;
    private Long   twinId;
    private String telemetryJson;
    private String lastUpdate;
}
