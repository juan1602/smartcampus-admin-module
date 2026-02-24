package com.uis.smartcampus.admin_module.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.uis.smartcampus.admin_module.model.Device;
import com.uis.smartcampus.admin_module.model.DigitalTwin;
import com.uis.smartcampus.admin_module.model.TelemetryRecord;
import com.uis.smartcampus.admin_module.repository.DeviceRepository;
import com.uis.smartcampus.admin_module.repository.DigitalTwinRepository;
import com.uis.smartcampus.admin_module.repository.TelemetryRecordRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.cglib.core.Local;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class TelemetryService {

    private final DeviceRepository deviceRepository;
    private final DigitalTwinRepository twinRepository;
    private final TelemetryRecordRepository telemetryRecordRepository;

    @Transactional
    public void processTelemetry(String deviceCode, String payload) {

        try {
            ObjectMapper mapper = new ObjectMapper();
            Map<String, Object> telemetry = mapper.readValue(payload, Map.class);

            Device device = deviceRepository.findByCode(deviceCode)
                    .orElseThrow(() -> new RuntimeException("Device not found"));

            // actualizar device
            device.setStatus("ONLINE");
            device.setLastSeen(LocalDateTime.now());
            device.setUpdatedAt(LocalDateTime.now());
            deviceRepository.save(device);

            //guardar historial de telemetría
            TelemetryRecord record = new TelemetryRecord();
            record.setDevice(device);
            record.setTelemetryJson(payload);
            record.setTimestamp(LocalDateTime.now());
            telemetryRecordRepository.save(record);

            // actualizar digital twin
            DigitalTwin twin = device.getTwin();
            twin.setTelemetryJson(mapper.writeValueAsString(telemetry));
            twin.setStatus("ONLINE");
            twinRepository.save(twin);
        } catch (Exception e) {
            e.printStackTrace();
    }
}
}