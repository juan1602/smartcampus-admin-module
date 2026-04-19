package com.uis.smartcampus.admin_module.repository;

import com.uis.smartcampus.admin_module.model.UnknownDeviceEvent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UnknownDeviceEventRepository extends JpaRepository<UnknownDeviceEvent, Long> {

    List<UnknownDeviceEvent> findByIgnoredFalseOrderByReceivedAtDesc();

    boolean existsByDeviceCodeAndIgnoredFalse(String deviceCode);
}
