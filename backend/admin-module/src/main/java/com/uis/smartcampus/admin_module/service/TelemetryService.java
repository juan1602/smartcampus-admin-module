package com.uis.smartcampus.admin_module.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.uis.smartcampus.admin_module.model.Device;
import com.uis.smartcampus.admin_module.model.DigitalTwin;
import com.uis.smartcampus.admin_module.model.TelemetryRecord;
import com.uis.smartcampus.admin_module.model.TwinUpdateMessage;
import com.uis.smartcampus.admin_module.model.UnknownDeviceEvent;
import com.uis.smartcampus.admin_module.repository.DeviceRepository;
import com.uis.smartcampus.admin_module.repository.DigitalTwinRepository;
import com.uis.smartcampus.admin_module.repository.TelemetryRecordRepository;
import com.uis.smartcampus.admin_module.repository.UnknownDeviceEventRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TelemetryService {

    private final DeviceRepository deviceRepository;
    private final DigitalTwinRepository twinRepository;
    private final TelemetryRecordRepository telemetryRecordRepository;
    private final UnknownDeviceEventRepository unknownDeviceEventRepository;
    private final MqttPublisherService mqttPublisherService;
    private final AlertService alertService;
    private final SimpMessagingTemplate wsTemplate;

    private final ObjectMapper mapper = new ObjectMapper();

    @Transactional
    public void processTelemetry(String deviceCode, Map<String, Object> data) {

    try {

        // Si el dispositivo no está registrado, guardar evento y notificar
        if (!deviceRepository.findByCode(deviceCode).isPresent()) {
            if (!unknownDeviceEventRepository.existsByDeviceCodeAndIgnoredFalse(deviceCode)) {
                String rawJson = mapper.writeValueAsString(data);
                UnknownDeviceEvent event = UnknownDeviceEvent.builder()
                        .deviceCode(deviceCode)
                        .telemetryJson(rawJson)
                        .receivedAt(java.time.LocalDateTime.now())
                        .build();
                unknownDeviceEventRepository.save(event);
                wsTemplate.convertAndSend("/topic/unknown-devices",
                        Map.of("deviceCode", deviceCode, "telemetryJson", rawJson));
                System.out.println("⚠️ Dispositivo desconocido detectado: " + deviceCode);
            }
            return;
        }

        Device device = deviceRepository.findByCode(deviceCode)
                .orElseThrow(() -> new RuntimeException("Device not found"));

        device.setLastSeen(LocalDateTime.now());
        device.setUpdatedAt(LocalDateTime.now());

        // No cambiar estado si está en mantenimiento
        if (!"MAINTENANCE".equalsIgnoreCase(device.getStatus())) {
            device.setStatus("ONLINE");
        }
        deviceRepository.save(device);

        // 🔹 obtener propiedades válidas del dispositivo
        Set<String> validProperties = device.getProperties()
                .stream()
                .map(p -> p.getName().toLowerCase())
                .collect(Collectors.toSet());

        // 🔹 filtrar datos entrantes
        Map<String, Object> filteredData = new HashMap<>();

        for (Map.Entry<String, Object> entry : data.entrySet()) {

            String key = entry.getKey().toLowerCase();

            if (validProperties.contains(key)) {

                filteredData.put(key, entry.getValue());

            } else {

                System.out.println("⚠️ Propiedad ignorada: " + key);

            }
        }

        // si no hay datos válidos no hacer nada
        if (filteredData.isEmpty()) {

            System.out.println("No valid telemetry data received");
            return;

        }

        // 🔔 Verificar umbrales y enviar alertas si corresponde
        alertService.checkAndAlert(deviceCode, filteredData);

        if (!"MAINTENANCE".equalsIgnoreCase(device.getStatus())) {
            Object batteryObject = filteredData.get("battery_level");
            if (batteryObject != null) {
                double batteryLevel = Double.parseDouble(batteryObject.toString());
                if (batteryLevel == 0) {
                    device.setStatus("OFFLINE");
                } else if (batteryLevel < 5) {
                    device.setStatus("WARNING");
                    System.out.println("⚠️ WARNING: Battery level critically low for device " + deviceCode);
                } else if (batteryLevel < 20) {
                    device.setStatus("LOW_BATTERY");
                } else {
                    device.setStatus("ONLINE");
                }
            } else {
                device.setStatus("ONLINE");
            }
        }

        // Guardar historial
        String json = mapper.writeValueAsString(filteredData);
        TelemetryRecord record = new TelemetryRecord();
        record.setDevice(device);
        record.setTelemetryJson(json);
        record.setTimestamp(LocalDateTime.now());
        telemetryRecordRepository.save(record);

        System.out.println("✅ Telemetry saved for device: " + deviceCode);

        // Publicar ACK — el Digital Twin se actualiza al recibir la confirmación
        mqttPublisherService.publishAck(deviceCode, filteredData);

    } catch (Exception e) {
        e.printStackTrace();
        throw new RuntimeException("Failed to process telemetry for device: " + deviceCode);
    }
}

    /**
     * Actualiza el Digital Twin con los datos confirmados por Node-RED.
     * Solo se llama al recibir el mensaje en smartcampus/confirm.
     */
    @Transactional
    public void applyConfirmedTelemetry(String deviceCode, Map<String, Object> confirmedData) {
        try {
            Device device = deviceRepository.findByCode(deviceCode)
                    .orElseThrow(() -> new RuntimeException("Device not found: " + deviceCode));

            Set<String> validProperties = device.getProperties()
                    .stream()
                    .map(p -> p.getName().toLowerCase())
                    .collect(Collectors.toSet());

            DigitalTwin twin = device.getTwin();
            Map<String, Object> existing = new HashMap<>();

            if (twin.getTelemetryJson() != null && !twin.getTelemetryJson().isEmpty()) {
                existing = mapper.readValue(
                        twin.getTelemetryJson(),
                        new TypeReference<Map<String, Object>>() {}
                );
            }

            existing.putAll(confirmedData);
            existing.keySet().removeIf(key -> !validProperties.contains(key));

            String mergedJson = mapper.writeValueAsString(existing);
            twin.setTelemetryJson(mergedJson);
            twin.setLastUpdate(LocalDateTime.now());
            twinRepository.save(twin);

            System.out.println("✅ Digital Twin actualizado tras confirmación: " + deviceCode);
            System.out.println("Twin data: " + mergedJson);

            // 📡 Notificar al frontend en tiempo real via WebSocket
            wsTemplate.convertAndSend("/topic/twins", new TwinUpdateMessage(
                deviceCode,
                twin.getId(),
                mergedJson,
                twin.getLastUpdate().toString()
            ));

        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("Failed to apply confirmed telemetry for device: " + deviceCode);
        }
    }

    public List<TelemetryRecord> getTelemetryHistory(Long deviceId) {
        return telemetryRecordRepository.findByDeviceIdOrderByTimestampDesc(deviceId);
    }
}