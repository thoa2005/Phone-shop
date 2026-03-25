package com.phoneshop.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "vnpay")
@Getter @Setter
public class VNPayConfig {
    private String tmnCode = "DEMO_TMN";
    private String hashSecret = "DEMO_HASH_SECRET";
    private String payUrl = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
    private String returnUrl = "http://localhost:3000/checkout/vnpay-return";
    private String apiUrl = "https://sandbox.vnpayment.vn/merchant_webapi/api/transaction";
}
