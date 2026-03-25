package com.phoneshop.controller;

import com.phoneshop.dto.request.CouponRequest;
import com.phoneshop.dto.response.CouponResponse;
import com.phoneshop.entity.Coupon;
import com.phoneshop.exception.BadRequestException;
import com.phoneshop.exception.ResourceNotFoundException;
import com.phoneshop.repository.CouponRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/coupons")
@RequiredArgsConstructor
public class CouponController {

    private final CouponRepository couponRepository;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<CouponResponse>> getAll() {
        return ResponseEntity.ok(couponRepository.findAll().stream().map(this::toResponse).collect(Collectors.toList()));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CouponResponse> create(@RequestBody CouponRequest request) {
        if (couponRepository.existsByCode(request.getCode()))
            throw new BadRequestException("Coupon code already exists");
        Coupon coupon = Coupon.builder()
                .code(request.getCode())
                .type(Coupon.CouponType.valueOf(request.getType()))
                .value(request.getValue()).minOrder(request.getMinOrder())
                .maxUses(request.getMaxUses()).startDate(request.getStartDate())
                .endDate(request.getEndDate()).isActive(request.getIsActive()).build();
        return ResponseEntity.ok(toResponse(couponRepository.save(coupon)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CouponResponse> update(@PathVariable Long id, @RequestBody CouponRequest request) {
        Coupon coupon = couponRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Coupon not found"));
        coupon.setValue(request.getValue());
        coupon.setMinOrder(request.getMinOrder());
        coupon.setMaxUses(request.getMaxUses());
        coupon.setStartDate(request.getStartDate());
        coupon.setEndDate(request.getEndDate());
        coupon.setIsActive(request.getIsActive());
        return ResponseEntity.ok(toResponse(couponRepository.save(coupon)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        couponRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/validate")
    public ResponseEntity<CouponResponse> validate(@RequestBody Map<String, String> body) {
        String code = body.get("code");
        Coupon coupon = couponRepository.findByCode(code)
                .orElseThrow(() -> new BadRequestException("Invalid coupon code"));
        if (!coupon.getIsActive()) throw new BadRequestException("Coupon is not active");
        if (coupon.getEndDate() != null && LocalDate.now().isAfter(coupon.getEndDate()))
            throw new BadRequestException("Coupon has expired");
        if (coupon.getMaxUses() != null && coupon.getUsedCount() >= coupon.getMaxUses())
            throw new BadRequestException("Coupon usage limit reached");
        return ResponseEntity.ok(toResponse(coupon));
    }

    private CouponResponse toResponse(Coupon c) {
        return CouponResponse.builder().id(c.getId()).code(c.getCode())
                .type(c.getType().name()).value(c.getValue()).minOrder(c.getMinOrder())
                .maxUses(c.getMaxUses()).usedCount(c.getUsedCount())
                .startDate(c.getStartDate()).endDate(c.getEndDate()).isActive(c.getIsActive()).build();
    }
}
