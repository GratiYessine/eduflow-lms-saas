package com.example.lms.trainings.service;

import com.example.lms.common.dto.PageResponse;
import com.example.lms.common.exception.BadRequestException;
import com.example.lms.common.exception.ForbiddenException;
import com.example.lms.common.exception.ResourceNotFoundException;
import com.example.lms.audit.entity.AuditAction;
import com.example.lms.audit.service.AuditService;
import com.example.lms.common.util.StringSanitizer;
import com.example.lms.security.SecurityUtils;
import com.example.lms.trainings.dto.TrainingCreateRequest;
import com.example.lms.trainings.dto.TrainingResponse;
import com.example.lms.trainings.dto.TrainingUpdateRequest;
import com.example.lms.trainings.entity.Training;
import com.example.lms.trainings.entity.TrainingLevel;
import com.example.lms.trainings.entity.TrainingStatus;
import com.example.lms.trainings.mapper.TrainingMapper;
import com.example.lms.trainings.repository.TrainingRepository;
import com.example.lms.users.entity.Role;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class TrainingService {

    private final TrainingRepository trainingRepository;
    private final TrainingMapper trainingMapper;
    private final AuditService auditService;
    private final StringSanitizer sanitizer;

    @Transactional
    @CacheEvict(value = "trainings", allEntries = true)
    @PreAuthorize("hasAnyRole('TRAINER','SUPER_ADMIN')")
    public TrainingResponse create(TrainingCreateRequest request) {
        Long trainerId = SecurityUtils.currentUserId();
        if (trainerId == null) {
            throw new BadRequestException("Authenticated trainer is required");
        }
        Training training = new Training();
        training.setTrainerId(trainerId);
        training.setTitle(sanitizer.clean(request.title()));
        training.setSlug(uniqueSlug(training.getTitle()));
        training.setShortDescription(sanitizer.clean(request.shortDescription()));
        training.setDescription(sanitizer.clean(request.description()));
        training.setThumbnailUrl(sanitizer.clean(request.thumbnailUrl()));
        training.setIntroVideoUrl(sanitizer.clean(request.introVideoUrl()));
        training.setCategory(sanitizer.clean(request.category()));
        training.setLevel(request.level());
        training.setLanguage(request.language());
        training.setDurationMinutes(request.durationMinutes());
        training.setPrice(request.price());
        Training saved = trainingRepository.save(training);
        auditService.record(AuditAction.TRAINING_CREATED, trainerId, null, "Training", saved.getId(), "SUCCESS", "Training created");
        return trainingMapper.toResponse(saved);
    }

    @Transactional(readOnly = true)
    public PageResponse<TrainingResponse> search(String category, TrainingLevel level, Long trainerId, TrainingStatus status, String query, Pageable pageable) {
        Role role = SecurityUtils.currentRole();
        TrainingStatus effectiveStatus = role == Role.TRAINER || role == Role.SUPER_ADMIN ? status : TrainingStatus.PUBLISHED;
        return PageResponse.from(trainingRepository.findAll(searchSpec(category, level, trainerId, effectiveStatus, query), pageable)
                .map(trainingMapper::toResponse));
    }

    @Transactional(readOnly = true)
    @Cacheable(value = "trainings", key = "'get:' + #id")
    public TrainingResponse get(Long id) {
        Training training = trainingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Training not found"));
        if (training.getStatus() != TrainingStatus.PUBLISHED && !canManage(training)) {
            throw new ResourceNotFoundException("Training not found");
        }
        return trainingMapper.toResponse(training);
    }

    @Transactional
    @CacheEvict(value = "trainings", allEntries = true)
    @PreAuthorize("hasRole('SUPER_ADMIN') or @tenantSecurity.isTrainingOwner(#id)")
    public TrainingResponse update(Long id, TrainingUpdateRequest request) {
        Training training = ownedTraining(id);
        if (request.title() != null && !request.title().isBlank()) {
            training.setTitle(sanitizer.clean(request.title()));
        }
        training.setShortDescription(sanitizer.clean(request.shortDescription()));
        training.setDescription(sanitizer.clean(request.description()));
        training.setThumbnailUrl(sanitizer.clean(request.thumbnailUrl()));
        training.setIntroVideoUrl(sanitizer.clean(request.introVideoUrl()));
        training.setCategory(sanitizer.clean(request.category()));
        if (request.level() != null) {
            training.setLevel(request.level());
        }
        if (request.language() != null && !request.language().isBlank()) {
            training.setLanguage(request.language());
        }
        if (request.durationMinutes() != null) {
            training.setDurationMinutes(request.durationMinutes());
        }
        if (request.price() != null) {
            training.setPrice(request.price());
        }
        return trainingMapper.toResponse(training);
    }

    @Transactional
    @CacheEvict(value = "trainings", allEntries = true)
    @PreAuthorize("hasRole('SUPER_ADMIN') or @tenantSecurity.isTrainingOwner(#id)")
    public TrainingResponse publish(Long id) {
        Training training = ownedTraining(id);
        training.setStatus(TrainingStatus.PUBLISHED);
        auditService.record(AuditAction.TRAINING_PUBLISHED, training.getTrainerId(), null, "Training", training.getId(), "SUCCESS", "Training published");
        return trainingMapper.toResponse(training);
    }

    @Transactional
    @CacheEvict(value = "trainings", allEntries = true)
    @PreAuthorize("hasRole('SUPER_ADMIN') or @tenantSecurity.isTrainingOwner(#id)")
    public TrainingResponse archive(Long id) {
        Training training = ownedTraining(id);
        training.setStatus(TrainingStatus.ARCHIVED);
        return trainingMapper.toResponse(training);
    }

    @Transactional
    @CacheEvict(value = "trainings", allEntries = true)
    @PreAuthorize("hasRole('SUPER_ADMIN') or @tenantSecurity.isTrainingOwner(#id)")
    public void delete(Long id) {
        trainingRepository.delete(ownedTraining(id));
    }

    @Transactional(readOnly = true)
    public Training ownedTraining(Long id) {
        Training training = trainingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Training not found"));
        if (!canManage(training)) {
            throw new ForbiddenException("Training belongs to another trainer");
        }
        return training;
    }

    private boolean canManage(Training training) {
        Role role = SecurityUtils.currentRole();
        Long userId = SecurityUtils.currentUserId();
        return role == Role.SUPER_ADMIN || (role == Role.TRAINER && training.getTrainerId().equals(userId));
    }

    private String uniqueSlug(String title) {
        String base = Normalizer.normalize(title, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("(^-|-$)", "");
        if (base.isBlank()) {
            base = "training";
        }
        String candidate = base;
        int counter = 2;
        while (trainingRepository.existsBySlug(candidate)) {
            candidate = base + "-" + counter++;
        }
        return candidate;
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value;
    }

    private Specification<Training> searchSpec(String category, TrainingLevel level, Long trainerId, TrainingStatus status, String query) {
        return (root, criteriaQuery, builder) -> {
            List<jakarta.persistence.criteria.Predicate> predicates = new ArrayList<>();
            String normalizedCategory = blankToNull(category);
            if (normalizedCategory != null) {
                predicates.add(builder.equal(builder.lower(root.get("category")), normalizedCategory.toLowerCase(Locale.ROOT)));
            }
            if (level != null) {
                predicates.add(builder.equal(root.get("level"), level));
            }
            if (trainerId != null) {
                predicates.add(builder.equal(root.get("trainerId"), trainerId));
            }
            if (status != null) {
                predicates.add(builder.equal(root.get("status"), status));
            }
            String normalizedQuery = blankToNull(query);
            if (normalizedQuery != null) {
                String pattern = "%" + normalizedQuery.toLowerCase(Locale.ROOT) + "%";
                predicates.add(builder.or(
                        builder.like(builder.lower(root.get("title")), pattern),
                        builder.like(builder.lower(root.get("shortDescription")), pattern)
                ));
            }
            return builder.and(predicates.toArray(jakarta.persistence.criteria.Predicate[]::new));
        };
    }
}
