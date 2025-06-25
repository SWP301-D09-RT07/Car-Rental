package com.carrental.car_rental.security;

import com.carrental.car_rental.dto.AuthResponse;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.core.user.OAuth2User;

import java.util.Collection;
import java.util.Map;

@Getter
public class CustomOAuth2User implements OAuth2User {
    private final OAuth2User oauth2User;
    private final AuthResponse authResponse;

    public CustomOAuth2User(OAuth2User oauth2User, AuthResponse authResponse) {
        this.oauth2User = oauth2User;
        this.authResponse = authResponse;
    }

    @Override
    public Map<String, Object> getAttributes() {
        return oauth2User.getAttributes();
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return oauth2User.getAuthorities();
    }

    @Override
    public String getName() {
        return oauth2User.getAttribute("email");
    }
}