package com.talentai.user.repository;

import com.talentai.user.entity.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UserRoleRepository extends JpaRepository<UserRole, Long> {

    List<UserRole> findByUser_UserIdAndIsActiveTrue(Long userId);

    boolean existsByUser_UserIdAndRole_RoleId(Long userId, Integer roleId);

    List<UserRole> findByRole_RoleNameInAndIsActiveTrue(java.util.Collection<String> roleNames);
}
