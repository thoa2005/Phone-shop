package com.phoneshop.controller;


import com.phoneshop.entity.Order;
import com.phoneshop.entity.Payment;
import com.phoneshop.exception.ResourceNotFoundException;
import com.phoneshop.repository.OrderRepository;
import com.phoneshop.repository.PaymentRepository;
import com.phoneshop.service.impl.VNPayService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

import org.springframework.transaction.annotation.Transactional;

@RestController
@RequestMapping("/api/payment")
@RequiredArgsConstructor
public class PaymentController {

    private final VNPayService vnPayService;
    private final OrderRepository orderRepository;
    private final PaymentRepository paymentRepository;

    @PostMapping("/vnpay/create")
    @Transactional
    public ResponseEntity<Map<String, String>> createVNPayPayment(
            @AuthenticationPrincipal UserDetails user,
            @RequestBody Map<String, Long> body,
            HttpServletRequest request) {

        Long orderId = body.get("orderId");
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        // Verify order belongs to user
        if (!order.getUser().getEmail().equals(user.getUsername())) {
            throw new RuntimeException("Unauthorized");
        }

        String ipAddress = request.getRemoteAddr();
        if ("0:0:0:0:0:0:0:1".equals(ipAddress)) ipAddress = "127.0.0.1";

        String paymentUrl = vnPayService.createPaymentUrl(orderId, order.getFinalPrice(), ipAddress);

        // Create Payment record
        Payment payment = paymentRepository.findByOrderId(orderId).orElse(null);
        if (payment == null) {
            payment = Payment.builder()
                    .order(order)
                    .method(Payment.PaymentMethod.VNPAY)
                    .status(Payment.PaymentStatus.PENDING)
                    .amount(order.getFinalPrice())
                    .build();
            paymentRepository.save(payment);
        }

        return ResponseEntity.ok(Map.of("paymentUrl", paymentUrl));
    }

    @GetMapping("/vnpay/return")
    @Transactional
    public ResponseEntity<Map<String, Object>> vnpayReturn(@RequestParam Map<String, String> params) {
        boolean isValid = vnPayService.validateReturn(params);
        String txnRef = params.get("vnp_TxnRef");
        String responseCode = params.get("vnp_ResponseCode");
        String transactionNo = params.get("vnp_TransactionNo");

        if (txnRef != null) {
            Long orderId = Long.parseLong(txnRef);
            Payment payment = paymentRepository.findByOrderId(orderId).orElse(null);

            if (isValid && "00".equals(responseCode)) {
                // Payment successful
                if (payment != null) {
                    payment.setStatus(Payment.PaymentStatus.COMPLETED);
                    payment.setTransactionId(transactionNo);
                    payment.setPaidAt(java.time.LocalDateTime.now());
                    paymentRepository.save(payment);
                }
                Order order = orderRepository.findById(orderId).orElse(null);
                if (order != null) {
                    order.setStatus(Order.OrderStatus.CONFIRMED);
                    orderRepository.save(order);
                }
                return ResponseEntity.ok(Map.of("success", true, "orderId", orderId, "message", "Thanh toán thành công"));
            } else {
                // Payment failed
                if (payment != null) {
                    payment.setStatus(Payment.PaymentStatus.FAILED);
                    paymentRepository.save(payment);
                }
                return ResponseEntity.ok(Map.of("success", false, "orderId", orderId, "message", "Thanh toán thất bại"));
            }
        }

        return ResponseEntity.ok(Map.of("success", false, "message", "Dữ liệu không hợp lệ"));
    }
}
