package com.uis.smartcampus.admin_module.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.uis.smartcampus.admin_module.model.Device;
import com.uis.smartcampus.admin_module.repository.DeviceRepository;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DeviceStatusScheduler {

    private final DeviceRepository deviceRepository;

    @Scheduled(fixedRate = 30000)
    public void checkDevices() {
        log.debug("Verificando estado de los dispositivos");

        List<Device> devices = deviceRepository.findAll();
        LocalDateTime now = LocalDateTime.now();

        for (Device device : devices) {

            if (device.getLastSeen() == null) {
                device.setStatus("OFFLINE");
                deviceRepository.save(device);
                continue;
            }

            // No tocar dispositivos en mantenimiento
            if ("MAINTENANCE".equalsIgnoreCase(device.getStatus())) continue;

            long seconds = Duration
                    .between(device.getLastSeen(), now)
                    .getSeconds();

            if (seconds > 600) {
                log.debug("Dispositivo {} sin datos hace {} s: marcado OFFLINE", device.getCode(), seconds);

                device.setStatus("OFFLINE");
                deviceRepository.save(device);
            }
        }
    }
}