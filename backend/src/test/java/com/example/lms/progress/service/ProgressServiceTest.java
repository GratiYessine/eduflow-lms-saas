package com.example.lms.progress.service;

import com.example.lms.TestSecurity;
import com.example.lms.assignments.entity.AssignmentStatus;
import com.example.lms.assignments.entity.TrainingAssignment;
import com.example.lms.assignments.repository.TrainingAssignmentRepository;
import com.example.lms.lessons.entity.Lesson;
import com.example.lms.lessons.repository.LessonRepository;
import com.example.lms.notifications.service.NotificationService;
import com.example.lms.progress.dto.QuizAttemptResponse;
import com.example.lms.progress.mapper.ProgressMapper;
import com.example.lms.progress.repository.LearnerProgressRepository;
import com.example.lms.progress.repository.LessonProgressRepository;
import com.example.lms.progress.repository.QuizAttemptRepository;
import com.example.lms.quizzes.dto.AnswerSubmissionRequest;
import com.example.lms.quizzes.dto.QuizSubmitRequest;
import com.example.lms.quizzes.entity.AnswerOption;
import com.example.lms.quizzes.entity.Question;
import com.example.lms.quizzes.entity.QuestionType;
import com.example.lms.quizzes.entity.Quiz;
import com.example.lms.quizzes.repository.AnswerOptionRepository;
import com.example.lms.quizzes.repository.QuestionRepository;
import com.example.lms.quizzes.repository.QuizRepository;
import com.example.lms.teams.repository.TeamMemberRepository;
import com.example.lms.trainings.repository.TrainingRepository;
import com.example.lms.users.entity.Role;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProgressServiceTest {

    @Mock LearnerProgressRepository progressRepository;
    @Mock LessonProgressRepository lessonProgressRepository;
    @Mock QuizAttemptRepository quizAttemptRepository;
    @Mock LessonRepository lessonRepository;
    @Mock QuizRepository quizRepository;
    @Mock QuestionRepository questionRepository;
    @Mock AnswerOptionRepository answerOptionRepository;
    @Mock TrainingRepository trainingRepository;
    @Mock TrainingAssignmentRepository assignmentRepository;
    @Mock TeamMemberRepository teamMemberRepository;
    @Mock ProgressMapper progressMapper;
    @Mock NotificationService notificationService;
    @InjectMocks ProgressService progressService;

    @AfterEach
    void tearDown() {
        TestSecurity.clear();
    }

    @Test
    void submitQuizScoresCorrectAnswersAutomatically() {
        TestSecurity.authenticate(7L, Role.LEARNER, 77L);
        Quiz quiz = new Quiz();
        quiz.setId(1L);
        quiz.setLessonId(2L);
        quiz.setTitle("Quiz");
        quiz.setPassingScore(80);
        quiz.setMaxAttempts(3);
        quiz.setPublished(true);
        Lesson lesson = new Lesson();
        lesson.setId(2L);
        lesson.setTrainingId(3L);
        TrainingAssignment assignment = new TrainingAssignment();
        assignment.setTrainingId(3L);
        Question question = new Question();
        question.setId(4L);
        question.setQuizId(1L);
        question.setType(QuestionType.SINGLE_CHOICE);
        AnswerOption correct = option(10L, 4L, true);
        AnswerOption wrong = option(11L, 4L, false);

        when(quizRepository.findById(1L)).thenReturn(Optional.of(quiz));
        when(lessonRepository.findById(2L)).thenReturn(Optional.of(lesson));
        when(assignmentRepository.findByCompanyIdAndLearnerIdAndStatus(77L, 7L, AssignmentStatus.ACTIVE)).thenReturn(List.of(assignment));
        when(teamMemberRepository.findByUserIdAndCompanyId(7L, 77L)).thenReturn(List.of());
        when(assignmentRepository.findByCompanyIdAndTeamIdIsNullAndLearnerIdIsNullAndStatus(77L, AssignmentStatus.ACTIVE)).thenReturn(List.of());
        when(quizAttemptRepository.countByLearnerIdAndQuizId(7L, 1L)).thenReturn(0L);
        when(questionRepository.findByQuizIdOrderByOrderIndexAsc(1L)).thenReturn(List.of(question));
        when(answerOptionRepository.findByQuestionIdIn(Set.of(4L))).thenReturn(List.of(correct, wrong));
        when(quizAttemptRepository.save(any())).thenAnswer(invocation -> {
            com.example.lms.progress.entity.QuizAttempt attempt = invocation.getArgument(0);
            attempt.setId(99L);
            attempt.setSubmittedAt(Instant.now());
            return attempt;
        });
        when(progressMapper.toResponse(any(com.example.lms.progress.entity.QuizAttempt.class)))
                .thenAnswer(invocation -> {
                    com.example.lms.progress.entity.QuizAttempt attempt = invocation.getArgument(0);
                    return new QuizAttemptResponse(attempt.getId(), attempt.getLearnerId(), attempt.getQuizId(), attempt.getScore(), attempt.isPassed(), attempt.getAttemptNumber(), attempt.getSubmittedAt());
                });

        QuizAttemptResponse response = progressService.submitQuiz(1L, new QuizSubmitRequest(List.of(new AnswerSubmissionRequest(4L, Set.of(10L)))));

        assertThat(response.score()).isEqualTo(100);
        assertThat(response.passed()).isTrue();
        assertThat(response.attemptNumber()).isEqualTo(1);
    }

    private AnswerOption option(Long id, Long questionId, boolean correct) {
        AnswerOption option = new AnswerOption();
        option.setId(id);
        option.setQuestionId(questionId);
        option.setCorrect(correct);
        option.setText(correct ? "Correct" : "Wrong");
        return option;
    }
}
