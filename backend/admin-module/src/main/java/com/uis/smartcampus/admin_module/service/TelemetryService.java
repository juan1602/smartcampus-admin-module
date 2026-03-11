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
    public void processTelemetry(String deviceCode, Map<String, Object> data) {

        try {
            ObjectMapper mapper = new ObjectMapper();
            

            Device device = deviceRepository.findByCode(deviceCode)
                    .orElseThrow(() -> new RuntimeException("Device not found"));

            // actualizar device
            device.setLastSeen(LocalDateTime.now());
            device.setUpdatedAt(LocalDateTime.now());

            // revisar batería si existe
            Object batteryObj = data.get("battery_level");

            if (batteryObj != null) {

                double battery = Double.parseDouble(batteryObj.toString());

                if (battery == 0) {
                    device.setStatus("OFFLINE");
                } 
                else if (battery < 5) {
                    device.setStatus("WARNING");
                } 
                else {
                    device.setStatus("ONLINE");
                }
            } else {

                // si no hay batería asumimos que está online
                device.setStatus("ONLINE");
            }

            deviceRepository.save(device);

            // 🔥 Convertir Map a JSON
            String json = mapper.writeValueAsString(data);

            //guardar historial de telemetría
            TelemetryRecord record = new TelemetryRecord();
            record.setDevice(device);
            record.setTelemetryJson(json);
            record.setTimestamp(LocalDateTime.now());
            telemetryRecordRepository.save(record);

            // actualizar digital twin
            DigitalTwin twin = device.getTwin();
            twin.setTelemetryJson(json);
            twin.setLastUpdate(LocalDateTime.now());
            twinRepository.save(twin);

            System.out.println("Telemetry processed for device: " + deviceCode);

        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("Failed to  telemetry for device: " + deviceCode);
    }
}
}