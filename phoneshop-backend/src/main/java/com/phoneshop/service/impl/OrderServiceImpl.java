package com.phoneshop.service.impl;

import com.phoneshop.dto.request.OrderRequest;
import com.phoneshop.dto.response.AddressResponse;
import com.phoneshop.dto.response.CouponResponse;
import com.phoneshop.dto.response.OrderResponse;
import com.phoneshop.dto.response.UserResponse;
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
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class OrderServiceImpl {

    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final AddressRepository addressRepository;
    private final ProductRepository productRepository;
    private final CouponRepository couponRepository;
    private final CartRepository cartRepository;
    private final CartServiceImpl cartService;

    @Transactional
    public OrderResponse createOrder(String email, OrderRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Address address = addressRepository.findById(request.getAddressId())
                .orElseThrow(() -> new ResourceNotFoundException("Address not found"));

        List<OrderItem> orderItems = new ArrayList<>();
        BigDecimal total = BigDecimal.ZERO;

        // If no items in request, read from user's cart
        if (request.getItems() != null && !request.getItems().isEmpty()) {
            for (OrderRequest.OrderItemRequest itemReq : request.getItems()) {
                Product product = productRepository.findById(itemReq.getProductId())
                        .orElseThrow(() -> new ResourceNotFoundException("Product " + itemReq.getProductId() + " not found"));
                if (product.getStock() < itemReq.getQuantity()) {
                    throw new BadRequestException("Not enough stock for: " + product.getName());
                }
                BigDecimal price = product.getSalePrice() != null ? product.getSalePrice() : product.getPrice();
                BigDecimal subtotal = price.multiply(BigDecimal.valueOf(itemReq.getQuantity()));
                total = total.add(subtotal);

                orderItems.add(OrderItem.builder()
                        .product(product).quantity(itemReq.getQuantity()).price(price).build());
            }
        } else {
            // Read from cart
            Cart cart = cartRepository.findByUserId(user.getId())
                    .orElseThrow(() -> new BadRequestException("Giỏ hàng trống"));
            if (cart.getItems() == null || cart.getItems().isEmpty()) {
                throw new BadRequestException("Giỏ hàng trống");
            }
            for (CartItem cartItem : cart.getItems()) {
                Product product = cartItem.getProduct();
                int qty = cartItem.getQuantity();
                if (product.getStock() < qty) {
                    throw new BadRequestException("Not enough stock for: " + product.getName());
                }
                BigDecimal price = product.getSalePrice() != null ? product.getSalePrice() : product.getPrice();
                BigDecimal subtotal = price.multiply(BigDecimal.valueOf(qty));
                total = total.add(subtotal);

                orderItems.add(OrderItem.builder()
                        .product(product).quantity(qty).price(price).build());
            }
        }

        // Apply coupon
        BigDecimal discount = BigDecimal.ZERO;
        Coupon coupon = null;
        if (request.getCouponCode() != null && !request.getCouponCode().isBlank()) {
            coupon = couponRepository.findByCode(request.getCouponCode())
                    .orElseThrow(() -> new BadRequestException("Invalid coupon"));
            validateCoupon(coupon, total);
            if (coupon.getType() == Coupon.CouponType.PERCENT) {
                discount = total.multiply(coupon.getValue()).divide(BigDecimal.valueOf(100));
            } else {
                discount = coupon.getValue();
            }
            coupon.setUsedCount(coupon.getUsedCount() + 1);
            couponRepository.save(coupon);
        }

        BigDecimal finalPrice = total.subtract(discount).max(BigDecimal.ZERO);

        Order order = Order.builder()
                .user(user).address(address).coupon(coupon)
                .totalPrice(total).discountAmount(discount).finalPrice(finalPrice)
                .status(Order.OrderStatus.PENDING)
                .paymentMethod(Order.PaymentMethod.valueOf(request.getPaymentMethod()))
                .note(request.getNote())
                .build();
        order = orderRepository.save(order);

        for (OrderItem item : orderItems) {
            item.setOrder(order);
        }
        order.setItems(orderItems);
        order = orderRepository.save(order);

        // Clear cart
        cartService.clearCart(user.getId());

        // Create payment record
        return toOrderResponse(order);
    }

    private void validateCoupon(Coupon coupon, BigDecimal total) {
        if (!coupon.getIsActive()) throw new BadRequestException("Coupon is not active");
        LocalDate today = LocalDate.now();
        if (coupon.getStartDate() != null && today.isBefore(coupon.getStartDate()))
            throw new BadRequestException("Coupon not started");
        if (coupon.getEndDate() != null && today.isAfter(coupon.getEndDate()))
            throw new BadRequestException("Coupon expired");
        if (coupon.getMaxUses() != null && coupon.getUsedCount() >= coupon.getMaxUses())
            throw new BadRequestException("Coupon usage limit reached");
        if (total.compareTo(coupon.getMinOrder()) < 0)
            throw new BadRequestException("Order doesn't meet minimum amount for this coupon");
    }

    public Page<OrderResponse> getUserOrders(String email, Pageable pageable) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return orderRepository.findByUserIdOrderByCreatedAtDesc(user.getId(), pageable)
                .map(OrderServiceImpl::toOrderResponse);
    }

    public Page<OrderResponse> getAllOrders(Pageable pageable) {
        return orderRepository.findAll(pageable).map(OrderServiceImpl::toOrderResponse);
    }

    public OrderResponse getOrderById(Long id, String email) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        return toOrderResponse(order);
    }

    @Transactional
    public OrderResponse updateStatus(Long id, String status) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        Order.OrderStatus oldStatus = order.getStatus();
        Order.OrderStatus newStatus = Order.OrderStatus.valueOf(status);

        // Khi chuyển sang DELIVERED: trừ kho và cộng số lượng đã bán
        if (newStatus == Order.OrderStatus.DELIVERED && oldStatus != Order.OrderStatus.DELIVERED) {
            for (OrderItem item : order.getItems()) {
                Product product = item.getProduct();
                if (product.getStock() < item.getQuantity()) {
                    throw new BadRequestException("Không đủ tồn kho cho: " + product.getName());
                }
                product.setStock(product.getStock() - item.getQuantity());
                product.setSold(product.getSold() + item.getQuantity());
                productRepository.save(product);
            }
        }

        // Khi chuyển sang CANCELLED từ DELIVERED: hoàn lại kho
        if (newStatus == Order.OrderStatus.CANCELLED && oldStatus == Order.OrderStatus.DELIVERED) {
            for (OrderItem item : order.getItems()) {
                Product product = item.getProduct();
                product.setStock(product.getStock() + item.getQuantity());
                product.setSold(Math.max(0, product.getSold() - item.getQuantity()));
                productRepository.save(product);
            }
        }

        order.setStatus(newStatus);
        return toOrderResponse(orderRepository.save(order));
    }

    static OrderResponse toOrderResponse(Order order) {
        UserResponse userRes = order.getUser() == null ? null :
                UserResponse.builder().id(order.getUser().getId())
                        .fullName(order.getUser().getFullName())
                        .email(order.getUser().getEmail()).build();

        AddressResponse addrRes = order.getAddress() == null ? null :
                AddressResponse.builder()
                        .id(order.getAddress().getId())
                        .fullName(order.getAddress().getFullName())
                        .phone(order.getAddress().getPhone())
                        .province(order.getAddress().getProvince())
                        .district(order.getAddress().getDistrict())
                        .ward(order.getAddress().getWard())
                        .detail(order.getAddress().getDetail())
                        .build();

        CouponResponse couponRes = order.getCoupon() == null ? null :
                CouponResponse.builder()
                        .id(order.getCoupon().getId())
                        .code(order.getCoupon().getCode())
                        .build();

        List<OrderResponse.OrderItemResponse> items = order.getItems() == null ? List.of() :
                order.getItems().stream().map(item -> {
                    String img = item.getProduct().getImages() != null && !item.getProduct().getImages().isEmpty()
                            ? item.getProduct().getImages().stream().filter(i -> i.getIsPrimary()).findFirst()
                                    .map(i -> i.getImageUrl()).orElse(item.getProduct().getImages().get(0).getImageUrl())
                            : null;
                    return OrderResponse.OrderItemResponse.builder()
                            .id(item.getId())
                            .productId(item.getProduct().getId())
                            .productName(item.getProduct().getName())
                            .productImage(img)
                            .quantity(item.getQuantity())
                            .price(item.getPrice())
                            .build();
                }).collect(Collectors.toList());

        return OrderResponse.builder()
                .id(order.getId()).user(userRes).address(addrRes).coupon(couponRes)
                .totalPrice(order.getTotalPrice()).discountAmount(order.getDiscountAmount())
                .finalPrice(order.getFinalPrice()).status(order.getStatus().name())
                .paymentMethod(order.getPaymentMethod().name()).note(order.getNote())
                .createdAt(order.getCreatedAt()).items(items).build();
    }
}
