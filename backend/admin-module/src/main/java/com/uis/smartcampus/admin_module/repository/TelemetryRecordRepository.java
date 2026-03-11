package com.uis.smartcampus.admin_module.repository;

import com.uis.smartcampus.admin_module.model.Device;
import com.uis.smartcampus.admin_module.model.TelemetryRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TelemetryRecordRepository extends JpaRepository<TelemetryRecord, Long> {

    List<TelemetryRecord> findByDeviceId(Long deviceId);

    List<TelemetryRecord> findByDeviceOrderByTimestampDesc(Device device);

    // 🆕 NUEVO - para consultar historial directamente por id del dispositivo
    List<TelemetryRecord> findByDeviceIdOrderByTimestampDesc(@org.springframework.lang.NonNull Long deviceId);

}
