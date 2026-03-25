package com.phoneshop.dto.response;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class OrderResponse {
    private Long id;
    private UserResponse user;
    private AddressResponse address;
    private CouponResponse coupon;
    private BigDecimal totalPrice;
    private BigDecimal discountAmount;
    private BigDecimal finalPrice;
    private String status;
    private String paymentMethod;
    private String note;
    private LocalDateTime createdAt;
    private List<OrderItemResponse> items;

    @Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
    public static class OrderItemResponse {
        private Long id;
        private Long productId;
        private String productName;
        private String productImage;
        private Integer quantity;
        private BigDecimal price;
    }
}
