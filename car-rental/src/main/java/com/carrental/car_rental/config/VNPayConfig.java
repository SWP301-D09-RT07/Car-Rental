package com.carrental.car_rental.config;

import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.*;

@Component
public class VNPayConfig {
    private static final Logger logger = LoggerFactory.getLogger(VNPayConfig.class);

    @Value("${vnpay.url}")
    public String VNP_PAY_URL;
    @Value("${vnpay.returnUrl}")
    public String VNP_RETURN_URL;
    @Value("${vnpay.tmnCode}")
    public String VNP_TMN_CODE;
    @Value("${vnpay.secretKey}")
    public String VNP_SECRET_KEY;
    public static final String VNP_API_URL = "https://sandbox.vnpayment.vn/merchant_webapi/api/transaction";
    public static final String VNP_VERSION = "2.1.0";
    public static final String VNP_COMMAND = "pay";
    public static final String VNP_ORDER_TYPE = "250000";
    public static final String VNP_CURRENCY_CODE = "VND";
    public static final String VNP_LOCALE = "vn";
    public static final int VNP_EXPIRE_MINUTES = 15;

    public String hashAllFields(Map<String, String> fields) {
        if (fields == null || fields.isEmpty()) {
            logger.error("Fields map is null or empty, cannot generate hash.");
            throw new IllegalArgumentException("Fields map cannot be null or empty.");
        }

        List<String> fieldNames = new ArrayList<>(fields.keySet());
        Collections.sort(fieldNames);
        StringBuilder dataToHash = new StringBuilder();
        boolean first = true;
        for (String fieldName : fieldNames) {
            String fieldValue = fields.get(fieldName);
            if (fieldValue != null && !fieldValue.isEmpty() && !fieldName.equals("vnp_SecureHash")) {
                if (!first) {
                    dataToHash.append("&");
                }
                dataToHash.append(fieldName).append("=").append(fieldValue);
                first = false;
            }
        }

        String data = dataToHash.toString();
        logger.info("Data to hash: {}", data);
        String hash = hmacSHA512(VNP_SECRET_KEY, data);
        logger.info("Generated vnp_SecureHash: {}", hash);
        return hash;
    }

    public String hmacSHA512(String key, String data) {
        if (key == null || key.isEmpty()) {
            logger.error("HMAC-SHA512 key is null or empty.");
            throw new IllegalArgumentException("HMAC-SHA512 key cannot be null or empty.");
        }
        if (data == null) {
            logger.error("HMAC-SHA512 data is null.");
            throw new IllegalArgumentException("HMAC-SHA512 data cannot be null.");
        }

        try {
            Mac hmac512 = Mac.getInstance("HmacSHA512");
            byte[] keyBytes = key.getBytes(StandardCharsets.UTF_8);
            SecretKeySpec secretKey = new SecretKeySpec(keyBytes, "HmacSHA512");
            hmac512.init(secretKey);
            byte[] dataBytes = data.getBytes(StandardCharsets.UTF_8);
            byte[] result = hmac512.doFinal(dataBytes);
            StringBuilder hexString = new StringBuilder(result.length * 2);
            for (byte b : result) {
                hexString.append(String.format("%02x", b & 0xFF));
            }
            String hash = hexString.toString();
            logger.info("HMAC-SHA512 hash generated successfully: {}", hash);
            return hash;
        } catch (Exception e) {
            logger.error("Error generating HMAC-SHA512: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to generate HMAC-SHA512 hash: " + e.getMessage(), e);
        }
    }

    public String getIpAddress(HttpServletRequest request) {
        String ipAddress;
        try {
            ipAddress = request.getHeader("X-FORWARDED-FOR");
            if (ipAddress == null || ipAddress.isEmpty()) {
                ipAddress = request.getRemoteAddr();
            }
            logger.info("Client IP Address: {}", ipAddress);
        } catch (Exception e) {
            ipAddress = "Invalid IP: " + e.getMessage();
            logger.error("Error getting IP address: {}", e.getMessage(), e);
        }
        return ipAddress;
    }

    public boolean validateParams(Map<String, String> params) {
        if (params == null || params.isEmpty()) {
            logger.warn("VNPAY parameters are null or empty.");
            return false;
        }

        String[] requiredParams = {
                "vnp_Version", "vnp_Command", "vnp_TmnCode", "vnp_Amount",
                "vnp_CurrCode", "vnp_TxnRef", "vnp_OrderInfo", "vnp_Locale",
                "vnp_ReturnUrl", "vnp_IpAddr", "vnp_CreateDate", "vnp_ExpireDate"
        };

        for (String param : requiredParams) {
            if (!params.containsKey(param) || params.get(param) == null || params.get(param).isEmpty()) {
                logger.warn("Missing or empty required parameter: {}", param);
                return false;
            }
        }

        try {
            long amount = Long.parseLong(params.get("vnp_Amount"));
            if (amount <= 0) {
                logger.warn("vnp_Amount must be greater than 0: {}", amount);
                return false;
            }
        } catch (NumberFormatException e) {
            logger.warn("Invalid vnp_Amount format: {}", params.get("vnp_Amount"));
            return false;
        }

        String vnp_TxnRef = params.get("vnp_TxnRef");
        if (vnp_TxnRef == null || vnp_TxnRef.trim().isEmpty()) {
            logger.warn("vnp_TxnRef must not be empty: {}", vnp_TxnRef);
            return false;
        }

        return true;
    }
}