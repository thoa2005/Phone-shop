package com.phoneshop.dto.response;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class ProductResponse {
    private Long id;
    private String name;
    private String slug;
    private String description;
    private BigDecimal price;
    private BigDecimal salePrice;
    private Integer stock;
    private Integer sold;
    private Float avgRating;
    private Boolean isActive;
    private CategoryResponse category;
    private BrandResponse brand;
    private List<ImageResponse> images;
    private List<SpecResponse> specs;
    private List<ReviewResponse> reviews;
    private Float averageRating;
    private Integer reviewCount;

    @Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
    public static class ImageResponse {
        private Long id;
        private String imageUrl;
        private Boolean isPrimary;
    }

    @Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
    public static class SpecResponse {
        private Long id;
        private String specName;
        private String specValue;
    }

    @Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
    public static class ReviewResponse {
        private Long id;
        private Integer rating;
        private String comment;
        private UserInfo user;
        private LocalDateTime createdAt;
    }

    @Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
    public static class UserInfo {
        private Long id;
        private String fullName;
        private String avatar;
    }
}
