package com.example.lms.quizzes.service;

import com.example.lms.common.exception.BadRequestException;
import com.example.lms.common.exception.ResourceNotFoundException;
import com.example.lms.lessons.entity.Lesson;
import com.example.lms.lessons.repository.LessonRepository;
import com.example.lms.quizzes.dto.AnswerOptionResponse;
import com.example.lms.quizzes.dto.QuestionRequest;
import com.example.lms.quizzes.dto.QuestionResponse;
import com.example.lms.quizzes.dto.QuizCreateRequest;
import com.example.lms.quizzes.dto.QuizResponse;
import com.example.lms.quizzes.entity.AnswerOption;
import com.example.lms.quizzes.entity.Question;
import com.example.lms.quizzes.entity.QuestionType;
import com.example.lms.quizzes.entity.Quiz;
import com.example.lms.quizzes.repository.AnswerOptionRepository;
import com.example.lms.quizzes.repository.QuestionRepository;
import com.example.lms.quizzes.repository.QuizRepository;
import com.example.lms.progress.repository.QuizAttemptRepository;
import com.example.lms.security.SecurityUtils;
import com.example.lms.trainings.repository.TrainingRepository;
import com.example.lms.trainings.service.TrainingService;
import com.example.lms.users.entity.Role;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class QuizService {

    private final QuizRepository quizRepository;
    private final QuestionRepository questionRepository;
    private final AnswerOptionRepository answerOptionRepository;
    private final LessonRepository lessonRepository;
    private final TrainingService trainingService;
    private final TrainingRepository trainingRepository;
    private final QuizAttemptRepository quizAttemptRepository;

    @Transactional
    public QuizResponse create(Long lessonId, QuizCreateRequest request) {
        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new ResourceNotFoundException("Lesson not found"));
        trainingService.ownedTraining(lesson.getTrainingId());
        quizRepository.findByLessonId(lessonId).ifPresent(existing -> {
            throw new BadRequestException("Lesson already has a quiz");
        });
        request.questions().forEach(this::validateQuestion);

        Quiz quiz = new Quiz();
        quiz.setLessonId(lessonId);
        applyQuizFields(quiz, request);
        quiz = quizRepository.save(quiz);
        replaceQuestions(quiz.getId(), request);
        return toResponse(quiz.getId());
    }

    @Transactional
    public QuizResponse update(Long quizId, QuizCreateRequest request) {
        Quiz quiz = ownQuiz(quizId);
        request.questions().forEach(this::validateQuestion);
        applyQuizFields(quiz, request);
        List<Long> questionIds = questionRepository.findByQuizIdOrderByOrderIndexAsc(quiz.getId())
                .stream()
                .map(Question::getId)
                .toList();
        if (!questionIds.isEmpty()) {
            answerOptionRepository.deleteByQuestionIdIn(questionIds);
        }
        questionRepository.deleteByQuizId(quiz.getId());
        replaceQuestions(quiz.getId(), request);
        return toResponse(quiz.getId());
    }

    @Transactional
    public QuizResponse publish(Long quizId) {
        Quiz quiz = ownQuiz(quizId);
        quiz.setPublished(true);
        return toResponse(quiz.getId());
    }

    @Transactional
    public QuizResponse unpublish(Long quizId) {
        Quiz quiz = ownQuiz(quizId);
        quiz.setPublished(false);
        return toResponse(quiz.getId());
    }

    @Transactional
    public void delete(Long quizId) {
        Quiz quiz = ownQuiz(quizId);
        List<Long> questionIds = questionRepository.findByQuizIdOrderByOrderIndexAsc(quiz.getId())
                .stream()
                .map(Question::getId)
                .toList();
        if (!questionIds.isEmpty()) {
            answerOptionRepository.deleteByQuestionIdIn(questionIds);
        }
        quizAttemptRepository.deleteByQuizId(quiz.getId());
        questionRepository.deleteByQuizId(quiz.getId());
        quizRepository.delete(quiz);
    }

    @Transactional(readOnly = true)
    public QuizResponse getByLesson(Long lessonId) {
        Quiz quiz = quizRepository.findByLessonId(lessonId)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz not found"));
        if (!quiz.isPublished()) {
            if (!canManageQuiz(quiz)) {
                throw new ResourceNotFoundException("Quiz not found");
            }
        }
        return toResponse(quiz.getId());
    }

    @Transactional(readOnly = true)
    public QuizResponse toResponse(Long quizId) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz not found"));
        boolean includeCorrectAnswers = canManageQuiz(quiz);
        List<Question> questions = questionRepository.findByQuizIdOrderByOrderIndexAsc(quiz.getId());
        Map<Long, List<AnswerOption>> answers = answerOptionRepository.findByQuestionIdIn(questions.stream().map(Question::getId).toList())
                .stream().collect(Collectors.groupingBy(AnswerOption::getQuestionId));
        List<QuestionResponse> questionResponses = questions.stream()
                .map(question -> new QuestionResponse(
                        question.getId(),
                        question.getQuizId(),
                        question.getQuestionText(),
                        question.getType(),
                        question.getOrderIndex(),
                        answers.getOrDefault(question.getId(), List.of()).stream()
                                .map(option -> answerResponse(option, includeCorrectAnswers))
                                .toList()
                ))
                .toList();
        return new QuizResponse(quiz.getId(), quiz.getLessonId(), quiz.getTitle(), quiz.getPassingScore(), quiz.getMaxAttempts(), quiz.isPublished(), questionResponses);
    }

    private AnswerOptionResponse answerResponse(AnswerOption option, boolean includeCorrectAnswers) {
        return new AnswerOptionResponse(option.getId(), option.getQuestionId(), option.getText(), includeCorrectAnswers ? option.isCorrect() : null);
    }

    private boolean canManageQuiz(Quiz quiz) {
        Lesson lesson = lessonRepository.findById(quiz.getLessonId()).orElse(null);
        if (lesson == null) {
            return false;
        }
        Role role = SecurityUtils.currentRole();
        Long currentUserId = SecurityUtils.currentUserId();
        return trainingRepository.findById(lesson.getTrainingId())
                .map(training -> role == Role.SUPER_ADMIN || (role == Role.TRAINER && training.getTrainerId().equals(currentUserId)))
                .orElse(false);
    }

    private Quiz ownQuiz(Long quizId) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz not found"));
        Lesson lesson = lessonRepository.findById(quiz.getLessonId())
                .orElseThrow(() -> new ResourceNotFoundException("Lesson not found"));
        trainingService.ownedTraining(lesson.getTrainingId());
        return quiz;
    }

    private void applyQuizFields(Quiz quiz, QuizCreateRequest request) {
        quiz.setTitle(request.title().trim());
        quiz.setPassingScore(request.passingScore());
        quiz.setMaxAttempts(request.maxAttempts());
    }

    private void replaceQuestions(Long quizId, QuizCreateRequest request) {
        for (QuestionRequest questionRequest : request.questions()) {
            Question question = new Question();
            question.setQuizId(quizId);
            question.setQuestionText(questionRequest.questionText());
            question.setType(questionRequest.type());
            question.setOrderIndex(questionRequest.orderIndex());
            question = questionRepository.save(question);

            Question savedQuestion = question;
            questionRequest.answers().forEach(answerRequest -> {
                AnswerOption answerOption = new AnswerOption();
                answerOption.setQuestionId(savedQuestion.getId());
                answerOption.setText(answerRequest.text());
                answerOption.setCorrect(answerRequest.correct());
                answerOptionRepository.save(answerOption);
            });
        }
    }

    private void validateQuestion(QuestionRequest request) {
        long correct = request.answers().stream().filter(answer -> answer.correct()).count();
        if (request.type() == QuestionType.SINGLE_CHOICE && correct != 1) {
            throw new BadRequestException("Single choice questions must have exactly one correct answer");
        }
        if (request.type() == QuestionType.TRUE_FALSE && request.answers().size() != 2) {
            throw new BadRequestException("True/false questions must have exactly two answer options");
        }
        if (request.type() == QuestionType.MULTIPLE_CHOICE && correct < 1) {
            throw new BadRequestException("Multiple choice questions must have at least one correct answer");
        }
    }
}
