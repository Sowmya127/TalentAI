package com.talentai.user.repository;

import com.talentai.user.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    @Query("SELECT DISTINCT u FROM User u "
            + "LEFT JOIN UserRole ur ON ur.user = u AND ur.isActive = true "
            + "LEFT JOIN ur.role r "
            + "WHERE (:roleName IS NULL OR r.roleName = :roleName) "
            + "AND (:status IS NULL OR u.userStatus = :status)")
    Page<User> search(@Param("roleName") String roleName, @Param("status") String status, Pageable pageable);
}
