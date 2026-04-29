package com.uis.smartcampus.admin_module.repository;

import com.uis.smartcampus.admin_module.model.AlertHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AlertHistoryRepository extends JpaRepository<AlertHistory, Long> {
    Page<AlertHistory> findAllByOrderByTriggeredAtDesc(Pageable pageable);
}
