package com.phoneshop.dto.response;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class ReviewResponse {
    private Long id;
    private Long userId;
    private String userFullName;
    private String userAvatar;
    private Long productId;
    private Integer rating;
    private String comment;
    private LocalDateTime createdAt;
}
