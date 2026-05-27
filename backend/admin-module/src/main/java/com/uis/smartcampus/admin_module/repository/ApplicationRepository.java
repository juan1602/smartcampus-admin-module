package com.uis.smartcampus.admin_module.repository;

import com.uis.smartcampus.admin_module.model.Application;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ApplicationRepository extends JpaRepository<Application, Long> {
}