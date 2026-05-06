package com.example.lms.audit.service;

import com.example.lms.audit.entity.AuditAction;
import com.example.lms.audit.entity.AuditEvent;
import com.example.lms.audit.repository.AuditEventRepository;
import com.example.lms.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuditService {

    private final AuditEventRepository auditEventRepository;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void record(AuditAction action, Long targetUserId, Long companyId, String resourceType, Long resourceId, String outcome, String details) {
        AuditEvent event = new AuditEvent();
        event.setAction(action);
        event.setActorUserId(SecurityUtils.currentUserId());
        event.setTargetUserId(targetUserId);
        event.setCompanyId(companyId);
        event.setResourceType(resourceType);
        event.setResourceId(resourceId);
        event.setOutcome(outcome);
        event.setDetails(details);
        auditEventRepository.save(event);
        log.info("audit_event action={} actorUserId={} targetUserId={} companyId={} resourceType={} resourceId={} outcome={}",
                action, event.getActorUserId(), targetUserId, companyId, resourceType, resourceId, outcome);
    }
}
