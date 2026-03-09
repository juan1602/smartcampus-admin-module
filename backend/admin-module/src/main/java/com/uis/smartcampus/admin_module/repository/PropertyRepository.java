package com.uis.smartcampus.admin_module.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.uis.smartcampus.admin_module.model.Property;
public interface PropertyRepository extends JpaRepository<Property, Long> {

}
