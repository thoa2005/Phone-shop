package com.phoneshop.controller;

import com.phoneshop.dto.response.UserResponse;
import com.phoneshop.entity.User;
import com.phoneshop.exception.ResourceNotFoundException;
import com.phoneshop.repository.OrderRepository;
import com.phoneshop.repository.ProductRepository;
import com.phoneshop.repository.UserRepository;
import com.phoneshop.service.impl.AuthServiceImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;

    @GetMapping("/me")
    public ResponseEntity<UserResponse> getMe(@AuthenticationPrincipal UserDetails ud) {
        User user = userRepository.findByEmail(ud.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return ResponseEntity.ok(AuthServiceImpl.toUserResponse(user));
    }

    @PutMapping("/me")
    public ResponseEntity<UserResponse> updateMe(@AuthenticationPrincipal UserDetails ud,
                                                  @RequestBody Map<String, String> body) {
        User user = userRepository.findByEmail(ud.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (body.get("fullName") != null) user.setFullName(body.get("fullName"));
        if (body.get("phone") != null) user.setPhone(body.get("phone"));
        if (body.get("avatar") != null) user.setAvatar(body.get("avatar"));
        return ResponseEntity.ok(AuthServiceImpl.toUserResponse(userRepository.save(user)));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<UserResponse>> getAllUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(userRepository.findAll(PageRequest.of(page, size))
                .map(AuthServiceImpl::toUserResponse));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserResponse> toggleStatus(@PathVariable Long id, @RequestBody Map<String, Boolean> body) {
        User user = userRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("User not found"));
        user.setIsActive(body.get("isActive"));
        return ResponseEntity.ok(AuthServiceImpl.toUserResponse(userRepository.save(user)));
    }

    @GetMapping("/admin/dashboard")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getDashboard() {
        long totalUsers = userRepository.count();
        long totalProducts = productRepository.count();
        long pendingOrders = orderRepository.countByStatus(com.phoneshop.entity.Order.OrderStatus.PENDING);
        long totalOrders = orderRepository.count();
        return ResponseEntity.ok(Map.of(
                "totalUsers", totalUsers,
                "totalProducts", totalProducts,
                "totalOrders", totalOrders,
                "pendingOrders", pendingOrders
        ));
    }
}
