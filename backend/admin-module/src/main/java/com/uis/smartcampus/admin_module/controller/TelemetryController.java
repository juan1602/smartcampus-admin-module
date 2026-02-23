package com.uis.smartcampus.admin_module.controller;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.uis.smartcampus.admin_module.dto.TelemetryResponseDTO;
import com.uis.smartcampus.admin_module.model.Component;
import com.uis.smartcampus.admin_module.model.Device;
import com.uis.smartcampus.admin_module.model.DigitalTwin;
import com.uis.smartcampus.admin_module.repository.DigitalTwinRepository;
import com.uis.smartcampus.admin_module.service.DeviceService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/telemetry")
@RequiredArgsConstructor
@CrossOrigin
public class TelemetryController {

    private final DigitalTwinRepository twinRepository;
    private final DeviceService deviceService;
    private final SimpMessagingTemplate messagingTemplate;
    private final ObjectMapper mapper;

    @PostMapping("/{deviceId}")
    public TelemetryResponseDTO updateTelemetry(
            @PathVariable Long deviceId,
            @RequestBody Map<String, Object> payload) throws Exception {

        Device device = deviceService.findById(deviceId);
        DigitalTwin twin = twinRepository.findByDeviceId(deviceId)
                .orElseThrow(() -> new RuntimeException("DigitalTwin not found for device " + deviceId));

        // Procesar solo componentes definidos para el dispositivo
        Map<String, Object> filteredTelemetry = new HashMap<>();
        
        if (device.getComponents() != null && !device.getComponents().isEmpty()) {
            for (Component component : device.getComponents()) {
                String componentName = component.getName();
                if (payload.containsKey(componentName)) {
                    filteredTelemetry.put(componentName, payload.get(componentName));
                }
            }
        } else {
            // Si no tiene componentes definidos, aceptar todo
            filteredTelemetry.putAll(payload);
        }

        // Guardar telemetría procesada
        twin.setTelemetryJson(mapper.writeValueAsString(filteredTelemetry));
        twin.setLastUpdate(LocalDateTime.now());
        twin.setStatus("ONLINE");

        DigitalTwin saved = twinRepository.save(twin);

        // Enviar evento en tiempo real
        messagingTemplate.convertAndSend("/topic/devices", device);

        // Retornar respuesta estructurada
        return TelemetryResponseDTO.builder()
                .deviceId(device.getId())
                .deviceCode(device.getCode())
                .deviceName(device.getName())
                .status(saved.getStatus())
                .telemetry(filteredTelemetry)
                .lastUpdate(saved.getLastUpdate())
                .build();
    }

    /**
     * Obtener última telemetría de un dispositivo
     */
    @GetMapping("/{deviceId}")
    public TelemetryResponseDTO getLatestTelemetry(@PathVariable Long deviceId) throws Exception {
        Device device = deviceService.findById(deviceId);
        DigitalTwin twin = twinRepository.findByDeviceId(deviceId)
                .orElseThrow(() -> new RuntimeException("DigitalTwin not found for device " + deviceId));

        Map<String, Object> telemetry = mapper.readValue(
                twin.getTelemetryJson(), 
                Map.class
        );

        return TelemetryResponseDTO.builder()
                .deviceId(device.getId())
                .deviceCode(device.getCode())
                .deviceName(device.getName())
                .status(twin.getStatus())
                .telemetry(telemetry)
                .lastUpdate(twin.getLastUpdate())
                .build();
    }
}
