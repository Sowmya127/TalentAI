package com.talentai.security;

import com.talentai.user.entity.User;
import com.talentai.user.repository.UserRepository;
import com.talentai.user.repository.UserRoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;
    private final UserRoleRepository userRoleRepository;

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("No user found with email: " + email));
        return buildPrincipal(user);
    }

    /** Used by JwtAuthenticationFilter -- the JWT subject is the numeric
     *  user id, not the email, so authentication on each request looks
     *  the user up by id rather than by username. */
    @Transactional(readOnly = true)
    public UserDetails loadUserById(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UsernameNotFoundException("No user found with id: " + userId));
        return buildPrincipal(user);
    }

    private UserPrincipal buildPrincipal(User user) {
        List<GrantedAuthority> authorities = userRoleRepository.findByUser_UserIdAndIsActiveTrue(user.getUserId()).stream()
                .map(ur -> new SimpleGrantedAuthority(
                        "ROLE_" + ur.getRole().getRoleName().toUpperCase(Locale.ROOT).replace(" ", "_")))
                .map(GrantedAuthority.class::cast)
                .toList();
        return new UserPrincipal(user, authorities);
    }
}
