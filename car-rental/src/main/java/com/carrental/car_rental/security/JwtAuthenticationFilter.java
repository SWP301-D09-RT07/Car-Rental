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
            "/api/auth/",
            "/api/languages/",
            "/api/country-codes/",
            "/api/car-brands/",
            "/api/fuel-types/",
            "/api/regions/",
            "/api/cars/",
            "/api/service-types/",
            "/api/bookings/",
            "/api/ratings/"
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
        String method = request.getMethod();
        // Bỏ qua các endpoint không yêu cầu xác thực
        boolean isPublicEndpoint = PUBLIC_ENDPOINTS.stream().anyMatch(path::startsWith);
        boolean isGetRestrictedEndpoint = (path.startsWith("/api/bookings/") || path.startsWith("/api/ratings/"))
                && "GET".equalsIgnoreCase(method);

        if (isPublicEndpoint || isGetRestrictedEndpoint || path.startsWith("/login/oauth2/code/")) {
            logger.info("Public endpoint, skipping authentication");
            filterChain.doFilter(request, response);
            return;
        }

        String token = getJwtFromRequest(request);
        logger.info("Extracted token: {}", token != null ? "EXISTS" : "NOT EXISTS");
        
        if (token != null && jwtTokenProvider.validateToken(token)) {
            logger.info("Valid JWT token found for request: {}", path);
            String username = jwtTokenProvider.getUsernameFromToken(token);
            String role = jwtTokenProvider.getRoleFromToken(token);
            logger.info("Token username: {}", username);
            logger.info("Token role: {}", role);
            
            UserDetails userDetails = userDetailsService.loadUserByUsername(username);
            logger.info("UserDetails loaded: {}", userDetails.getUsername());
            logger.info("UserDetails authorities: {}", userDetails.getAuthorities());
            
            UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                    userDetails, null, userDetails.getAuthorities());
            authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
            SecurityContextHolder.getContext().setAuthentication(authentication);
            logger.info("Authentication set in SecurityContext");
        } else if (token != null) {
            logger.error("Invalid JWT token found for request: {}", path);
        } else {
            logger.warn("No JWT token found for request: {}", path);
        }
        
        logger.info("=== JWT FILTER - KẾT THÚC XỬ LÝ REQUEST ===");
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