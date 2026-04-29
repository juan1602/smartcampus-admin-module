package com.uis.smartcampus.admin_module.controller;

import com.uis.smartcampus.admin_module.model.AlertHistory;
import com.uis.smartcampus.admin_module.repository.AlertHistoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/alert-history")
@RequiredArgsConstructor
public class AlertHistoryController {

    private final AlertHistoryRepository alertHistoryRepository;

    @GetMapping
    public Page<AlertHistory> getHistory(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return alertHistoryRepository.findAllByOrderByTriggeredAtDesc(PageRequest.of(page, size));
    }

    @DeleteMapping
    public void clearHistory() {
        alertHistoryRepository.deleteAll();
    }
}
