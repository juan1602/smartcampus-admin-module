package com.uis.smartcampus.admin_module.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import org.springframework.stereotype.Repository;

import com.uis.smartcampus.admin_module.model.DigitalTwin;

@Repository
public interface DigitalTwinRepository extends JpaRepository<DigitalTwin, Long> {

    Optional<DigitalTwin> findByDeviceId(Long deviceId);

}
