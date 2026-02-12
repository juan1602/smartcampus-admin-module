package com.uis.smartcampus.admin_module.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.uis.smartcampus.admin_module.model.DigitalTwin;

public interface DigitalTwinRepository extends JpaRepository<DigitalTwin, Long> {

    Optional<DigitalTwin> findByDeviceId(Long deviceId);

}
