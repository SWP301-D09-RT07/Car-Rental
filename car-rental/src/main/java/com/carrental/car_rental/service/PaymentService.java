package com.carrental.car_rental.service;

import com.carrental.car_rental.config.VNPayConfig;
import com.carrental.car_rental.dto.PaymentDTO;
import com.carrental.car_rental.dto.PaymentResponseDTO;
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
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

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
    private final PaymentRepository repository;
    private final PaymentMapper mapper;
    private final BookingRepository bookingRepository;
    private final RegionRepository regionRepository;
    private final StatusRepository statusRepository;
    private final VNPayConfig vnPayConfig;

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
        Region region = regionRepository.findByCurrencyAndIsDeletedFalse(dto.getCurrency())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid currency: " + dto.getCurrency()));
        Status status = statusRepository.findByStatusName("pending")
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Status 'pending' not found"));

        entity.setBooking(booking);
        entity.setRegion(region);
        entity.setPaymentStatus(status);
        entity.setIsDeleted(false);
        entity.setPaymentDate(Instant.now());
        return mapper.toDTO(repository.save(entity));
    }

    public PaymentResponseDTO processPayment(PaymentDTO dto, HttpServletRequest request) throws UnsupportedEncodingException {
        logger.info("Processing payment for booking ID: {}", dto.getBookingId());
        if (!List.of("vnpay", "cash").contains(dto.getPaymentMethod())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid payment method: " + dto.getPaymentMethod());
        }
        if (dto.getCurrency() == null || !dto.getCurrency().equals("VND")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only VND currency is supported");
        }

        Booking booking = bookingRepository.findById(dto.getBookingId())
                .filter(b -> !b.getIsDeleted())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking not found"));
        Region region = regionRepository.findByCurrencyAndIsDeletedFalse(dto.getCurrency())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Region with currency VND not found"));
        Status pendingStatus = statusRepository.findByStatusName("pending")
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Status 'pending' not found"));
        Status successStatus = statusRepository.findByStatusName("success")
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Status 'success' not found"));

        Payment payment = mapper.toEntity(dto);
        payment.setBooking(booking);
        payment.setRegion(region);
        payment.setIsDeleted(false);
        payment.setPaymentDate(Instant.now());

        PaymentResponseDTO response = new PaymentResponseDTO();
        if ("vnpay".equals(dto.getPaymentMethod())) {
            String paymentId = "PAY_" + System.nanoTime();
            payment.setTransactionId(paymentId);
            payment.setPaymentStatus(pendingStatus);

            String redirectUrl = createVnpayPaymentUrl(request, paymentId, dto.getAmount().longValue(), dto.getBookingId());
            Payment savedPayment = repository.save(payment);

            response.setPaymentId(savedPayment.getId());
            response.setBookingId(savedPayment.getBooking().getId());
            response.setAmount(savedPayment.getAmount());
            response.setCurrency(savedPayment.getRegion().getCurrency());
            response.setTransactionId(savedPayment.getTransactionId());
            response.setPaymentMethod(savedPayment.getPaymentMethod());
            response.setStatus(savedPayment.getPaymentStatus().getStatusName());
            response.setRedirectUrl(redirectUrl);
            response.setPaymentDate(LocalDateTime.from(savedPayment.getPaymentDate().atZone(ZoneId.systemDefault())));
        } else {
            payment.setPaymentStatus(successStatus);
            Payment savedPayment = repository.save(payment);
            try {
                sendBookingConfirmationEmail(savedPayment);
            } catch (MessagingException e) {
                logger.error("Failed to send confirmation email: {}", e.getMessage(), e);
            }

            response.setPaymentId(savedPayment.getId());
            response.setBookingId(savedPayment.getBooking().getId());
            response.setAmount(savedPayment.getAmount());
            response.setCurrency(savedPayment.getRegion().getCurrency());
            response.setTransactionId(savedPayment.getTransactionId());
            response.setPaymentMethod(savedPayment.getPaymentMethod());
            response.setStatus(savedPayment.getPaymentStatus().getStatusName());
            response.setPaymentDate(LocalDateTime.from(savedPayment.getPaymentDate().atZone(ZoneId.systemDefault())));
        }

        return response;
    }

    public void handlePaymentCallback(HttpServletRequest request) throws UnsupportedEncodingException {
        Map<String, String> vnp_Params = new HashMap<>();
        for (Enumeration<String> params = request.getParameterNames(); params.hasMoreElements();) {
            String paramName = params.nextElement();
            String paramValue = request.getParameter(paramName);
            vnp_Params.put(paramName, paramValue);
        }

        logger.info("VNPay callback parameters: {}", vnp_Params);
        String vnp_TxnRef = vnp_Params.get("vnp_TxnRef");
        String vnp_ResponseCode = vnp_Params.get("vnp_ResponseCode");
        String vnp_SecureHash = vnp_Params.remove("vnp_SecureHash");

        if (vnp_SecureHash == null || vnp_SecureHash.isEmpty()) {
            logger.warn("vnp_SecureHash is missing in callback response.");
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid callback: missing secure hash");
        }

        String signValue = vnPayConfig.hashAllFields(vnp_Params);
        if (!signValue.equals(vnp_SecureHash)) {
            logger.warn("Hash validation failed. Calculated: {}, Received: {}", signValue, vnp_SecureHash);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid callback: hash validation failed");
        }

        Payment payment = repository.findByTransactionIdAndIsDeletedFalse(vnp_TxnRef)
                .filter(p -> !p.getIsDeleted())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment not found for TxnRef: " + vnp_TxnRef));

        Status status = statusRepository.findByStatusName("00".equals(vnp_ResponseCode) ? "success" : "failed")
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Status not found"));
        payment.setPaymentStatus(status);
        repository.save(payment);

        if ("00".equals(vnp_ResponseCode)) {
            try {
                sendBookingConfirmationEmail(payment);
            } catch (MessagingException e) {
                logger.error("Failed to send confirmation email: {}", e.getMessage(), e);
            }
        }
    }

    private String createVnpayPaymentUrl(HttpServletRequest request, String paymentId, long amount, Integer bookingId) throws UnsupportedEncodingException {
        String vnp_Version = VNPayConfig.VNP_VERSION;
        String vnp_Command = VNPayConfig.VNP_COMMAND;
        String vnp_OrderInfo = "Thanh toán cọc đặt xe #" + bookingId;
        String vnp_OrderType = VNPayConfig.VNP_ORDER_TYPE;
        String vnp_Amount = String.valueOf(amount * 100);
        String vnp_IpAddr = vnPayConfig.getIpAddress(request);
        String vnp_TxnRef = paymentId;
        String vnp_CreateDate = new SimpleDateFormat("yyyyMMddHHmmss").format(new Date());
        String vnp_Locale = VNPayConfig.VNP_LOCALE;
        String vnp_CurrCode = VNPayConfig.VNP_CURRENCY_CODE;

        Map<String, String> vnp_Params = new HashMap<>();
        vnp_Params.put("vnp_Version", vnp_Version);
        vnp_Params.put("vnp_Command", vnp_Command);
        vnp_Params.put("vnp_TmnCode", vnPayConfig.VNP_TMN_CODE);
        vnp_Params.put("vnp_Amount", vnp_Amount);
        vnp_Params.put("vnp_CurrCode", vnp_CurrCode);
        vnp_Params.put("vnp_TxnRef", vnp_TxnRef);
        vnp_Params.put("vnp_OrderInfo", vnp_OrderInfo);
        vnp_Params.put("vnp_OrderType", vnp_OrderType);
        vnp_Params.put("vnp_Locale", vnp_Locale);
        vnp_Params.put("vnp_ReturnUrl", vnPayConfig.VNP_RETURN_URL);
        vnp_Params.put("vnp_IpAddr", vnp_IpAddr);
        vnp_Params.put("vnp_CreateDate", vnp_CreateDate);

        StringBuilder hashData = new StringBuilder();
        StringBuilder query = new StringBuilder();
        List<String> fieldNames = new ArrayList<>(vnp_Params.keySet());
        Collections.sort(fieldNames);

        for (String fieldName : fieldNames) {
            String fieldValue = vnp_Params.get(fieldName);
            if (fieldValue != null && !fieldValue.isEmpty()) {
                String encodedValue = URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII.toString());
                hashData.append(fieldName).append("=").append(encodedValue);
                query.append(fieldName).append("=").append(encodedValue);
                if (fieldNames.indexOf(fieldName) < fieldNames.size() - 1) {
                    hashData.append("&");
                    query.append("&");
                }
            }
        }

        logger.info("Hash data for payment URL: {}", hashData.toString());
        String vnp_SecureHash = vnPayConfig.hmacSHA512(vnPayConfig.VNP_SECRET_KEY, hashData.toString());
        query.append("&vnp_SecureHash=").append(vnp_SecureHash);
        String paymentUrl = vnPayConfig.VNP_PAY_URL + "?" + query.toString();
        logger.info("Generated payment URL: {}", paymentUrl);

        return paymentUrl;
    }

    private void sendBookingConfirmationEmail(Payment payment) throws MessagingException {
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
        String paymentMethod = payment.getPaymentMethod().equals("vnpay") ? "Thanh toán qua VNPay" : "Tiền mặt";
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
}