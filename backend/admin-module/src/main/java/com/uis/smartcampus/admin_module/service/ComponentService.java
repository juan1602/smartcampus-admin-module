package com.uis.smartcampus.admin_module.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.uis.smartcampus.admin_module.dto.ComponentDTO;
import com.uis.smartcampus.admin_module.model.Component;
import com.uis.smartcampus.admin_module.model.Device;
import com.uis.smartcampus.admin_module.repository.ComponentRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ComponentService {

    private final ComponentRepository componentRepository;

    public Component createComponent(Component component) {
        return componentRepository.save(component);
    }

    public List<Component> getComponentsByDevice(Long deviceId) {
        return componentRepository.findByDeviceId(deviceId);
    }

    public Component updateComponent(Long componentId, Component componentDetails) {
        Component component = componentRepository.findById(componentId)
                .orElseThrow(() -> new RuntimeException("Component not found"));
        
        component.setName(componentDetails.getName());
        component.setType(componentDetails.getType());
        component.setDataType(componentDetails.getDataType());
        component.setUnit(componentDetails.getUnit());
        component.setMinValue(componentDetails.getMinValue());
        component.setMaxValue(componentDetails.getMaxValue());
        component.setDescription(componentDetails.getDescription());

        return componentRepository.save(component);
    }

    public void deleteComponent(Long componentId) {
        componentRepository.deleteById(componentId);
    }

    public List<ComponentDTO> toDTO(List<Component> components) {
        return components.stream().map(this::toDTO).collect(Collectors.toList());
    }

    public ComponentDTO toDTO(Component component) {
        return ComponentDTO.builder()
                .id(component.getId())
                .name(component.getName())
                .type(component.getType())
                .dataType(component.getDataType())
                .unit(component.getUnit())
                .minValue(component.getMinValue())
                .maxValue(component.getMaxValue())
                .description(component.getDescription())
                .build();
    }
}
