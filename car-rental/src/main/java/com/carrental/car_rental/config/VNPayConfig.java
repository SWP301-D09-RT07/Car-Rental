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
import java.net.URLEncoder;
import java.io.UnsupportedEncodingException;

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

        logger.info("Starting hash generation for {} fields (Reference Logic)", fields.size());

        List<String> fieldNames = new ArrayList<>(fields.keySet());
        Collections.sort(fieldNames);
        StringBuilder dataToHash = new StringBuilder();

        try {
            for (String fieldName : fieldNames) {
                String fieldValue = fields.get(fieldName);
                if (fieldValue != null && !fieldValue.isEmpty() && !fieldName.equals("vnp_SecureHash")) {
                    // Applying reference logic: URL-encode the value before hashing
                    String encodedValue = URLEncoder.encode(fieldValue, StandardCharsets.UTF_8.toString());
                    if (dataToHash.length() > 0) {
                        dataToHash.append("&");
                    }
                    dataToHash.append(fieldName).append("=").append(encodedValue);
                    logger.debug("Added field to hash: {}={}", fieldName, encodedValue);
                } else {
                    logger.debug("Skipped field: {} (value: {})", fieldName, fieldValue);
                }
            }

            String data = dataToHash.toString();
            logger.info("Data to hash ({} characters): {}", data.length(), data);

            if (data.isEmpty()) {
                logger.error("No valid fields found for hashing");
                throw new IllegalArgumentException("No valid fields found for hashing");
            }

            String hash = hmacSHA512(VNP_SECRET_KEY, data);
            logger.info("Hash generated successfully (Reference Logic): {}", hash);
            return hash;
        } catch (UnsupportedEncodingException e) {
            logger.error("Failed to URL-encode field values: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to generate hash due to encoding error: " + e.getMessage(), e);
        } catch (Exception e) {
            logger.error("Failed to generate hash: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to generate hash: " + e.getMessage(), e);
        }
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
            if (ipAddress == null || ipAddress.isEmpty() || "unknown".equalsIgnoreCase(ipAddress)) {
                ipAddress = request.getHeader("Proxy-Client-IP");
            }
            if (ipAddress == null || ipAddress.isEmpty() || "unknown".equalsIgnoreCase(ipAddress)) {
                ipAddress = request.getHeader("WL-Proxy-Client-IP");
            }
            if (ipAddress == null || ipAddress.isEmpty() || "unknown".equalsIgnoreCase(ipAddress)) {
                ipAddress = request.getRemoteAddr();
                if ("0:0:0:0:0:0:0:1".equals(ipAddress) || "::1".equals(ipAddress)) {
                    ipAddress = "127.0.0.1";
                }
            }
            // For multiple IPs in X-FORWARDED-FOR, take the first one
            if (ipAddress != null && ipAddress.contains(",")) {
                ipAddress = ipAddress.split(",")[0].trim();
            }
            logger.info("Client IP Address: {}", ipAddress);
        } catch (Exception e) {
            ipAddress = "127.0.0.1"; // Fallback IP
            logger.error("Error getting IP address: {}. Defaulting to {}", e.getMessage(), ipAddress, e);
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