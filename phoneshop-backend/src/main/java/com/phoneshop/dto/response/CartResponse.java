package com.phoneshop.dto.response;

import lombok.*;
import java.math.BigDecimal;
import java.util.List;

@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class CartResponse {
    private Long id;
    private List<CartItemResponse> items;
    private BigDecimal totalPrice;
    private Integer totalItems;

    @Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
    public static class CartItemResponse {
        private Long id;
        private Long productId;
        private String productName;
        private String productImage;
        private BigDecimal productPrice;
        private BigDecimal salePrice;
        private Integer stock;
        private Integer quantity;
        private BigDecimal price;
        private BigDecimal subtotal;
    }
}
