package com.uis.smartcampus.admin_module.controller;

import com.uis.smartcampus.admin_module.model.UnknownDeviceEvent;
import com.uis.smartcampus.admin_module.repository.UnknownDeviceEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/unknown-devices")
@RequiredArgsConstructor
@Slf4j
public class UnknownDeviceController {

    private final UnknownDeviceEventRepository repository;

    @GetMapping
    public List<UnknownDeviceEvent> getPending() {
        log.info("GET /unknown-devices");
        return repository.findByIgnoredFalseOrderByReceivedAtDesc();
    }

    @PostMapping("/{id}/ignore")
    public ResponseEntity<?> ignore(@PathVariable Long id) {
        log.info("POST /unknown-devices/{}/ignore", id);
        return repository.findById(id).map(event -> {
            event.setIgnored(true);
            repository.save(event);
            return ResponseEntity.ok(Map.of("message", "Evento ignorado"));
        }).orElse(ResponseEntity.notFound().build());
    }
}