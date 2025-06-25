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
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
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
            filterChain.doFilter(request, response);
            return;
        }

        String token = getJwtFromRequest(request);
        if (token != null && jwtTokenProvider.validateToken(token)) {
            logger.info("Valid JWT token found for request: {}", path);
            String username = jwtTokenProvider.getUsernameFromToken(token);
            String role = jwtTokenProvider.getRoleFromToken(token);
            UserDetails userDetails = userDetailsService.loadUserByUsername(username);
            java.util.List<org.springframework.security.core.GrantedAuthority> authorities = java.util.List.of(
                new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_" + role)
            );
            UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                    userDetails, null, authorities);
            authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
            SecurityContextHolder.getContext().setAuthentication(authentication);
        } else if (token != null) {
            logger.debug("No valid JWT token found for request: {}", path);
        }
        filterChain.doFilter(request, response);
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) throws ServletException {
        String path = request.getRequestURI();
        // Bỏ qua filter cho các endpoint public, đặc biệt là /api/auth/**
        return path.startsWith("/api/auth/") ||
               path.startsWith("/login/oauth2/code/") ||
               path.startsWith("/oauth2/authorization/") ||
               path.startsWith("/api/languages/") ||
               path.startsWith("/api/country-codes/") ||
               path.startsWith("/api/car-brands/") ||
               path.startsWith("/api/fuel-types/") ||
               path.startsWith("/api/regions/") ||
               path.startsWith("/api/cars/") ||
               path.startsWith("/api/service-types/");
    }

    private String getJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}