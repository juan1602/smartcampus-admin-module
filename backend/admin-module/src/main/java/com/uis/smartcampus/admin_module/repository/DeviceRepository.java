package com.uis.smartcampus.admin_module.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.uis.smartcampus.admin_module.model.Device;

public interface DeviceRepository extends JpaRepository<Device, Long> {

    Optional<Device> findByCode(String code);

}
