package com.example.lms.certificates.service;

import com.example.lms.certificates.dto.CertificateResponse;
import com.example.lms.certificates.dto.CertificateVerificationResponse;
import com.example.lms.certificates.entity.Certificate;
import com.example.lms.certificates.mapper.CertificateMapper;
import com.example.lms.certificates.repository.CertificateRepository;
import com.example.lms.audit.entity.AuditAction;
import com.example.lms.audit.service.AuditService;
import com.example.lms.common.exception.BadRequestException;
import com.example.lms.common.exception.ForbiddenException;
import com.example.lms.common.exception.ResourceNotFoundException;
import com.example.lms.files.entity.FileCategory;
import com.example.lms.files.entity.StoredFile;
import com.example.lms.files.service.FileStorageService;
import com.example.lms.notifications.entity.NotificationType;
import com.example.lms.notifications.service.NotificationService;
import com.example.lms.progress.entity.LearnerProgress;
import com.example.lms.progress.entity.ProgressStatus;
import com.example.lms.progress.repository.LearnerProgressRepository;
import com.example.lms.security.SecurityUtils;
import com.example.lms.trainings.entity.Training;
import com.example.lms.trainings.repository.TrainingRepository;
import com.example.lms.users.entity.Role;
import com.example.lms.users.entity.User;
import com.example.lms.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.Instant;
import java.time.Year;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CertificateService {

    private final CertificateRepository certificateRepository;
    private final LearnerProgressRepository progressRepository;
    private final TrainingRepository trainingRepository;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;
    private final CertificateMapper certificateMapper;
    private final NotificationService notificationService;
    private final AuditService auditService;

    @Transactional
    public CertificateResponse generate(Long progressId) {
        LearnerProgress progress = progressRepository.findById(progressId)
                .orElseThrow(() -> new ResourceNotFoundException("Progress not found"));
        if (progress.getStatus() != ProgressStatus.APPROVED) {
            throw new BadRequestException("Progress must be approved before certificate generation");
        }
        Training training = trainingRepository.findById(progress.getTrainingId())
                .orElseThrow(() -> new ResourceNotFoundException("Training not found"));
        ensureCanGenerate(training);
        certificateRepository.findByLearnerIdAndTrainingId(progress.getLearnerId(), progress.getTrainingId())
                .ifPresent(existing -> {
                    throw new BadRequestException("Certificate already exists for this progress");
                });
        User learner = userRepository.findById(progress.getLearnerId())
                .orElseThrow(() -> new ResourceNotFoundException("Learner not found"));

        String number = "CERT-" + Year.now().getValue() + "-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        String verificationCode = UUID.randomUUID().toString().replace("-", "");
        byte[] pdf = generatePdf(number, verificationCode, learner, training);
        StoredFile file = fileStorageService.storeGenerated(number + ".pdf", "application/pdf", pdf, FileCategory.CERTIFICATE);

        Certificate certificate = new Certificate();
        certificate.setCertificateNumber(number);
        certificate.setLearnerId(progress.getLearnerId());
        certificate.setTrainingId(progress.getTrainingId());
        certificate.setTrainerId(training.getTrainerId());
        certificate.setIssuedAt(Instant.now());
        certificate.setFileId(file.getId());
        certificate.setFileUrl("/api/v1/certificates/pending/download");
        certificate.setVerificationCode(verificationCode);
        certificate = certificateRepository.save(certificate);
        certificate.setFileUrl("/api/v1/certificates/" + certificate.getId() + "/download");
        notificationService.notify(progress.getLearnerId(), "Certificate issued", "Your certificate for " + training.getTitle() + " is ready", NotificationType.CERTIFICATE_ISSUED);
        auditService.record(AuditAction.CERTIFICATE_GENERATED, progress.getLearnerId(), learner.getCompanyId(), "Certificate", certificate.getId(), "SUCCESS", "Certificate generated for training " + training.getId());
        return certificateMapper.toResponse(certificate);
    }

    @Transactional(readOnly = true)
    public List<CertificateResponse> myCertificates() {
        return certificateRepository.findByLearnerId(SecurityUtils.currentUserId()).stream()
                .map(certificateMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public CertificateVerificationResponse verify(String code) {
        return certificateRepository.findByVerificationCode(code)
                .map(certificate -> new CertificateVerificationResponse(true, certificate.getCertificateNumber(), certificate.getLearnerId(), certificate.getTrainingId(), certificate.getIssuedAt()))
                .orElseGet(() -> new CertificateVerificationResponse(false, null, null, null, null));
    }

    @Transactional(readOnly = true)
    public Resource download(Long id) {
        Certificate certificate = certificateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Certificate not found"));
        ensureCanRead(certificate);
        return fileStorageService.loadAsResource(certificate.getFileId());
    }

    @Transactional(readOnly = true)
    public Certificate certificateForDownload(Long id) {
        Certificate certificate = certificateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Certificate not found"));
        ensureCanRead(certificate);
        return certificate;
    }

    private void ensureCanGenerate(Training training) {
        Role role = SecurityUtils.currentRole();
        Long currentUserId = SecurityUtils.currentUserId();
        if (role != Role.SUPER_ADMIN && !training.getTrainerId().equals(currentUserId)) {
            throw new ForbiddenException("Only the training owner can generate certificates");
        }
    }

    private void ensureCanRead(Certificate certificate) {
        Role role = SecurityUtils.currentRole();
        Long currentUserId = SecurityUtils.currentUserId();
        if (role == Role.SUPER_ADMIN || certificate.getLearnerId().equals(currentUserId) || certificate.getTrainerId().equals(currentUserId)) {
            return;
        }
        throw new ForbiddenException("Certificate belongs to another user");
    }

    private byte[] generatePdf(String number, String code, User learner, Training training) {
        try (PDDocument document = new PDDocument(); ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            PDPage page = new PDPage();
            document.addPage(page);
            try (PDPageContentStream content = new PDPageContentStream(document, page)) {
                content.beginText();
                content.setFont(PDType1Font.HELVETICA_BOLD, 26);
                content.newLineAtOffset(90, 680);
                content.showText("Certificate of Completion");
                content.endText();

                content.beginText();
                content.setFont(PDType1Font.HELVETICA, 16);
                content.newLineAtOffset(90, 610);
                content.showText("Awarded to " + learner.getFirstName() + " " + learner.getLastName());
                content.newLineAtOffset(0, -35);
                content.showText("For completing: " + training.getTitle());
                content.newLineAtOffset(0, -35);
                content.showText("Certificate number: " + number);
                content.newLineAtOffset(0, -35);
                content.showText("Verification code: " + code);
                content.endText();
            }
            document.save(output);
            return output.toByteArray();
        } catch (IOException ex) {
            throw new BadRequestException("Could not generate certificate PDF");
        }
    }
}
