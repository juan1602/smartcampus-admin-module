package com.uis.smartcampus.admin_module.controller;

import com.uis.smartcampus.admin_module.model.UnknownDeviceEvent;
import com.uis.smartcampus.admin_module.repository.UnknownDeviceEventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/unknown-devices")
@RequiredArgsConstructor
public class UnknownDeviceController {

    private final UnknownDeviceEventRepository repository;

    @GetMapping
    public List<UnknownDeviceEvent> getPending() {
        return repository.findByIgnoredFalseOrderByReceivedAtDesc();
    }

    @PostMapping("/{id}/ignore")
    public ResponseEntity<?> ignore(@PathVariable Long id) {
        return repository.findById(id).map(event -> {
            event.setIgnored(true);
            repository.save(event);
            return ResponseEntity.ok(Map.of("message", "Evento ignorado"));
        }).orElse(ResponseEntity.notFound().build());
    }
}
