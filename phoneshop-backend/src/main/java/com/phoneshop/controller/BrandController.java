package com.phoneshop.controller;

import com.phoneshop.dto.response.BrandResponse;
import com.phoneshop.entity.Brand;
import com.phoneshop.exception.ResourceNotFoundException;
import com.phoneshop.repository.BrandRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/brands")
@RequiredArgsConstructor
public class BrandController {

    private final BrandRepository brandRepository;

    @GetMapping
    public ResponseEntity<List<BrandResponse>> getAll() {
        return ResponseEntity.ok(brandRepository.findAll().stream()
                .map(b -> BrandResponse.builder().id(b.getId()).name(b.getName()).logo(b.getLogo()).build())
                .collect(Collectors.toList()));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<BrandResponse> create(@RequestBody Map<String, String> body) {
        Brand brand = Brand.builder().name(body.get("name")).logo(body.get("logo")).build();
        brand = brandRepository.save(brand);
        return ResponseEntity.ok(BrandResponse.builder().id(brand.getId()).name(brand.getName()).logo(brand.getLogo()).build());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<BrandResponse> update(@PathVariable Long id, @RequestBody Map<String, String> body) {
        Brand brand = brandRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Brand not found"));
        if (body.get("name") != null) brand.setName(body.get("name"));
        if (body.get("logo") != null) brand.setLogo(body.get("logo"));
        brand = brandRepository.save(brand);
        return ResponseEntity.ok(BrandResponse.builder().id(brand.getId()).name(brand.getName()).logo(brand.getLogo()).build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        brandRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
