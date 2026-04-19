package com.uis.smartcampus.admin_module.repository;

import com.uis.smartcampus.admin_module.model.AlertRule;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AlertRuleRepository extends JpaRepository<AlertRule, Long> {
    List<AlertRule> findByActiveTrue();
}
