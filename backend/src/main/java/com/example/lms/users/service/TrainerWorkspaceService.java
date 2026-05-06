package com.example.lms.users.service;

import com.example.lms.assignments.entity.AssignmentStatus;
import com.example.lms.assignments.entity.TrainingAssignment;
import com.example.lms.assignments.repository.TrainingAssignmentRepository;
import com.example.lms.certificates.repository.CertificateRepository;
import com.example.lms.common.exception.BadRequestException;
import com.example.lms.lessons.entity.Lesson;
import com.example.lms.lessons.repository.LessonRepository;
import com.example.lms.progress.entity.LearnerProgress;
import com.example.lms.progress.entity.ProgressStatus;
import com.example.lms.progress.entity.QuizAttempt;
import com.example.lms.progress.repository.LearnerProgressRepository;
import com.example.lms.progress.repository.QuizAttemptRepository;
import com.example.lms.quizzes.entity.Quiz;
import com.example.lms.quizzes.repository.QuizRepository;
import com.example.lms.security.SecurityUtils;
import com.example.lms.teams.entity.TeamMember;
import com.example.lms.teams.repository.TeamMemberRepository;
import com.example.lms.trainings.entity.Training;
import com.example.lms.trainings.repository.TrainingRepository;
import com.example.lms.trainings.service.TrainingService;
import com.example.lms.users.dto.TrainerApprovalResponse;
import com.example.lms.users.dto.TrainerLearnerResponse;
import com.example.lms.users.dto.TrainerWalletResponse;
import com.example.lms.users.entity.Role;
import com.example.lms.users.entity.User;
import com.example.lms.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TrainerWorkspaceService {

    private static final BigDecimal PLATFORM_COMMISSION_RATE = BigDecimal.valueOf(0.10);

    private final TrainingRepository trainingRepository;
    private final TrainingService trainingService;
    private final TrainingAssignmentRepository assignmentRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final UserRepository userRepository;
    private final LearnerProgressRepository progressRepository;
    private final LessonRepository lessonRepository;
    private final QuizRepository quizRepository;
    private final QuizAttemptRepository quizAttemptRepository;
    private final CertificateRepository certificateRepository;

    @Transactional(readOnly = true)
    public List<TrainerLearnerResponse> learnersForTraining(Long trainingId) {
        Training training = trainingService.ownedTraining(trainingId);
        return learnerResponses(List.of(training));
    }

    @Transactional(readOnly = true)
    public List<TrainerLearnerResponse> myLearners() {
        return learnerResponses(myTrainings());
    }

    @Transactional(readOnly = true)
    public List<TrainerApprovalResponse> myApprovals() {
        List<Training> trainings = myTrainings();
        Map<Long, Training> trainingById = trainings.stream().collect(Collectors.toMap(Training::getId, Function.identity()));
        if (trainingById.isEmpty()) {
            return List.of();
        }
        return progressRepository.findByTrainingIdInAndStatus(trainingById.keySet(), ProgressStatus.COMPLETED)
                .stream()
                .map(progress -> approvalResponse(progress, trainingById.get(progress.getTrainingId())))
                .filter(Objects::nonNull)
                .toList();
    }

    @Transactional(readOnly = true)
    public TrainerWalletResponse wallet() {
        List<Training> trainings = myTrainings();
        if (trainings.isEmpty()) {
            return zeroWallet();
        }
        Map<Long, Training> trainingById = trainings.stream().collect(Collectors.toMap(Training::getId, Function.identity()));
        List<TrainingAssignment> activeAssignments = assignmentRepository.findByTrainingIdInAndStatus(trainingById.keySet(), AssignmentStatus.ACTIVE);
        BigDecimal totalRevenue = activeAssignments.stream()
                .map(assignment -> trainingById.get(assignment.getTrainingId()))
                .filter(Objects::nonNull)
                .map(Training::getPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);
        BigDecimal commission = totalRevenue.multiply(PLATFORM_COMMISSION_RATE).setScale(2, RoundingMode.HALF_UP);
        return new TrainerWalletResponse(
                totalRevenue,
                commission,
                totalRevenue.subtract(commission).setScale(2, RoundingMode.HALF_UP),
                activeAssignments.size()
        );
    }

    private List<TrainerLearnerResponse> learnerResponses(List<Training> trainings) {
        Map<Long, Training> trainingById = trainings.stream().collect(Collectors.toMap(Training::getId, Function.identity()));
        if (trainingById.isEmpty()) {
            return List.of();
        }
        Map<LearnerTrainingKey, TrainingAssignment> assignments = expandAssignments(trainingById.keySet().stream().toList());
        if (assignments.isEmpty()) {
            return List.of();
        }
        Map<Long, User> users = userRepository.findAllById(assignments.keySet().stream().map(LearnerTrainingKey::learnerId).distinct().toList())
                .stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));

        return assignments.keySet().stream()
                .map(key -> learnerResponse(key, users.get(key.learnerId()), trainingById.get(key.trainingId())))
                .filter(Objects::nonNull)
                .toList();
    }

    private Map<LearnerTrainingKey, TrainingAssignment> expandAssignments(List<Long> trainingIds) {
        Map<LearnerTrainingKey, TrainingAssignment> assignments = new LinkedHashMap<>();
        assignmentRepository.findByTrainingIdInAndStatus(trainingIds, AssignmentStatus.ACTIVE)
                .forEach(assignment -> {
                    if (assignment.getLearnerId() != null) {
                        assignments.putIfAbsent(new LearnerTrainingKey(assignment.getLearnerId(), assignment.getTrainingId()), assignment);
                        return;
                    }
                    if (assignment.getTeamId() != null) {
                        teamMemberRepository.findByTeamIdAndCompanyId(assignment.getTeamId(), assignment.getCompanyId())
                                .stream()
                                .map(TeamMember::getUserId)
                                .forEach(userId -> assignments.putIfAbsent(new LearnerTrainingKey(userId, assignment.getTrainingId()), assignment));
                        return;
                    }
                    userRepository.findByCompanyIdAndRole(assignment.getCompanyId(), Role.LEARNER)
                            .forEach(user -> assignments.putIfAbsent(new LearnerTrainingKey(user.getId(), assignment.getTrainingId()), assignment));
                });
        return assignments;
    }

    private TrainerLearnerResponse learnerResponse(LearnerTrainingKey key, User learner, Training training) {
        if (learner == null || training == null) {
            return null;
        }
        Optional<LearnerProgress> progress = progressRepository.findByLearnerIdAndTrainingId(key.learnerId(), key.trainingId());
        ProgressStatus status = progress.map(LearnerProgress::getStatus).orElse(ProgressStatus.PENDING);
        return new TrainerLearnerResponse(
                learner.getId(),
                learner.getFirstName(),
                learner.getLastName(),
                learner.getEmail(),
                training.getId(),
                training.getTitle(),
                mapAssignmentStatus(status),
                progress.map(LearnerProgress::getId).orElse(null),
                status.name(),
                progress.map(LearnerProgress::getProgressPercentage).orElse(BigDecimal.ZERO),
                quizScore(learner.getId(), training.getId()),
                certificateRepository.findByLearnerIdAndTrainingId(learner.getId(), training.getId()).isPresent() ? "GENERATED" : "NOT_GENERATED"
        );
    }

    private TrainerApprovalResponse approvalResponse(LearnerProgress progress, Training training) {
        if (training == null) {
            return null;
        }
        return userRepository.findById(progress.getLearnerId())
                .map(learner -> new TrainerApprovalResponse(
                        progress.getId(),
                        learner.getId(),
                        learner.getFirstName(),
                        learner.getLastName(),
                        learner.getEmail(),
                        training.getId(),
                        training.getTitle(),
                        progress.getProgressPercentage(),
                        quizScore(learner.getId(), training.getId()),
                        progress.getStatus().name(),
                        certificateRepository.findByLearnerIdAndTrainingId(learner.getId(), training.getId()).isPresent()
                ))
                .orElse(null);
    }

    private Integer quizScore(Long learnerId, Long trainingId) {
        List<Long> lessonIds = lessonRepository.findByTrainingIdOrderByOrderIndexAsc(trainingId)
                .stream()
                .map(Lesson::getId)
                .toList();
        if (lessonIds.isEmpty()) {
            return null;
        }
        List<Long> quizIds = quizRepository.findByLessonIdIn(lessonIds)
                .stream()
                .map(Quiz::getId)
                .toList();
        if (quizIds.isEmpty()) {
            return null;
        }
        return quizAttemptRepository.findByLearnerIdAndQuizIdIn(learnerId, quizIds)
                .stream()
                .mapToInt(QuizAttempt::getScore)
                .max()
                .stream()
                .boxed()
                .findFirst()
                .orElse(null);
    }

    private String mapAssignmentStatus(ProgressStatus status) {
        return switch (status) {
            case PENDING -> "PENDING";
            case NOT_STARTED, ACCEPTED -> "ACCEPTED";
            case IN_PROGRESS -> "IN_PROGRESS";
            case COMPLETED -> "COMPLETED";
            case APPROVED -> "APPROVED";
            case REJECTED -> "REJECTED";
        };
    }

    private List<Training> myTrainings() {
        Long userId = SecurityUtils.currentUserId();
        if (userId == null) {
            throw new BadRequestException("Authenticated trainer is required");
        }
        return trainingRepository.findByTrainerId(userId);
    }

    private TrainerWalletResponse zeroWallet() {
        return new TrainerWalletResponse(BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, 0);
    }

    private record LearnerTrainingKey(Long learnerId, Long trainingId) {
    }
}
