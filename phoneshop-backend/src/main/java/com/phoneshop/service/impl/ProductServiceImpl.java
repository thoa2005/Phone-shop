package com.phoneshop.service.impl;

import com.phoneshop.dto.request.ProductRequest;
import com.phoneshop.dto.response.BrandResponse;
import com.phoneshop.dto.response.CategoryResponse;
import com.phoneshop.dto.response.ProductResponse;
import com.phoneshop.entity.*;
import com.phoneshop.exception.BadRequestException;
import com.phoneshop.exception.ResourceNotFoundException;
import com.phoneshop.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductServiceImpl {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final BrandRepository brandRepository;

    @Transactional(readOnly = true)
    public Page<ProductResponse> getProducts(String name, Long categoryId, Long brandId,
                                              BigDecimal minPrice, BigDecimal maxPrice, Pageable pageable) {
        return productRepository.searchProducts(name, categoryId, brandId, minPrice, maxPrice, pageable)
                .map(ProductServiceImpl::toProductResponse);
    }

    @Transactional(readOnly = true)
    public ProductResponse getBySlug(String slug) {
        Product p = productRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
        return toProductResponse(p);
    }

    @Transactional(readOnly = true)
    public ProductResponse getById(Long id) {
        Product p = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
        return toProductResponse(p);
    }

    @Transactional
    public ProductResponse create(ProductRequest request) {
        if (productRepository.existsBySlug(request.getSlug())) {
            throw new BadRequestException("Slug already exists");
        }
        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"));
        Brand brand = brandRepository.findById(request.getBrandId())
                .orElseThrow(() -> new ResourceNotFoundException("Brand not found"));

        Product product = Product.builder()
                .name(request.getName()).slug(request.getSlug())
                .description(request.getDescription())
                .category(category).brand(brand)
                .price(request.getPrice()).salePrice(request.getSalePrice())
                .stock(request.getStock()).isActive(request.getIsActive())
                .build();

        // Images
        if (request.getImageUrls() != null) {
            List<ProductImage> images = new ArrayList<>();
            for (String url : request.getImageUrls()) {
                images.add(ProductImage.builder()
                        .product(product)
                        .imageUrl(url)
                        .isPrimary(url.equals(request.getPrimaryImageUrl()))
                        .build());
            }
            product.setImages(images);
        }

        // Specs
        if (request.getSpecs() != null) {
            List<ProductSpec> specs = request.getSpecs().stream()
                    .map(s -> ProductSpec.builder()
                            .product(product)
                            .specName(s.getSpecName())
                            .specValue(s.getSpecValue())
                            .build())
                    .collect(Collectors.toList());
            product.setSpecs(specs);
        }

        return toProductResponse(productRepository.save(product));
    }

    @Transactional
    public ProductResponse update(Long id, ProductRequest request) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"));
        Brand brand = brandRepository.findById(request.getBrandId())
                .orElseThrow(() -> new ResourceNotFoundException("Brand not found"));

        product.setName(request.getName());
        product.setDescription(request.getDescription());
        product.setCategory(category);
        product.setBrand(brand);
        product.setPrice(request.getPrice());
        product.setSalePrice(request.getSalePrice());
        product.setStock(request.getStock());
        product.setIsActive(request.getIsActive());

        // Update Images
        if (request.getImageUrls() != null) {
            product.getImages().clear();
            for (String url : request.getImageUrls()) {
                product.getImages().add(ProductImage.builder()
                        .product(product)
                        .imageUrl(url)
                        .isPrimary(url.equals(request.getPrimaryImageUrl()))
                        .build());
            }
        }

        // Update Specs
        if (request.getSpecs() != null) {
            product.getSpecs().clear();
            for (ProductRequest.SpecItem s : request.getSpecs()) {
                product.getSpecs().add(ProductSpec.builder()
                        .product(product)
                        .specName(s.getSpecName())
                        .specValue(s.getSpecValue())
                        .build());
            }
        }

        return toProductResponse(productRepository.save(product));
    }

    @Transactional
    public void delete(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
        product.setIsActive(false);
        productRepository.save(product);
    }

    public static ProductResponse toProductResponse(Product p) {
        List<ProductResponse.ImageResponse> images = p.getImages() == null ? List.of() :
                p.getImages().stream().map(img -> ProductResponse.ImageResponse.builder()
                        .id(img.getId()).imageUrl(img.getImageUrl()).isPrimary(img.getIsPrimary()).build())
                        .collect(Collectors.toList());

        List<ProductResponse.SpecResponse> specs = p.getSpecs() == null ? List.of() :
                p.getSpecs().stream().map(s -> ProductResponse.SpecResponse.builder()
                        .id(s.getId()).specName(s.getSpecName()).specValue(s.getSpecValue()).build())
                        .collect(Collectors.toList());

        List<ProductResponse.ReviewResponse> reviews = List.of();
        try {
            reviews = p.getReviews() == null ? List.of() :
                    p.getReviews().stream().map(r -> ProductResponse.ReviewResponse.builder()
                            .id(r.getId())
                            .rating(r.getRating())
                            .comment(r.getComment())
                            .createdAt(r.getCreatedAt())
                            .user(ProductResponse.UserInfo.builder()
                                    .id(r.getUser().getId())
                                    .fullName(r.getUser().getFullName())
                                    .avatar(r.getUser().getAvatar())
                                    .build())
                            .build())
                            .collect(Collectors.toList());
        } catch (Exception e) {
            // Lazy loading may fail for list queries, ignore silently
        }

        int reviewCount = reviews.size();
        Float averageRating = p.getAvgRating() != null ? p.getAvgRating() : 0.0f;

        CategoryResponse cat = p.getCategory() == null ? null :
                CategoryResponse.builder().id(p.getCategory().getId())
                        .name(p.getCategory().getName()).slug(p.getCategory().getSlug())
                        .image(p.getCategory().getImage()).build();

        BrandResponse brand = p.getBrand() == null ? null :
                BrandResponse.builder().id(p.getBrand().getId())
                        .name(p.getBrand().getName()).logo(p.getBrand().getLogo()).build();

        return ProductResponse.builder()
                .id(p.getId()).name(p.getName()).slug(p.getSlug())
                .description(p.getDescription()).price(p.getPrice()).salePrice(p.getSalePrice())
                .stock(p.getStock()).sold(p.getSold()).avgRating(p.getAvgRating())
                .isActive(p.getIsActive()).category(cat).brand(brand)
                .images(images).specs(specs)
                .reviews(reviews).averageRating(averageRating).reviewCount(reviewCount)
                .build();
    }
}
