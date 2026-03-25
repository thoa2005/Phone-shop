package com.phoneshop.controller;

import com.phoneshop.dto.response.AddressResponse;
import com.phoneshop.dto.request.AddressRequest;
import com.phoneshop.entity.Address;
import com.phoneshop.entity.User;
import com.phoneshop.exception.ResourceNotFoundException;
import com.phoneshop.repository.AddressRepository;
import com.phoneshop.repository.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/addresses")
@RequiredArgsConstructor
public class AddressController {

    private final AddressRepository addressRepository;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<AddressResponse>> getMyAddresses(@AuthenticationPrincipal UserDetails ud) {
        User user = userRepository.findByEmail(ud.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return ResponseEntity.ok(addressRepository.findByUserId(user.getId()).stream()
                .map(this::toResponse).collect(Collectors.toList()));
    }

    @PostMapping
    public ResponseEntity<AddressResponse> create(@AuthenticationPrincipal UserDetails ud,
                                                   @Valid @RequestBody AddressRequest request) {
        User user = userRepository.findByEmail(ud.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (request.getIsDefault()) {
            addressRepository.findByUserIdAndIsDefaultTrue(user.getId())
                    .ifPresent(a -> { a.setIsDefault(false); addressRepository.save(a); });
        }
        Address address = Address.builder()
                .user(user).fullName(request.getFullName()).phone(request.getPhone())
                .province(request.getProvince()).district(request.getDistrict())
                .ward(request.getWard()).detail(request.getDetail())
                .isDefault(request.getIsDefault()).build();
        return ResponseEntity.ok(toResponse(addressRepository.save(address)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AddressResponse> update(@PathVariable Long id, @Valid @RequestBody AddressRequest request,
                                                   @AuthenticationPrincipal UserDetails ud) {
        Address address = addressRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Address not found"));
        if (request.getIsDefault()) {
            User user = userRepository.findByEmail(ud.getUsername()).get();
            addressRepository.findByUserIdAndIsDefaultTrue(user.getId())
                    .ifPresent(a -> { a.setIsDefault(false); addressRepository.save(a); });
        }
        address.setFullName(request.getFullName()); address.setPhone(request.getPhone());
        address.setProvince(request.getProvince()); address.setDistrict(request.getDistrict());
        address.setWard(request.getWard()); address.setDetail(request.getDetail());
        address.setIsDefault(request.getIsDefault());
        return ResponseEntity.ok(toResponse(addressRepository.save(address)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        addressRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    private AddressResponse toResponse(Address a) {
        return AddressResponse.builder().id(a.getId()).fullName(a.getFullName()).phone(a.getPhone())
                .province(a.getProvince()).district(a.getDistrict()).ward(a.getWard())
                .detail(a.getDetail()).isDefault(a.getIsDefault()).build();
    }
}
