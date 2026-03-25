package com.phoneshop.service.impl;

import com.phoneshop.dto.request.ReviewRequest;
import com.phoneshop.dto.response.ReviewResponse;
import com.phoneshop.entity.*;
import com.phoneshop.exception.BadRequestException;
import com.phoneshop.exception.ResourceNotFoundException;
import com.phoneshop.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReviewServiceImpl {

    private final ReviewRepository reviewRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;

    public Page<ReviewResponse> getProductReviews(Long productId, Pageable pageable) {
        return reviewRepository.findByProductId(productId, pageable).map(this::toReviewResponse);
    }

    @Transactional
    public ReviewResponse createReview(String email, ReviewRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        if (reviewRepository.existsByUserIdAndProductId(user.getId(), product.getId())) {
            throw new BadRequestException("You have already reviewed this product");
        }

        Order order = null;
        if (request.getOrderId() != null) {
            order = orderRepository.findById(request.getOrderId()).orElse(null);
        }

        Review review = Review.builder()
                .user(user).product(product).order(order)
                .rating(request.getRating()).comment(request.getComment()).build();
        review = reviewRepository.save(review);

        // Update avg rating
        Double avg = reviewRepository.getAvgRatingByProductId(product.getId()).orElse(0.0);
        product.setAvgRating(avg.floatValue());
        productRepository.save(product);

        return toReviewResponse(review);
    }

    @Transactional
    public void deleteReview(Long id) {
        Review review = reviewRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Review not found"));
        reviewRepository.delete(review);
        Double avg = reviewRepository.getAvgRatingByProductId(review.getProduct().getId()).orElse(0.0);
        review.getProduct().setAvgRating(avg.floatValue());
        productRepository.save(review.getProduct());
    }

    private ReviewResponse toReviewResponse(Review r) {
        return ReviewResponse.builder()
                .id(r.getId()).userId(r.getUser().getId())
                .userFullName(r.getUser().getFullName()).userAvatar(r.getUser().getAvatar())
                .productId(r.getProduct().getId()).rating(r.getRating()).comment(r.getComment())
                .createdAt(r.getCreatedAt()).build();
    }
}
