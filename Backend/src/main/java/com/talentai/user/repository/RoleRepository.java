package com.talentai.user.repository;

import com.talentai.user.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RoleRepository extends JpaRepository<Role, Integer> {

    Optional<Role> findByRoleName(String roleName);

    /** Roles offered on the public "Register as" form (System Admin is excluded). */
    List<Role> findBySelfRegisterableTrueAndIsActiveTrueOrderByRoleIdAsc();
}
