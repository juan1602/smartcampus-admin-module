package com.uis.smartcampus.admin_module.controller;

import com.uis.smartcampus.admin_module.model.Device;
import com.uis.smartcampus.admin_module.model.DigitalTwin;
import com.uis.smartcampus.admin_module.model.TelemetryRecord;
import com.uis.smartcampus.admin_module.repository.DeviceRepository;
import com.uis.smartcampus.admin_module.repository.DigitalTwinRepository;
import com.uis.smartcampus.admin_module.repository.TelemetryRecordRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.web.bind.annotation.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/telemetry")
@RequiredArgsConstructor
public class TelemetryController {

    private final DeviceRepository deviceRepository;
    private final DigitalTwinRepository twinRepository;
    private final TelemetryRecordRepository telemetryRecordRepository;

    @PostMapping("/{code}")
    public DigitalTwin receiveTelemetry(@PathVariable String code,
                                        @RequestBody Map<String, Object> telemetry) throws Exception {

        Device device = deviceRepository.findByCode(code)
                .orElseThrow(() -> new RuntimeException("Device not found"));

        DigitalTwin twin = device.getTwin();
        
        // 🔥 1️⃣ Obtener nombres de componentes permitidos
        Set<String> allowedComponents = device.getComponents()
                .stream()
                .map(component -> component.getName())
                .collect(Collectors.toSet());

        // 🔥 2️⃣ Filtrar solo datos que correspondan a esos componente
        Map<String, Object> filteredTelemetry = telemetry.entrySet()
                .stream()
                .filter(entry -> allowedComponents.contains(entry.getKey()))
                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));

        ObjectMapper mapper = new ObjectMapper();
        String json = mapper.writeValueAsString(filteredTelemetry);
        
        TelemetryRecord record = TelemetryRecord.builder()
                .device(device)
                .telemetryJson(json)
                .timestamp(LocalDateTime.now())
                .build();

        telemetryRecordRepository.save(record);

        twin.setTelemetryJson(json);
        twin.setLastUpdate(LocalDateTime.now());
        twin.setStatus("ONLINE");

        device.setStatus("ONLINE");
        device.setLastSeen(LocalDateTime.now());

        deviceRepository.save(device);
        return twinRepository.save(twin);
    }

    @GetMapping("/history/{code}")
    public List<Map<String, Object>> getHistory(@PathVariable String code) throws Exception {

        Device device = deviceRepository.findByCode(code)
                .orElseThrow(() -> new RuntimeException("Device not found"));

        List<TelemetryRecord> records =
                telemetryRecordRepository.findByDeviceOrderByTimestampDesc(device);

        ObjectMapper mapper = new ObjectMapper();

        return records.stream().map(record -> {
            try {
                Map<String, Object> data =
                        mapper.readValue(record.getTelemetryJson(), new com.fasterxml.jackson.core.type.TypeReference<Map<String, Object>>() {});

                data.put("timestamp", record.getTimestamp());
                return data;
            } catch (Exception e) {
                throw new RuntimeException(e);
            }
        }).toList();
    }
}
