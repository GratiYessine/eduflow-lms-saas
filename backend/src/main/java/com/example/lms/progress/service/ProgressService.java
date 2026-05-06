package com.example.lms.progress.service;

import com.example.lms.assignments.entity.AssignmentStatus;
import com.example.lms.assignments.entity.TrainingAssignment;
import com.example.lms.assignments.repository.TrainingAssignmentRepository;
import com.example.lms.common.exception.BadRequestException;
import com.example.lms.common.exception.ForbiddenException;
import com.example.lms.common.exception.ResourceNotFoundException;
import com.example.lms.lessons.entity.Lesson;
import com.example.lms.lessons.repository.LessonRepository;
import com.example.lms.notifications.entity.NotificationType;
import com.example.lms.notifications.service.NotificationService;
import com.example.lms.progress.dto.ProgressResponse;
import com.example.lms.progress.dto.QuizAttemptResponse;
import com.example.lms.progress.entity.LearnerProgress;
import com.example.lms.progress.entity.LessonProgress;
import com.example.lms.progress.entity.ProgressStatus;
import com.example.lms.progress.entity.QuizAttempt;
import com.example.lms.progress.mapper.ProgressMapper;
import com.example.lms.progress.repository.LearnerProgressRepository;
import com.example.lms.progress.repository.LessonProgressRepository;
import com.example.lms.progress.repository.QuizAttemptRepository;
import com.example.lms.quizzes.dto.AnswerSubmissionRequest;
import com.example.lms.quizzes.dto.QuizSubmitRequest;
import com.example.lms.quizzes.entity.AnswerOption;
import com.example.lms.quizzes.entity.Question;
import com.example.lms.quizzes.entity.Quiz;
import com.example.lms.quizzes.repository.AnswerOptionRepository;
import com.example.lms.quizzes.repository.QuestionRepository;
import com.example.lms.quizzes.repository.QuizRepository;
import com.example.lms.security.SecurityUtils;
import com.example.lms.teams.entity.TeamMember;
import com.example.lms.teams.repository.TeamMemberRepository;
import com.example.lms.trainings.entity.Training;
import com.example.lms.trainings.repository.TrainingRepository;
import com.example.lms.users.entity.Role;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProgressService {

    private final LearnerProgressRepository progressRepository;
    private final LessonProgressRepository lessonProgressRepository;
    private final QuizAttemptRepository quizAttemptRepository;
    private final LessonRepository lessonRepository;
    private final QuizRepository quizRepository;
    private final QuestionRepository questionRepository;
    private final AnswerOptionRepository answerOptionRepository;
    private final TrainingRepository trainingRepository;
    private final TrainingAssignmentRepository assignmentRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final ProgressMapper progressMapper;
    private final NotificationService notificationService;

    @Transactional
    public List<ProgressResponse> myProgress() {
        Long learnerId = SecurityUtils.currentUserId();
        Long companyId = SecurityUtils.currentCompanyId();
        if (learnerId == null || companyId == null) {
            return List.of();
        }
        assignmentsForLearner(learnerId, companyId).forEach(assignment -> progressFor(learnerId, assignment.getTrainingId()));
        return progressRepository.findByLearnerId(learnerId).stream().map(progressMapper::toResponse).toList();
    }

    @Transactional
    public ProgressResponse completeLesson(Long lessonId) {
        Long learnerId = requireLearner();
        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new ResourceNotFoundException("Lesson not found"));
        ensureAssigned(learnerId, lesson.getTrainingId());

        LessonProgress lessonProgress = lessonProgressRepository.findByLearnerIdAndLessonId(learnerId, lessonId)
                .orElseGet(() -> {
                    LessonProgress created = new LessonProgress();
                    created.setLearnerId(learnerId);
                    created.setLessonId(lessonId);
                    return created;
                });
        lessonProgress.setCompleted(true);
        lessonProgress.setCompletedAt(Instant.now());
        lessonProgressRepository.save(lessonProgress);
        return progressMapper.toResponse(recalculate(learnerId, lesson.getTrainingId()));
    }

    @Transactional
    public QuizAttemptResponse submitQuiz(Long quizId, QuizSubmitRequest request) {
        Long learnerId = requireLearner();
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz not found"));
        if (!quiz.isPublished()) {
            throw new BadRequestException("Quiz is not published");
        }
        Lesson lesson = lessonRepository.findById(quiz.getLessonId())
                .orElseThrow(() -> new ResourceNotFoundException("Lesson not found"));
        ensureAssigned(learnerId, lesson.getTrainingId());

        long previousAttempts = quizAttemptRepository.countByLearnerIdAndQuizId(learnerId, quizId);
        if (previousAttempts >= quiz.getMaxAttempts()) {
            throw new BadRequestException("Maximum quiz attempts reached");
        }

        int score = calculateScore(quizId, request);
        boolean passed = score >= quiz.getPassingScore();
        QuizAttempt attempt = new QuizAttempt();
        attempt.setLearnerId(learnerId);
        attempt.setQuizId(quizId);
        attempt.setScore(score);
        attempt.setPassed(passed);
        attempt.setAttemptNumber((int) previousAttempts + 1);
        attempt = quizAttemptRepository.save(attempt);
        if (passed) {
            notificationService.notify(learnerId, "Quiz passed", "You passed quiz " + quiz.getTitle(), NotificationType.QUIZ_PASSED);
        }
        return progressMapper.toResponse(attempt);
    }

    @Transactional
    public ProgressResponse approve(Long progressId) {
        LearnerProgress progress = progressRepository.findById(progressId)
                .orElseThrow(() -> new ResourceNotFoundException("Progress not found"));
        Training training = trainingRepository.findById(progress.getTrainingId())
                .orElseThrow(() -> new ResourceNotFoundException("Training not found"));
        Role role = SecurityUtils.currentRole();
        Long userId = SecurityUtils.currentUserId();
        if (role != Role.SUPER_ADMIN && !training.getTrainerId().equals(userId)) {
            throw new ForbiddenException("Only the training owner can approve this progress");
        }
        if (progress.getStatus() != ProgressStatus.COMPLETED && progress.getStatus() != ProgressStatus.APPROVED) {
            throw new BadRequestException("Progress must be completed before approval");
        }
        progress.setStatus(ProgressStatus.APPROVED);
        progress.setApprovedAt(Instant.now());
        progress.setApprovedBy(userId);
        return progressMapper.toResponse(progress);
    }

    @Transactional
    public ProgressResponse reject(Long progressId) {
        LearnerProgress progress = progressRepository.findById(progressId)
                .orElseThrow(() -> new ResourceNotFoundException("Progress not found"));
        Training training = trainingRepository.findById(progress.getTrainingId())
                .orElseThrow(() -> new ResourceNotFoundException("Training not found"));
        Role role = SecurityUtils.currentRole();
        Long userId = SecurityUtils.currentUserId();
        if (role != Role.SUPER_ADMIN && !training.getTrainerId().equals(userId)) {
            throw new ForbiddenException("Only the training owner can reject this progress");
        }
        if (progress.getStatus() != ProgressStatus.COMPLETED && progress.getStatus() != ProgressStatus.APPROVED) {
            throw new BadRequestException("Progress must be completed before rejection");
        }
        progress.setStatus(ProgressStatus.REJECTED);
        progress.setApprovedAt(null);
        progress.setApprovedBy(userId);
        return progressMapper.toResponse(progress);
    }

    public LearnerProgress progressFor(Long learnerId, Long trainingId) {
        return progressRepository.findByLearnerIdAndTrainingId(learnerId, trainingId)
                .orElseGet(() -> {
                    LearnerProgress progress = new LearnerProgress();
                    progress.setLearnerId(learnerId);
                    progress.setTrainingId(trainingId);
                    return progressRepository.save(progress);
                });
    }

    private LearnerProgress recalculate(Long learnerId, Long trainingId) {
        LearnerProgress progress = progressFor(learnerId, trainingId);
        List<Long> lessonIds = lessonRepository.findByTrainingIdOrderByOrderIndexAsc(trainingId)
                .stream().map(Lesson::getId).toList();
        long total = lessonIds.size();
        long completed = total == 0 ? 0 : lessonProgressRepository.countByLearnerIdAndCompletedTrueAndLessonIdIn(learnerId, lessonIds);
        progress.setCompletedLessons((int) completed);
        if (progress.getStartedAt() == null) {
            progress.setStartedAt(Instant.now());
        }
        BigDecimal percentage = total == 0
                ? BigDecimal.ZERO
                : BigDecimal.valueOf(completed).multiply(BigDecimal.valueOf(100)).divide(BigDecimal.valueOf(total), 2, RoundingMode.HALF_UP);
        progress.setProgressPercentage(percentage);
        if (total > 0 && completed == total) {
            progress.setStatus(ProgressStatus.COMPLETED);
            if (progress.getCompletedAt() == null) {
                progress.setCompletedAt(Instant.now());
            }
            trainingRepository.findById(trainingId)
                    .ifPresent(training -> notificationService.notify(training.getTrainerId(), "Approval required", "A learner completed " + training.getTitle(), NotificationType.APPROVAL_REQUIRED));
        } else {
            progress.setStatus(ProgressStatus.IN_PROGRESS);
        }
        return progress;
    }

    private int calculateScore(Long quizId, QuizSubmitRequest request) {
        List<Question> questions = questionRepository.findByQuizIdOrderByOrderIndexAsc(quizId);
        if (questions.isEmpty()) {
            throw new BadRequestException("Quiz has no questions");
        }
        Map<Long, Question> questionById = questions.stream().collect(Collectors.toMap(Question::getId, Function.identity()));
        Map<Long, Set<Long>> selectedByQuestion = request.answers().stream()
                .collect(Collectors.toMap(AnswerSubmissionRequest::questionId, AnswerSubmissionRequest::selectedOptionIds, (left, right) -> right));
        if (!selectedByQuestion.keySet().equals(questionById.keySet())) {
            throw new BadRequestException("Submission must answer every quiz question");
        }

        List<AnswerOption> options = answerOptionRepository.findByQuestionIdIn(questionById.keySet());
        Map<Long, List<AnswerOption>> optionsByQuestion = options.stream().collect(Collectors.groupingBy(AnswerOption::getQuestionId));
        int correctQuestions = 0;
        for (Question question : questions) {
            Set<Long> validOptionIds = optionsByQuestion.getOrDefault(question.getId(), List.of()).stream().map(AnswerOption::getId).collect(Collectors.toSet());
            Set<Long> selected = selectedByQuestion.getOrDefault(question.getId(), Set.of());
            if (!validOptionIds.containsAll(selected)) {
                throw new BadRequestException("Quiz submission contains invalid answer option");
            }
            Set<Long> correct = optionsByQuestion.getOrDefault(question.getId(), List.of()).stream()
                    .filter(AnswerOption::isCorrect)
                    .map(AnswerOption::getId)
                    .collect(Collectors.toCollection(HashSet::new));
            if (correct.equals(selected)) {
                correctQuestions++;
            }
        }
        return BigDecimal.valueOf(correctQuestions)
                .multiply(BigDecimal.valueOf(100))
                .divide(BigDecimal.valueOf(questions.size()), 0, RoundingMode.HALF_UP)
                .intValue();
    }

    private void ensureAssigned(Long learnerId, Long trainingId) {
        Long companyId = SecurityUtils.currentCompanyId();
        boolean assigned = assignmentsForLearner(learnerId, companyId).stream()
                .anyMatch(assignment -> assignment.getTrainingId().equals(trainingId));
        if (!assigned) {
            throw new ForbiddenException("Training is not assigned to this learner");
        }
        progressFor(learnerId, trainingId);
    }

    private List<TrainingAssignment> assignmentsForLearner(Long learnerId, Long companyId) {
        if (companyId == null) {
            return List.of();
        }
        List<TeamMember> memberships = teamMemberRepository.findByUserIdAndCompanyId(learnerId, companyId);
        List<Long> teamIds = memberships.stream().map(TeamMember::getTeamId).toList();
        List<TrainingAssignment> assignments = new java.util.ArrayList<>();
        assignments.addAll(assignmentRepository.findByCompanyIdAndLearnerIdAndStatus(companyId, learnerId, AssignmentStatus.ACTIVE));
        if (!teamIds.isEmpty()) {
            assignments.addAll(assignmentRepository.findByCompanyIdAndTeamIdInAndLearnerIdIsNullAndStatus(companyId, teamIds, AssignmentStatus.ACTIVE));
        }
        assignments.addAll(assignmentRepository.findByCompanyIdAndTeamIdIsNullAndLearnerIdIsNullAndStatus(companyId, AssignmentStatus.ACTIVE));
        return assignments;
    }

    private Long requireLearner() {
        Long userId = SecurityUtils.currentUserId();
        if (userId == null) {
            throw new BadRequestException("Authenticated learner is required");
        }
        return userId;
    }
}
