package com.uis.smartcampus.admin_module.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.uis.smartcampus.admin_module.model.Device;
import com.uis.smartcampus.admin_module.model.DigitalTwin;
import com.uis.smartcampus.admin_module.model.TelemetryRecord;
import com.uis.smartcampus.admin_module.repository.DeviceRepository;
import com.uis.smartcampus.admin_module.repository.DigitalTwinRepository;
import com.uis.smartcampus.admin_module.repository.TelemetryRecordRepository;

import lombok.RequiredArgsConstructor;

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

    private final ObjectMapper mapper = new ObjectMapper();

    @Transactional
    public void processTelemetry(String deviceCode, Map<String, Object> data) {

    try {

        Device device = deviceRepository.findByCode(deviceCode)
                .orElseThrow(() -> new RuntimeException("Device not found"));

        device.setLastSeen(LocalDateTime.now());
        device.setUpdatedAt(LocalDateTime.now());

        device.setStatus("ONLINE");
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

        ObjectMapper mapper = new ObjectMapper();

        // 🔹 guardar historial
        String json = mapper.writeValueAsString(filteredData);

        TelemetryRecord record = new TelemetryRecord();
        record.setDevice(device);
        record.setTelemetryJson(json);
        record.setTimestamp(LocalDateTime.now());

        telemetryRecordRepository.save(record);

        // 🔹 actualizar digital twin
        DigitalTwin twin = device.getTwin();

        Map<String, Object> existingTelemetry = new HashMap<>();

        if (twin.getTelemetryJson() != null && !twin.getTelemetryJson().isEmpty()) {

            existingTelemetry = mapper.readValue(
                    twin.getTelemetryJson(),
                    new TypeReference<Map<String, Object>>() {}
            );

        }

        // 🔹 fusionar SOLO propiedades válidas
        existingTelemetry.putAll(filteredData);

        // 🔹 limpiar propiedades inválidas que pudieran existir
        existingTelemetry.keySet().removeIf(key -> !validProperties.contains(key));

        String mergedJson = mapper.writeValueAsString(existingTelemetry);

        twin.setTelemetryJson(mergedJson);
        twin.setLastUpdate(LocalDateTime.now());

        twinRepository.save(twin);

        System.out.println("✅ Telemetry processed for device: " + deviceCode);
        System.out.println("Twin data: " + mergedJson);

    } catch (Exception e) {

        e.printStackTrace();
        throw new RuntimeException("Failed to process telemetry for device: " + deviceCode);

    }
}

    // 🆕 NUEVO MÉTODO
    public List<TelemetryRecord> getTelemetryHistory(Long deviceId) {

    return telemetryRecordRepository.findByDeviceIdOrderByTimestampDesc(deviceId);

    }
}