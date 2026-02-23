package com.uis.smartcampus.admin_module.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ComponentDTO {
    private Long id;
    private String name;
    private String unit;
    private String description;
}
