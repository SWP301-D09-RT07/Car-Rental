package com.carrental.car_rental.security;

import com.carrental.car_rental.config.JwtTokenProvider;
import com.carrental.car_rental.service.CustomUserDetailsService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(JwtAuthenticationFilter.class);
    private static final List<String> PUBLIC_ENDPOINTS = Arrays.asList(
            "/login/oauth2/code/",
            "/oauth2/authorization/",
            "/api/auth/login",
            "/api/auth/register",
            "/api/auth/check-email",
            "/api/languages/",
            "/api/country-codes/",
            "/api/car-brands/",
            "/api/fuel-types/",
            "/api/regions/",
            "/api/cars/",
            "/api/service-types/",
            // "/api/bookings/",
            "/api/ratings/",
            "/api/payments/callback"
    );
    private final JwtTokenProvider jwtTokenProvider;
    private final CustomUserDetailsService userDetailsService;

    public JwtAuthenticationFilter(JwtTokenProvider jwtTokenProvider, CustomUserDetailsService userDetailsService) {
        this.jwtTokenProvider = jwtTokenProvider;
        this.userDetailsService = userDetailsService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        logger.info("=== JWT FILTER - BẮT ĐẦU XỬ LÝ REQUEST ===");
        logger.info("Request URI: {}", request.getRequestURI());
        logger.info("Request method: {}", request.getMethod());
        logger.info("Authorization header: {}", request.getHeader("Authorization"));
        
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            logger.info("OPTIONS request, skipping authentication");
            filterChain.doFilter(request, response);
            return;
        }

        String path = request.getRequestURI();
        logger.info("Request path: {}", path);
        String method = request.getMethod();

        
        // Bỏ qua các endpoint không yêu cầu xác thực
        boolean isPublicEndpoint = PUBLIC_ENDPOINTS.stream().anyMatch(path::startsWith);
        
        // Chỉ cho phép một số endpoint bookings specific là public (GET methods)
        boolean isGetBookingsPublic = path.startsWith("/api/bookings/") && "GET".equalsIgnoreCase(method) &&
                (path.matches("/api/bookings/user/\\d+") || 
                 path.matches("/api/bookings/car/\\d+") || 
                 path.equals("/api/bookings") ||
                 path.endsWith("/financials") ||
                 path.contains("/debug/"));

        if (isPublicEndpoint || isGetBookingsPublic || path.startsWith("/login/oauth2/code/")) {


//        // So sánh chính xác endpoint hoặc bắt đầu bằng prefix
//        boolean isPublicEndpoint = PUBLIC_ENDPOINTS.stream()
//            .anyMatch(publicPath -> path.equals(publicPath) || path.startsWith(publicPath));
//        boolean isGetRestrictedEndpoint = (path.startsWith("/api/bookings/") || path.startsWith("/api/ratings/"))
//                && "GET".equalsIgnoreCase(method);
//
//        if (isPublicEndpoint || isGetRestrictedEndpoint) {
            filterChain.doFilter(request, response);
            return;
        }
        
        // Tất cả các endpoint khác cần authentication
        String token = getJwtFromRequest(request);
        logger.debug("Processing request: {} {}, Token present: {}", method, path, token != null);
        
        if (token != null && jwtTokenProvider.validateToken(token)) {
            logger.info("Valid JWT token found for request: {} {}", method, path);
            String username = jwtTokenProvider.getUsernameFromToken(token);
            String role = jwtTokenProvider.getRoleFromToken(token);
            logger.info("Token details - Username: {}, Role: {}", username, role);
            
            UserDetails userDetails = userDetailsService.loadUserByUsername(username);

            logger.info("UserDetails authorities: {}", userDetails.getAuthorities());
            
            UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                    userDetails, null, userDetails.getAuthorities());
            authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
            SecurityContextHolder.getContext().setAuthentication(authentication);
            
            logger.info("Authentication set in SecurityContext: {}", authentication.getAuthorities());
        } else if (token != null) {
            logger.error("Invalid JWT token found for request: {}. Token: {}", path, token);
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.getWriter().write("Invalid or expired JWT token");
            logger.error("Set response 401 Unauthorized for invalid token");
            return;
        } else {
            logger.warn("No JWT token found for request: {}", path);
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.getWriter().write("Missing JWT token");
            logger.warn("Set response 401 Unauthorized for missing token");
            return;

        }

        filterChain.doFilter(request, response);
    }

    private String getJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}