package com.uis.smartcampus.admin_module.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.uis.smartcampus.admin_module.model.Component;

public interface ComponentRepository extends JpaRepository<Component, Long> {

}
