package com.uis.smartcampus.admin_module.controller;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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
    public ResponseEntity<?> updateTelemetry(
            @PathVariable Long deviceId,
            @RequestBody Map<String, Object> payload) throws Exception {

        Device device = deviceService.findById(deviceId);
        DigitalTwin twin = twinRepository.findByDeviceId(deviceId)
                .orElseThrow(() -> new RuntimeException("DigitalTwin not found for device " + deviceId));

        // Validar que el dispositivo tiene componentes definidos
        if (device.getComponents() == null || device.getComponents().isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "El dispositivo no tiene componentes definidos"));
        }

        // Procesar y validar componentes
        Map<String, Object> filteredTelemetry = new HashMap<>();
        Map<String, String> errors = new HashMap<>();
        
        for (Component component : device.getComponents()) {
            String componentName = component.getName();
            
            if (!payload.containsKey(componentName)) {
                errors.put(componentName, "Campo requerido no encontrado");
                continue;
            }

            Object value = payload.get(componentName);
            
            // Validar tipo de dato
            if (!isValidDataType(value, component.getDataType())) {
                errors.put(componentName, 
                        "Tipo de dato inválido. Esperado: " + component.getDataType());
                continue;
            }

            // Validar rango si es numérico
            if ("FLOAT".equals(component.getDataType()) || "INTEGER".equals(component.getDataType())) {
                Double numValue = Double.parseDouble(value.toString());
                
                if (component.getMinValue() != null && numValue < component.getMinValue()) {
                    errors.put(componentName, 
                            "Valor por debajo del mínimo: " + component.getMinValue());
                    continue;
                }
                
                if (component.getMaxValue() != null && numValue > component.getMaxValue()) {
                    errors.put(componentName, 
                            "Valor por encima del máximo: " + component.getMaxValue());
                    continue;
                }
            }

            filteredTelemetry.put(componentName, value);
        }

        // Si hay errores de validación, rechazar
        if (!errors.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Validación fallida", "detalles", errors));
        }

        // Verificar si hay campos no permitidos
        for (String key : payload.keySet()) {
            if (!filteredTelemetry.containsKey(key)) {
                // Campo no reconocido - simplemente ignorarlo pero registrar
                System.out.println("Campo ignorado para dispositivo " + deviceId + ": " + key);
            }
        }

        // Guardar telemetría procesada
        twin.setTelemetryJson(mapper.writeValueAsString(filteredTelemetry));
        twin.setLastUpdate(LocalDateTime.now());
        twin.setStatus("ONLINE");

        DigitalTwin saved = twinRepository.save(twin);

        // Enviar evento en tiempo real
        messagingTemplate.convertAndSend("/topic/devices", device);

        // Retornar respuesta estructurada
        return ResponseEntity.ok(TelemetryResponseDTO.builder()
                .deviceId(device.getId())
                .deviceCode(device.getCode())
                .deviceName(device.getName())
                .status(saved.getStatus())
                .telemetry(filteredTelemetry)
                .lastUpdate(saved.getLastUpdate())
                .build());
    }

    /**
     * Valida que el valor sea del tipo de dato especificado
     */
    private boolean isValidDataType(Object value, String dataType) {
        if (value == null) return false;
        
        return switch (dataType != null ? dataType : "") {
            case "FLOAT" -> value instanceof Number;
            case "INTEGER" -> {
                if (value instanceof Integer) yield true;
                if (value instanceof Long) yield true;
                if (value instanceof Number num) {
                    yield num.doubleValue() % 1 == 0;
                }
                yield false;
            }
            case "BOOLEAN" -> value instanceof Boolean;
            case "STRING" -> value instanceof String;
            default -> true;
        };
    }

    /**
     * Obtener última telemetría de un dispositivo
     */
    @GetMapping("/{deviceId}")
    public ResponseEntity<?> getLatestTelemetry(@PathVariable Long deviceId) throws Exception {
        Device device = deviceService.findById(deviceId);
        DigitalTwin twin = twinRepository.findByDeviceId(deviceId)
                .orElseThrow(() -> new RuntimeException("DigitalTwin not found for device " + deviceId));

        Map<String, Object> telemetry = mapper.readValue(
                twin.getTelemetryJson(), 
                Map.class
        );

        return ResponseEntity.ok(TelemetryResponseDTO.builder()
                .deviceId(device.getId())
                .deviceCode(device.getCode())
                .deviceName(device.getName())
                .status(twin.getStatus())
                .telemetry(telemetry)
                .lastUpdate(twin.getLastUpdate())
                .build());
    }
}
