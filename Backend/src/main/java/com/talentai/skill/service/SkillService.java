package com.talentai.skill.service;

import com.talentai.skill.entity.Skill;
import com.talentai.skill.repository.SkillRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Shared helper: resolve a skill by name, creating it on first use so
 *  candidate/job skill lists can be entered as free text. */
@Service
@RequiredArgsConstructor
public class SkillService {

    private final SkillRepository skillRepository;

    @Transactional
    public Skill resolveOrCreate(String rawName, Long actorUserId) {
        String name = rawName.trim();
        return skillRepository.findBySkillNameIgnoreCase(name)
                .orElseGet(() -> skillRepository.save(
                        Skill.builder().skillName(name).createdBy(actorUserId).isActive(true).build()));
    }
}
