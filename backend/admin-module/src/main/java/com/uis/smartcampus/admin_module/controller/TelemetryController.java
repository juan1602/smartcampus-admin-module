package com.uis.smartcampus.admin_module.controller;

import java.time.LocalDateTime;
import java.util.Map;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.uis.smartcampus.admin_module.model.DigitalTwin;
import com.uis.smartcampus.admin_module.repository.DigitalTwinRepository;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/telemetry")
@RequiredArgsConstructor
@CrossOrigin
public class TelemetryController {

    private final DigitalTwinRepository twinRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final ObjectMapper mapper; // ✅ inyectado por Spring

    @PostMapping("/{deviceId}")
    public DigitalTwin updateTelemetry(
            @PathVariable Long deviceId,
            @RequestBody Map<String, Object> payload) throws Exception {

        DigitalTwin twin = twinRepository.findByDeviceId(deviceId)
                .orElseThrow();

        // 🔥 guardar telemetría dinámica
        twin.setTelemetryJson(mapper.writeValueAsString(payload));
        twin.setLastUpdate(LocalDateTime.now());

        DigitalTwin saved = twinRepository.save(twin);

        // 🔥 enviar evento en tiempo real
        messagingTemplate.convertAndSend("/topic/devices", saved.getDevice());

        return saved;
    }
}
