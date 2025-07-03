package com.carrental.car_rental.service;

import com.carrental.car_rental.config.VNPayConfig;
import com.carrental.car_rental.config.MoMoConfig;
import com.carrental.car_rental.dto.*;
import com.carrental.car_rental.entity.Booking;
import com.carrental.car_rental.entity.Payment;
import com.carrental.car_rental.entity.Region;
import com.carrental.car_rental.entity.Status;
import com.carrental.car_rental.mapper.PaymentMapper;
import com.carrental.car_rental.repository.BookingRepository;
import com.carrental.car_rental.repository.PaymentRepository;
import com.carrental.car_rental.repository.RegionRepository;
import com.carrental.car_rental.repository.StatusRepository;
import jakarta.mail.*;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeBodyPart;
import jakarta.mail.internet.MimeMessage;
import jakarta.mail.internet.MimeMultipart;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.carrental.car_rental.service.BookingFinancialsService;
import com.carrental.car_rental.entity.User;
import com.carrental.car_rental.repository.UserRepository;
import com.carrental.car_rental.mapper.BookingMapper;

import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PaymentService {
    private static final Logger logger = LoggerFactory.getLogger(PaymentService.class);
    public final PaymentRepository repository;
    private final PaymentMapper mapper;
    private final BookingRepository bookingRepository;
    private final RegionRepository regionRepository;
    public final StatusRepository statusRepository;
    private final VNPayConfig vnPayConfig;
    public final MoMoConfig moMoConfig;
    private final BookingService bookingService;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final BookingFinancialsService bookingFinancialsService;
    private final UserRepository userRepository;
    private final BookingMapper bookingMapper;

    @Value("${email.from}")
    private String fromEmail;
    @Value("${email.app-password}")
    private String appPassword;

    public PaymentDTO findById(Integer id) {
        Payment entity = repository.findById(id)
                .filter(e -> !e.getIsDeleted())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment not found with id: " + id));
        return mapper.toDTO(entity);
    }

    public List<PaymentDTO> findAll() {
        return repository.findAll().stream()
                .filter(e -> !e.getIsDeleted())
                .map(mapper::toDTO)
                .collect(Collectors.toList());
    }

    public List<PaymentDTO> findByBookingId(Integer bookingId) {
        return repository.findByBookingIdAndIsDeletedFalse(bookingId).stream()
                .map(mapper::toDTO)
                .collect(Collectors.toList());
    }

    public PaymentDTO save(PaymentDTO dto) {
        Payment entity = mapper.toEntity(dto);
        Booking booking = bookingRepository.findById(dto.getBookingId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking not found"));
        
        // Xử lý trường hợp có nhiều Region với cùng currency
        Region region;
        try {
            region = regionRepository.findByCurrencyAndIsDeletedFalse(dto.getCurrency())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Region with currency VND not found"));
        } catch (Exception e) {
            // Nếu có nhiều kết quả, lấy Region đầu tiên
            List<Region> regions = regionRepository.findAll().stream()
                    .filter(r -> r.getCurrency().equals(dto.getCurrency()) && !r.getIsDeleted())
                    .toList();
            if (regions.isEmpty()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Region with currency VND not found");
            }
            region = regions.get(0);
            logger.info("Multiple regions found for currency {}, using first one: {}", dto.getCurrency(), region.getRegionName());
        }
        
        Status status = statusRepository.findByStatusName("pending")
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Status 'pending' not found"));

        entity.setBooking(booking);
        entity.setRegion(region);
        entity.setPaymentStatus(status);
        entity.setIsDeleted(false);
        entity.setPaymentDate(Instant.now());
        return mapper.toDTO(repository.save(entity));
    }

    public PaymentResponseDTO processPayment(PaymentDTO dto, HttpServletRequest request) {
        logger.info("Processing payment for booking ID: {}", dto.getBookingId());
        if (!List.of("vnpay", "cash", "momo").contains(dto.getPaymentMethod())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Chỉ hỗ trợ thanh toán qua VNPay, tiền mặt hoặc MoMo.");
        }
        if (dto.getAmount() == null || dto.getAmount().intValue() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Số tiền thanh toán phải lớn hơn 0.");
        }
        if (dto.getCurrency() == null || !dto.getCurrency().equals("VND")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Chỉ hỗ trợ thanh toán bằng VND");
        }

        Booking booking = bookingRepository.findById(dto.getBookingId())
                .filter(b -> !b.getIsDeleted())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking not found"));
        
        // Xử lý trường hợp có nhiều Region với cùng currency
        Region region;
        try {
            region = regionRepository.findByCurrencyAndIsDeletedFalse(dto.getCurrency())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Region with currency VND not found"));
        } catch (Exception e) {
            // Nếu có nhiều kết quả, lấy Region đầu tiên
            List<Region> regions = regionRepository.findAll().stream()
                    .filter(r -> r.getCurrency().equals(dto.getCurrency()) && !r.getIsDeleted())
                    .toList();
            if (regions.isEmpty()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Region with currency VND not found");
            }
            region = regions.get(0);
            logger.info("Multiple regions found for currency {}, using first one: {}", dto.getCurrency(), region.getRegionName());
        }
        
        Status pendingStatus = statusRepository.findByStatusName("pending")
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Status 'pending' not found"));
        Status paidStatus = statusRepository.findByStatusName("paid")
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Status 'paid' not found"));

        Payment payment = new Payment();
        payment.setBooking(booking);
        payment.setRegion(region);
        payment.setAmount(dto.getAmount());
        payment.setPaymentMethod(dto.getPaymentMethod());
        payment.setIsDeleted(false);
        payment.setPaymentDate(Instant.now());
        payment.setPaymentType(dto.getPaymentType() != null ? dto.getPaymentType() : "deposit");

        PaymentResponseDTO response = new PaymentResponseDTO();
        if ("vnpay".equals(dto.getPaymentMethod())) {
            String paymentId = "PAY_" + System.nanoTime();
            payment.setTransactionId(paymentId);
            payment.setPaymentStatus(pendingStatus);
            payment.setPaymentMethod("vnpay");

            try {
                String redirectUrl = createVnpayPaymentUrl(request, paymentId, dto.getAmount().longValue(), dto.getBookingId());
                Payment savedPayment = repository.save(payment);

                // Lấy thông tin tài chính booking
                BookingDTO bookingDTO = bookingMapper.toDTO(savedPayment.getBooking());
                BookingFinancialsDTO financials = bookingFinancialsService.getOrCreateFinancials(bookingDTO);
                PriceBreakdownDTO priceBreakdown = bookingFinancialsService.calculatePriceBreakdown(bookingDTO);

                response.setPaymentId(savedPayment.getId());
                response.setBookingId(savedPayment.getBooking().getId());
                response.setAmount(savedPayment.getAmount());
                response.setCurrency(savedPayment.getRegion().getCurrency());
                response.setTransactionId(savedPayment.getTransactionId());
                response.setPaymentMethod(savedPayment.getPaymentMethod());
                response.setStatus(savedPayment.getPaymentStatus().getStatusName());
                response.setRedirectUrl(redirectUrl);
                response.setPaymentDate(LocalDateTime.from(savedPayment.getPaymentDate().atZone(ZoneId.systemDefault())));
                response.setTotalAmount(financials != null ? financials.getTotalFare() : null);
                response.setPriceBreakdown(priceBreakdown);
            } catch (UnsupportedEncodingException e) {
                logger.error("Failed to create VNPay payment URL", e);
                throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Lỗi tạo URL thanh toán VNPay");
            }
        } else if ("momo".equals(dto.getPaymentMethod())) {
            String orderId = moMoConfig.partnerCode + System.currentTimeMillis();
            payment.setTransactionId(orderId);
            payment.setPaymentStatus(pendingStatus);
            payment.setPaymentMethod("momo");
            Payment savedPayment = repository.save(payment);

            String payUrl = createMomoPaymentUrlWithOrderId(savedPayment, orderId);

            // Lấy thông tin tài chính booking
            BookingDTO bookingDTO = bookingMapper.toDTO(savedPayment.getBooking());
            BookingFinancialsDTO financials = bookingFinancialsService.getOrCreateFinancials(bookingDTO);
            PriceBreakdownDTO priceBreakdown = bookingFinancialsService.calculatePriceBreakdown(bookingDTO);

            response.setPaymentId(savedPayment.getId());
            response.setBookingId(savedPayment.getBooking().getId());
            response.setAmount(savedPayment.getAmount());
            response.setCurrency(savedPayment.getRegion().getCurrency());
            response.setTransactionId(savedPayment.getTransactionId());
            response.setPaymentMethod(savedPayment.getPaymentMethod());
            response.setStatus(savedPayment.getPaymentStatus().getStatusName());
            response.setRedirectUrl(payUrl);
            response.setPaymentDate(LocalDateTime.from(savedPayment.getPaymentDate().atZone(ZoneId.systemDefault())));
            response.setTotalAmount(financials != null ? financials.getTotalFare() : null);
            response.setPriceBreakdown(priceBreakdown);
            return response;
        } else if ("cash".equals(dto.getPaymentMethod())) {
            // Xử lý thanh toán tiền mặt
            String paymentId = "CASH_" + System.nanoTime();
            payment.setTransactionId(paymentId);
            payment.setPaymentStatus(pendingStatus); // Để trạng thái là pending
            payment.setPaymentMethod("cash");
            payment.setAmount(java.math.BigDecimal.ZERO); // Số tiền đã thanh toán là 0
            Payment savedPayment = repository.save(payment);

            // Lấy thông tin tài chính booking
            BookingDTO bookingDTO = bookingMapper.toDTO(savedPayment.getBooking());
            BookingFinancialsDTO financials = bookingFinancialsService.getOrCreateFinancials(bookingDTO);
            PriceBreakdownDTO priceBreakdown = bookingFinancialsService.calculatePriceBreakdown(bookingDTO);

            // Gửi email xác nhận cho thanh toán tiền mặt
            try {
                sendBookingConfirmationEmail(savedPayment);
            } catch (Exception e) {
                logger.error("Failed to send confirmation email for cash payment", e);
                // Không throw exception vì payment đã được tạo thành công
            }

            response.setPaymentId(savedPayment.getId());
            response.setBookingId(savedPayment.getBooking().getId());
            response.setAmount(savedPayment.getAmount());
            response.setCurrency(savedPayment.getRegion().getCurrency());
            response.setTransactionId(savedPayment.getTransactionId());
            response.setPaymentMethod(savedPayment.getPaymentMethod());
            response.setStatus(savedPayment.getPaymentStatus().getStatusName());
            response.setPaymentDate(java.time.LocalDateTime.from(savedPayment.getPaymentDate().atZone(java.time.ZoneId.systemDefault())));
            response.setTotalAmount(financials != null ? financials.getTotalFare() : null);
            response.setPriceBreakdown(priceBreakdown);
        }

        return response;
    }

    @Transactional
    public String handlePaymentCallback(HttpServletRequest request) throws UnsupportedEncodingException {
        logger.info("Processing VNPay callback request");
        
        Map<String, String> vnp_Params = new HashMap<>();
        for (Enumeration<String> params = request.getParameterNames(); params.hasMoreElements();) {
            String paramName = params.nextElement();
            String paramValue = request.getParameter(paramName);
            vnp_Params.put(paramName, paramValue);
        }

        logger.info("VNPay callback parameters received: {}", vnp_Params);
        
        String vnp_TxnRef = vnp_Params.get("vnp_TxnRef");
        String vnp_ResponseCode = vnp_Params.get("vnp_ResponseCode");
        String vnp_SecureHash = vnp_Params.remove("vnp_SecureHash");

        if (vnp_SecureHash == null || vnp_SecureHash.isEmpty()) {
            logger.error("vnp_SecureHash is missing in callback response");
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid callback: missing secure hash");
        }

        logger.info("Validating VNPay callback - TxnRef: {}, ResponseCode: {}, SecureHash: {}", 
                   vnp_TxnRef, vnp_ResponseCode, vnp_SecureHash);

        try {
            String signValue = vnPayConfig.hashAllFields(vnp_Params);
            logger.info("Calculated hash: {}, Received hash: {}", signValue, vnp_SecureHash);
            
            if (!signValue.equals(vnp_SecureHash)) {
                logger.error("Hash validation failed. Calculated: {}, Received: {}", signValue, vnp_SecureHash);
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid callback: hash validation failed");
            }
            
            logger.info("Hash validation successful");
            
        } catch (Exception e) {
            logger.error("Error during hash validation: {}", e.getMessage(), e);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Error validating callback signature: " + e.getMessage());
        }

        Payment payment = repository.findByTransactionIdAndIsDeletedFalse(vnp_TxnRef)
                .filter(p -> !p.getIsDeleted())
                .orElseThrow(() -> {
                    logger.error("Payment not found for TxnRef: {}", vnp_TxnRef);
                    return new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment not found for TxnRef: " + vnp_TxnRef);
                });

        logger.info("Payment found for TxnRef: {}, current status: {}", vnp_TxnRef, payment.getPaymentStatus().getStatusName());

        Status status = statusRepository.findByStatusName("00".equals(vnp_ResponseCode) ? "paid" : "failed")
                .orElseThrow(() -> {
                    logger.error("Status not found for response code: {}", vnp_ResponseCode);
                    return new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Status not found");
                });
        
        payment.setPaymentStatus(status);
        
        // Update payment method to 'vnpay' for consistency
        payment.setPaymentMethod("vnpay");
        repository.save(payment);
        
        logger.info("Payment status updated to: {}", status.getStatusName());

        if ("00".equals(vnp_ResponseCode)) {
            try {
                sendBookingConfirmationEmail(payment);
                logger.info("Payment successful for TxnRef: {}, confirmation email sent", vnp_TxnRef);
            } catch (MessagingException e) {
                logger.error("Failed to send confirmation email for TxnRef: {}", vnp_TxnRef, e);
                // Không throw exception vì thanh toán đã thành công
            }
        } else {
            logger.warn("Payment failed for TxnRef: {}, response code: {}", vnp_TxnRef, vnp_ResponseCode);
        }
        
        return vnp_TxnRef;
    }

    private String createVnpayPaymentUrl(HttpServletRequest request, String paymentId, long amount, Integer bookingId) throws UnsupportedEncodingException {
        logger.info("Creating VNPay payment URL for payment ID: {}, amount: {}, booking ID: {}", paymentId, amount, bookingId);
        
        String vnp_Version = "2.1.0";
        String vnp_Command = "pay";
        String vnp_OrderType = "250000";
        String vnp_TmnCode = vnPayConfig.VNP_TMN_CODE;
        String vnp_Amount = String.valueOf(amount * 100);
        String vnp_CurrCode = "VND";
        String vnp_IpAddr = vnPayConfig.getIpAddress(request);
        String vnp_Locale = "vn";
        String vnp_ReturnUrl = vnPayConfig.VNP_RETURN_URL;
        String vnp_TxnRef = paymentId;
        String vnp_OrderInfo = "Thanh toan don hang:" + vnp_TxnRef;

        Map<String, String> vnp_Params = new HashMap<>();
        vnp_Params.put("vnp_Version", vnp_Version);
        vnp_Params.put("vnp_Command", vnp_Command);
        vnp_Params.put("vnp_TmnCode", vnp_TmnCode);
        vnp_Params.put("vnp_Amount", vnp_Amount);
        vnp_Params.put("vnp_CurrCode", vnp_CurrCode);
        vnp_Params.put("vnp_TxnRef", vnp_TxnRef);
        vnp_Params.put("vnp_OrderInfo", vnp_OrderInfo);
        vnp_Params.put("vnp_OrderType", vnp_OrderType);
        vnp_Params.put("vnp_Locale", vnp_Locale);
        vnp_Params.put("vnp_ReturnUrl", vnp_ReturnUrl);
        vnp_Params.put("vnp_IpAddr", vnp_IpAddr);

        Calendar cld = Calendar.getInstance(TimeZone.getTimeZone("Etc/GMT+7"));
        SimpleDateFormat formatter = new SimpleDateFormat("yyyyMMddHHmmss");
        String vnp_CreateDate = formatter.format(cld.getTime());
        vnp_Params.put("vnp_CreateDate", vnp_CreateDate);

        cld.add(Calendar.MINUTE, 15);
        String vnp_ExpireDate = formatter.format(cld.getTime());
        vnp_Params.put("vnp_ExpireDate", vnp_ExpireDate);

        logger.info("VNPay parameters prepared: {}", vnp_Params);

        try {
            // Sử dụng phương thức hashAllFields từ VNPayConfig
            String vnp_SecureHash = vnPayConfig.hashAllFields(vnp_Params);
            logger.info("VNPay SecureHash generated successfully: {}", vnp_SecureHash);

            // Tạo query string
            List<String> fieldNames = new ArrayList<>(vnp_Params.keySet());
            Collections.sort(fieldNames);
            StringBuilder query = new StringBuilder();
            Iterator<String> itr = fieldNames.iterator();
            while (itr.hasNext()) {
                String fieldName = itr.next();
                String fieldValue = vnp_Params.get(fieldName);
                if ((fieldValue != null) && (fieldValue.length() > 0)) {
                    query.append(URLEncoder.encode(fieldName, StandardCharsets.UTF_8.toString()));
                    query.append('=');
                    query.append(URLEncoder.encode(fieldValue, StandardCharsets.UTF_8.toString()));
                    if (itr.hasNext()) {
                        query.append('&');
                    }
                }
            }
            
            String queryUrl = query.toString();
            queryUrl += "&vnp_SecureHash=" + vnp_SecureHash;
            String paymentUrl = vnPayConfig.VNP_PAY_URL + "?" + queryUrl;
            
            logger.info("VNPay payment URL generated successfully: {}", paymentUrl);
            return paymentUrl;
            
        } catch (Exception e) {
            logger.error("Error generating VNPay payment URL: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to generate VNPay payment URL: " + e.getMessage(), e);
        }
    }

    private String createMomoPaymentUrlWithOrderId(Payment payment, String orderId) {
        try {
            String requestId = orderId;
            String amount = payment.getAmount().toBigInteger().toString();
            String orderInfo = "Thanh toan don hang #" + orderId;
            String extraData = "";

            String rawSignature = "accessKey=" + moMoConfig.accessKey +
                    "&amount=" + amount +
                    "&extraData=" + extraData +
                    "&ipnUrl=" + moMoConfig.ipnUrl +
                    "&orderId=" + orderId +
                    "&orderInfo=" + orderInfo +
                    "&partnerCode=" + moMoConfig.partnerCode +
                    "&redirectUrl=" + moMoConfig.redirectUrl +
                    "&requestId=" + requestId +
                    "&requestType=captureWallet";

            logger.info("[MoMo] rawSignature: {}", rawSignature);

            String signature = hmacSHA256Utf8(rawSignature, moMoConfig.secretKey);
            logger.info("[MoMo] signature: {}", signature);

            Map<String, Object> body = new HashMap<>();
            body.put("partnerCode", moMoConfig.partnerCode);
            body.put("accessKey", moMoConfig.accessKey);
            body.put("requestId", requestId);
            body.put("amount", amount);
            body.put("orderId", orderId);
            body.put("orderInfo", orderInfo);
            body.put("redirectUrl", moMoConfig.redirectUrl);
            body.put("ipnUrl", moMoConfig.ipnUrl);
            body.put("extraData", extraData);
            body.put("requestType", "captureWallet");
            body.put("signature", signature);
            body.put("lang", "vi");

            RestTemplate restTemplate = new RestTemplate();
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<String> entity = new HttpEntity<>(objectMapper.writeValueAsString(body), headers);

            ResponseEntity<Map> response = restTemplate.postForEntity(moMoConfig.endpoint, entity, Map.class);
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                return (String) response.getBody().get("payUrl");
            } else {
                throw new RuntimeException("Không lấy được payUrl từ MoMo");
            }
        } catch (Exception e) {
            throw new RuntimeException("Lỗi tạo URL thanh toán MoMo: " + e.getMessage(), e);
        }
    }

    // Đảm bảo encoding UTF-8 khi ký
    private String hmacSHA256Utf8(String data, String key) throws Exception {
        javax.crypto.Mac mac = javax.crypto.Mac.getInstance("HmacSHA256");
        javax.crypto.spec.SecretKeySpec secretKeySpec = new javax.crypto.spec.SecretKeySpec(key.getBytes(java.nio.charset.StandardCharsets.UTF_8), "HmacSHA256");
        mac.init(secretKeySpec);
        byte[] hash = mac.doFinal(data.getBytes(java.nio.charset.StandardCharsets.UTF_8));
        StringBuilder sb = new StringBuilder();
        for (byte b : hash) sb.append(String.format("%02x", b));
        return sb.toString();
    }

    public void sendBookingConfirmationEmail(Payment payment) throws MessagingException {
        Properties props = new Properties();
        props.put("mail.smtp.host", "smtp.gmail.com");
        props.put("mail.smtp.port", "587");
        props.put("mail.smtp.auth", "true");
        props.put("mail.smtp.starttls.enable", "true");

        Session session = Session.getInstance(props, new Authenticator() {
            @Override
            protected PasswordAuthentication getPasswordAuthentication() {
                return new PasswordAuthentication(fromEmail, appPassword);
            }
        });

        String toEmail = payment.getBooking().getCustomer().getEmail();
        String username = payment.getBooking().getCustomer().getUsername();
        String subject = "Xác nhận thanh toán đặt xe thành công";

        String bookingId = payment.getBooking().getId().toString();
        String totalPrice = formatPrice(payment.getAmount());
        String paymentDate = new SimpleDateFormat("dd/MM/yyyy HH:mm:ss").format(new Date());
        String carModel = payment.getBooking().getCar().getModel();
        String pickupLocation = payment.getBooking().getPickupLocation();
        String dropoffLocation = payment.getBooking().getDropoffLocation();
        String paymentMethod;
        if (payment.getPaymentMethod().equals("vnpay")) {
            paymentMethod = "Thanh toán qua VNPay";
        } else if (payment.getPaymentMethod().equals("momo")) {
            paymentMethod = "Thanh toán qua MoMo";
        } else {
            paymentMethod = "Tiền mặt";
        }
        String paymentStatus = payment.getPaymentStatus().getStatusName();

        String content = "<html>" +
                "<head>" +
                "<style>" +
                "body { font-family: Arial, sans-serif; color: #333; line-height: 1.6; margin: 0; padding: 0; background-color: #f4f4f4; }" +
                ".container { width: 80%; max-width: 600px; margin: 20px auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1); }" +
                ".header { text-align: center; padding: 20px 0; background-color: #28a745; color: #ffffff; border-radius: 8px 8px 0 0; }" +
                ".header h2 { margin: 0; font-size: 24px; }" +
                ".content { padding: 20px; }" +
                ".content p { margin: 10px 0; }" +
                ".booking-details { margin: 20px 0; }" +
                ".booking-details table { width: 100%; border-collapse: collapse; margin-top: 10px; }" +
                ".booking-details th, .booking-details td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }" +
                ".booking-details th { background-color: #f8f8f8; font-weight: bold; }" +
                ".total { font-size: 18px; font-weight: bold; margin-top: 10px; text-align: right; }" +
                ".footer { text-align: center; padding: 10px 0; color: #777; font-size: 14px; border-top: 1px solid #ddd; margin-top: 20px; }" +
                ".footer a { color: #28a745; text-decoration: none; }" +
                "</style>" +
                "</head>" +
                "<body>" +
                "<div class='container'>" +
                "<p style='color: #777; font-size: 12px;'>Đây không phải thư rác. Vui lòng thêm " + fromEmail + " vào danh bạ để nhận email trong hộp thư đến.</p>" +
                "<div class='header'>" +
                "<h2>Xác nhận thanh toán đặt xe</h2>" +
                "</div>" +
                "<div class='content'>" +
                "<p>Chào <strong>" + username + "</strong>,</p>" +
                "<p>Cảm ơn bạn đã đặt xe tại <strong>RentCar</strong>!</p>" +
                "<p>Chúng tôi đã nhận được thanh toán của bạn và đang xử lý đơn đặt xe.</p>" +
                "<div class='booking-details'>" +
                "<p><strong>Mã đặt xe:</strong> #" + bookingId + "</p>" +
                "<p><strong>Ngày thanh toán:</strong> " + paymentDate + "</p>" +
                "<p><strong>Xe:</strong> " + carModel + "</p>" +
                "<p><strong>Địa điểm nhận xe:</strong> " + pickupLocation + "</p>" +
                "<p><strong>Địa điểm trả xe:</strong> " + dropoffLocation + "</p>" +
                "<p><strong>Phương thức thanh toán:</strong> " + paymentMethod + "</p>" +
                "<p><strong>Trạng thái thanh toán:</strong> " + paymentStatus + "</p>" +
                "<div class='total'>" +
                "Tổng tiền: " + totalPrice + " VNĐ" +
                "</div>" +
                "</div>" +
                "<p>Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ qua email <a href='mailto:support@rentcar.com'>support@rentcar.com</a> hoặc số điện thoại <strong>0123 456 789</strong>.</p>" +
                "<p>Trân trọng,</p>" +
                "<p><strong>RentCar</strong></p>" +
                "</div>" +
                "<div class='footer'>" +
                "<p>© 2025 RentCar. All rights reserved.</p>" +
                "<p><a href='https://rentcar.com'>Truy cập website của chúng tôi</a></p>" +
                "</div>" +
                "</div>" +
                "</body>" +
                "</html>";

        MimeMessage message = new MimeMessage(session);
        message.setFrom(new InternetAddress(fromEmail));
        message.setRecipients(Message.RecipientType.TO, InternetAddress.parse(toEmail));
        message.setSubject(subject);

        String plainText = "Chào " + username + ",\n\nCảm ơn bạn đã đặt xe tại RentCar!\n" +
                "Mã đặt xe: #" + bookingId + "\n" +
                "Ngày thanh toán: " + paymentDate + "\n" +
                "Xe: " + carModel + "\n" +
                "Tổng tiền: " + totalPrice + " VNĐ\n" +
                "Trân trọng,\nRentCar";
        Multipart multipart = new MimeMultipart("alternative");
        MimeBodyPart textPart = new MimeBodyPart();
        textPart.setText(plainText, "UTF-8");
        MimeBodyPart htmlPart = new MimeBodyPart();
        htmlPart.setContent(content, "text/html; charset=UTF-8");
        multipart.addBodyPart(textPart);
        multipart.addBodyPart(htmlPart);
        message.setContent(multipart);

        Transport.send(message);
        logger.info("Confirmation email sent to {} for booking #{}", toEmail, bookingId);
    }

    private String formatPrice(java.math.BigDecimal price) {
        return new java.text.DecimalFormat("#,###").format(price.intValue());
    }

    public PaymentDTO update(Integer id, PaymentDTO dto) {
        Payment entity = repository.findById(id)
                .filter(e -> !e.getIsDeleted())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment not found with id: " + id));
        Payment updatedEntity = mapper.toEntity(dto);
        Booking booking = bookingRepository.findById(dto.getBookingId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking not found"));
        Region region = regionRepository.findByCurrencyAndIsDeletedFalse(dto.getCurrency())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid currency: " + dto.getCurrency()));
        Status status = statusRepository.findByStatusName(dto.getStatusName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid status: " + dto.getStatusName()));

        updatedEntity.setId(id);
        updatedEntity.setBooking(booking);
        updatedEntity.setRegion(region);
        updatedEntity.setPaymentStatus(status);
        updatedEntity.setIsDeleted(false);
        return mapper.toDTO(repository.save(updatedEntity));
    }

    public void delete(Integer id) {
        Payment entity = repository.findById(id)
                .filter(e -> !e.getIsDeleted())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment not found with id: " + id));
        entity.setIsDeleted(true);
        repository.save(entity);
    }

    public Map<String, Object> checkMomoTransactionStatus(String orderId, String requestId) {
        try {
            String rawSignature = "accessKey=" + moMoConfig.accessKey +
                    "&orderId=" + orderId +
                    "&partnerCode=" + moMoConfig.partnerCode +
                    "&requestId=" + requestId;
            logger.info("[MoMo-Query] rawSignature: {}", rawSignature);
            String signature = hmacSHA256Utf8(rawSignature, moMoConfig.secretKey);
            logger.info("[MoMo-Query] signature: {}", signature);

            Map<String, Object> body = new HashMap<>();
            body.put("partnerCode", moMoConfig.partnerCode);
            body.put("requestId", requestId);
            body.put("orderId", orderId);
            body.put("lang", "vi");
            body.put("signature", signature);

            RestTemplate restTemplate = new RestTemplate();
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<String> entity = new HttpEntity<>(objectMapper.writeValueAsString(body), headers);

            ResponseEntity<Map> response = restTemplate.postForEntity(
                    "https://test-payment.momo.vn/v2/gateway/api/query", entity, Map.class);
            logger.info("[MoMo-Query] Response: {}", response.getBody());
            return response.getBody();
        } catch (Exception e) {
            logger.error("[MoMo-Query] Error: {}", e.getMessage(), e);
            throw new RuntimeException("Lỗi kiểm tra trạng thái giao dịch MoMo: " + e.getMessage(), e);
        }
    }

    public Payment findByTransactionId(String transactionId) {
        return repository.findByTransactionIdAndIsDeletedFalse(transactionId).orElse(null);
    }

    public void updatePaymentStatus(Payment payment, String statusName) {
        Status status = statusRepository.findByStatusName(statusName).orElse(null);
        if (status != null) {
            payment.setPaymentStatus(status);
            payment.setPaymentMethod("momo");
            repository.save(payment);
        }
    }

    @Transactional
    public PaymentResponseDTO processPaymentWithBooking(PaymentDTO dto, HttpServletRequest request) {
        logger.info("Processing payment with booking creation for car ID: {}", dto.getCarId());
        
        // Validate payment method
        if (!List.of("vnpay", "cash", "momo").contains(dto.getPaymentMethod())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Chỉ hỗ trợ thanh toán qua VNPay, tiền mặt hoặc MoMo.");
        }
        if (dto.getAmount() == null || dto.getAmount().intValue() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Số tiền thanh toán phải lớn hơn 0.");
        }
        if (dto.getCurrency() == null || !dto.getCurrency().equals("VND")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Chỉ hỗ trợ thanh toán bằng VND");
        }
        
        // Validate booking data
        if (dto.getCarId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Car ID is required");
        }
        // Lấy userId từ token đăng nhập
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        User user = userRepository.findByUsername(username).orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
        Integer userId = user.getId();
        if (dto.getPickupDateTime() == null || dto.getDropoffDateTime() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Pickup and dropoff dates are required");
        }
        if (dto.getPickupDateTime().isAfter(dto.getDropoffDateTime())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Pickup date cannot be after dropoff date");
        }

        // Create booking first
        BookingDTO bookingDTO = new BookingDTO();
        bookingDTO.setCarId(dto.getCarId());
        bookingDTO.setUserId(userId);
        bookingDTO.setPickupDateTime(dto.getPickupDateTime());
        bookingDTO.setDropoffDateTime(dto.getDropoffDateTime());
        bookingDTO.setPickupLocation(dto.getPickupLocation());
        bookingDTO.setDropoffLocation(dto.getDropoffLocation());
        bookingDTO.setSeatNumber(dto.getSeatNumber());
        bookingDTO.setWithDriver(dto.getWithDriver());
        bookingDTO.setDepositAmount(dto.getAmount()); // Set deposit amount from payment

        logger.info("Creating booking with DTO: {}", bookingDTO);
        BookingDTO savedBooking = bookingService.save(bookingDTO);
        logger.info("Booking created successfully with ID: {}", savedBooking.getBookingId());

        // Tạo BookingFinancial ngay sau khi tạo booking
        try {
            bookingFinancialsService.createOrUpdateFinancials(savedBooking);
            logger.info("Created BookingFinancials for booking ID: {}", savedBooking.getBookingId());
        } catch (Exception e) {
            logger.error("Error creating BookingFinancials for booking ID: {}", savedBooking.getBookingId(), e);
            // Không throw để không ảnh hưởng flow payment
        }

        // Get the created booking entity
        Booking booking = bookingRepository.findById(savedBooking.getBookingId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to retrieve created booking"));

        // Xử lý trường hợp có nhiều Region với cùng currency
        Region region;
        try {
            region = regionRepository.findByCurrencyAndIsDeletedFalse(dto.getCurrency())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Region with currency VND not found"));
        } catch (Exception e) {
            // Nếu có nhiều kết quả, lấy Region đầu tiên
            List<Region> regions = regionRepository.findAll().stream()
                    .filter(r -> r.getCurrency().equals(dto.getCurrency()) && !r.getIsDeleted())
                    .toList();
            if (regions.isEmpty()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Region with currency VND not found");
            }
            region = regions.get(0);
            logger.info("Multiple regions found for currency {}, using first one: {}", dto.getCurrency(), region.getRegionName());
        }
        
        Status pendingStatus = statusRepository.findByStatusName("pending")
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Status 'pending' not found"));
        Status paidStatus = statusRepository.findByStatusName("paid")
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Status 'paid' not found"));

        // Create payment
        Payment payment = new Payment();
        payment.setBooking(booking);
        payment.setRegion(region);
        payment.setAmount(dto.getAmount());
        payment.setPaymentMethod(dto.getPaymentMethod());
        payment.setIsDeleted(false);
        payment.setPaymentDate(Instant.now());
        payment.setPaymentType(dto.getPaymentType() != null ? dto.getPaymentType() : "deposit");

        PaymentResponseDTO response = new PaymentResponseDTO();
        
        if ("vnpay".equals(dto.getPaymentMethod())) {
            String paymentId = "PAY_" + System.nanoTime();
            payment.setTransactionId(paymentId);
            payment.setPaymentStatus(pendingStatus);
            payment.setPaymentMethod("vnpay");

            try {
                String redirectUrl = createVnpayPaymentUrl(request, paymentId, dto.getAmount().longValue(), savedBooking.getBookingId());
                Payment savedPayment = repository.save(payment);

                // Lấy thông tin tài chính booking
                bookingDTO = bookingMapper.toDTO(savedPayment.getBooking());
                BookingFinancialsDTO financials = bookingFinancialsService.getOrCreateFinancials(bookingDTO);
                PriceBreakdownDTO priceBreakdown = bookingFinancialsService.calculatePriceBreakdown(bookingDTO);

                response.setPaymentId(savedPayment.getId());
                response.setBookingId(savedPayment.getBooking().getId());
                response.setAmount(savedPayment.getAmount());
                response.setCurrency(savedPayment.getRegion().getCurrency());
                response.setTransactionId(savedPayment.getTransactionId());
                response.setPaymentMethod(savedPayment.getPaymentMethod());
                response.setStatus(savedPayment.getPaymentStatus().getStatusName());
                response.setRedirectUrl(redirectUrl);
                response.setPaymentDate(LocalDateTime.from(savedPayment.getPaymentDate().atZone(ZoneId.systemDefault())));
                response.setTotalAmount(financials != null ? financials.getTotalFare() : null);
                response.setPriceBreakdown(priceBreakdown);
            } catch (UnsupportedEncodingException e) {
                logger.error("Failed to create VNPay payment URL", e);
                throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Lỗi tạo URL thanh toán VNPay");
            }
        } else if ("momo".equals(dto.getPaymentMethod())) {
            String orderId = moMoConfig.partnerCode + System.currentTimeMillis();
            payment.setTransactionId(orderId);
            payment.setPaymentStatus(pendingStatus);
            payment.setPaymentMethod("momo");
            Payment savedPayment = repository.save(payment);

            String payUrl = createMomoPaymentUrlWithOrderId(savedPayment, orderId);

            // Lấy thông tin tài chính booking
            bookingDTO = bookingMapper.toDTO(savedPayment.getBooking());
            BookingFinancialsDTO financials = bookingFinancialsService.getOrCreateFinancials(bookingDTO);
            PriceBreakdownDTO priceBreakdown = bookingFinancialsService.calculatePriceBreakdown(bookingDTO);

            response.setPaymentId(savedPayment.getId());
            response.setBookingId(savedPayment.getBooking().getId());
            response.setAmount(savedPayment.getAmount());
            response.setCurrency(savedPayment.getRegion().getCurrency());
            response.setTransactionId(savedPayment.getTransactionId());
            response.setPaymentMethod(savedPayment.getPaymentMethod());
            response.setStatus(savedPayment.getPaymentStatus().getStatusName());
            response.setRedirectUrl(payUrl);
            response.setPaymentDate(LocalDateTime.from(savedPayment.getPaymentDate().atZone(ZoneId.systemDefault())));
            response.setTotalAmount(financials != null ? financials.getTotalFare() : null);
            response.setPriceBreakdown(priceBreakdown);
        } else if ("cash".equals(dto.getPaymentMethod())) {
            // Xử lý thanh toán tiền mặt
            String paymentId = "CASH_" + System.nanoTime();
            payment.setTransactionId(paymentId);
            payment.setPaymentStatus(pendingStatus); // Để trạng thái là pending
            payment.setPaymentMethod("cash");
            payment.setAmount(java.math.BigDecimal.ZERO); // Số tiền đã thanh toán là 0
            Payment savedPayment = repository.save(payment);

            // Lấy thông tin tài chính booking
            bookingDTO = bookingMapper.toDTO(savedPayment.getBooking());
            BookingFinancialsDTO financials = bookingFinancialsService.getOrCreateFinancials(bookingDTO);
            PriceBreakdownDTO priceBreakdown = bookingFinancialsService.calculatePriceBreakdown(bookingDTO);

            // Gửi email xác nhận cho thanh toán tiền mặt
            try {
                sendBookingConfirmationEmail(savedPayment);
            } catch (Exception e) {
                logger.error("Failed to send confirmation email for cash payment", e);
                // Không throw exception vì payment đã được tạo thành công
            }

            response.setPaymentId(savedPayment.getId());
            response.setBookingId(savedPayment.getBooking().getId());
            response.setAmount(savedPayment.getAmount());
            response.setCurrency(savedPayment.getRegion().getCurrency());
            response.setTransactionId(savedPayment.getTransactionId());
            response.setPaymentMethod(savedPayment.getPaymentMethod());
            response.setStatus(savedPayment.getPaymentStatus().getStatusName());
            response.setPaymentDate(java.time.LocalDateTime.from(savedPayment.getPaymentDate().atZone(java.time.ZoneId.systemDefault())));
            response.setTotalAmount(financials != null ? financials.getTotalFare() : null);
            response.setPriceBreakdown(priceBreakdown);
        }

        logger.info("Payment with booking processed successfully. Booking ID: {}, Payment ID: {}", 
                   response.getBookingId(), response.getPaymentId());
        return response;
    }
}