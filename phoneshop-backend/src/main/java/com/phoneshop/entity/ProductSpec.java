package com.phoneshop.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "product_specs")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ProductSpec {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(name = "spec_name", nullable = false)
    private String specName;

    @Column(name = "spec_value", nullable = false)
    private String specValue;
}
