package com.talentai.skill.repository;

import com.talentai.skill.entity.Skill;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SkillRepository extends JpaRepository<Skill, Integer> {

    Optional<Skill> findBySkillNameIgnoreCase(String skillName);
}
