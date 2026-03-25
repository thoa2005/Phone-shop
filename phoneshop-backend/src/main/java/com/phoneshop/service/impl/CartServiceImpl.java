package com.phoneshop.service.impl;

import com.phoneshop.dto.request.CartItemRequest;
import com.phoneshop.dto.response.CartResponse;
import com.phoneshop.entity.*;
import com.phoneshop.exception.BadRequestException;
import com.phoneshop.exception.ResourceNotFoundException;
import com.phoneshop.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;
import java.util.ArrayList;

import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CartServiceImpl {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    @PersistenceContext
    private EntityManager entityManager;

    @Transactional
    public CartResponse getCart(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Cart cart = cartRepository.findByUserId(user.getId())
                .orElseGet(() -> {
                    Cart newCart = Cart.builder().user(user).build();
                    return cartRepository.save(newCart);
                });
        return toCartResponse(cart);
    }

    @Transactional
    public CartResponse addItem(String email, CartItemRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Cart cart = cartRepository.findByUserId(user.getId())
                .orElseGet(() -> cartRepository.save(Cart.builder().user(user).build()));

        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found"));

        if (product.getStock() < request.getQuantity()) {
            throw new BadRequestException("Not enough stock");
        }

        BigDecimal price = product.getSalePrice() != null ? product.getSalePrice() : product.getPrice();

        cartItemRepository.findByCartIdAndProductId(cart.getId(), product.getId())
                .ifPresentOrElse(item -> {
                    item.setQuantity(item.getQuantity() + request.getQuantity());
                    item.setPrice(price);
                    cartItemRepository.save(item);
                }, () -> {
                    CartItem item = CartItem.builder()
                            .cart(cart).product(product)
                            .quantity(request.getQuantity()).price(price).build();
                    cartItemRepository.save(item);
                    
                    if (cart.getItems() == null) {
                        cart.setItems(new ArrayList<>());
                    }
                    cart.getItems().add(item);
                });

        entityManager.flush();
        entityManager.refresh(cart);

        return toCartResponse(cart);
    }

    @Transactional
    public CartResponse updateItem(String email, Long itemId, Integer quantity) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        CartItem item = cartItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart item not found"));
        if (!item.getCart().getUser().getId().equals(user.getId())) {
            throw new BadRequestException("Not your cart item");
        }
        if (quantity <= 0) {
            cartItemRepository.delete(item);
        } else {
            item.setQuantity(quantity);
            cartItemRepository.save(item);
        }
        
        Cart cart = item.getCart();
        entityManager.flush();
        entityManager.refresh(cart);
        
        return toCartResponse(cart);
    }

    @Transactional
    public CartResponse removeItem(String email, Long itemId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        CartItem item = cartItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart item not found"));
        if (!item.getCart().getUser().getId().equals(user.getId())) {
            throw new BadRequestException("Not your cart item");
        }
        Cart cart = item.getCart();
        cartItemRepository.delete(item);
        
        entityManager.flush();
        entityManager.refresh(cart);
        
        return toCartResponse(cart);
    }

    @Transactional
    public void clearCart(Long userId) {
        cartRepository.findByUserId(userId).ifPresent(cart -> {
            cartItemRepository.deleteByCartId(cart.getId());
        });
    }

    private CartResponse toCartResponse(Cart cart) {
        List<CartResponse.CartItemResponse> items = cart.getItems() == null ? List.of() :
                cart.getItems().stream().map(item -> {
                    String img = item.getProduct().getImages() != null && !item.getProduct().getImages().isEmpty()
                            ? item.getProduct().getImages().stream().filter(i -> i.getIsPrimary()).findFirst()
                                    .map(i -> i.getImageUrl()).orElse(item.getProduct().getImages().get(0).getImageUrl())
                            : null;
                    
                    BigDecimal itemPrice = item.getPrice() != null ? item.getPrice() : BigDecimal.ZERO;
                    BigDecimal subtotal = itemPrice.multiply(BigDecimal.valueOf(item.getQuantity()));
                    
                    return CartResponse.CartItemResponse.builder()
                            .id(item.getId())
                            .productId(item.getProduct().getId())
                            .productName(item.getProduct().getName())
                            .productImage(img)
                            .productPrice(item.getProduct().getPrice())
                            .salePrice(item.getProduct().getSalePrice())
                            .stock(item.getProduct().getStock())
                            .quantity(item.getQuantity())
                            .price(itemPrice)
                            .subtotal(subtotal)
                            .build();
                }).collect(Collectors.toList());

        BigDecimal total = items.stream()
                .map(CartResponse.CartItemResponse::getSubtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return CartResponse.builder()
                .id(cart.getId())
                .items(items)
                .totalPrice(total)
                .totalItems(items.stream().mapToInt(CartResponse.CartItemResponse::getQuantity).sum())
                .build();
    }
}
