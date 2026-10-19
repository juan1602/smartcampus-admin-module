package com.uis.smartcampus.admin_module.controller;

import com.uis.smartcampus.admin_module.model.AlertHistory;
import com.uis.smartcampus.admin_module.repository.AlertHistoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/alert-history")
@RequiredArgsConstructor
@Slf4j
public class AlertHistoryController {

    private final AlertHistoryRepository alertHistoryRepository;

    @GetMapping
    public Page<AlertHistory> getHistory(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        log.info("GET /alert-history");
        return alertHistoryRepository.findAllByOrderByTriggeredAtDesc(PageRequest.of(page, size));
    }

    @DeleteMapping
    public void clearHistory() {
        log.info("DELETE /alert-history");
        alertHistoryRepository.deleteAll();
    }
}