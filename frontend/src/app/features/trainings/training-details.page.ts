import { Component, OnInit, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';

import { AuthService } from '../../core/auth/auth.service';
import { LessonResourceResponse, LessonResponse, QuestionCreateRequest, QuestionResponse, QuizAttemptResponse, QuizResponse, Role, TrainerLearnerResponse, TrainingResponse, TrainingStatus } from '../../core/models/api.models';
import { CertificateService } from '../../core/services/certificate.service';
import { LessonService } from '../../core/services/lesson.service';
import { ProgressService } from '../../core/services/progress.service';
import { QuizService } from '../../core/services/quiz.service';
import { ToastService } from '../../core/services/toast.service';
import { TrainingService } from '../../core/services/training.service';
import { parseApiError } from '../../core/utils/api-error.util';
import { environment } from '../../../environments/environment';
import { UiBadgeComponent } from '../../shared/ui/badge/ui-badge.component';
import { UiEmptyStateComponent } from '../../shared/ui/empty-state/ui-empty-state.component';
import { UiModalComponent } from '../../shared/ui/modal/ui-modal.component';
import { UiPageHeaderComponent } from '../../shared/ui/page-header/ui-page-header.component';
import { UiProgressBarComponent } from '../../shared/ui/progress-bar/ui-progress-bar.component';
import { UiSelectComponent } from '../../shared/ui/select/ui-select.component';
import { UiSkeletonComponent } from '../../shared/ui/skeleton/ui-skeleton.component';
import { UiSpinnerComponent } from '../../shared/ui/spinner/ui-spinner.component';
import { UiTextareaComponent } from '../../shared/ui/textarea/ui-textarea.component';

interface QuestionDraft {
  questionText: string;
  type: QuestionCreateRequest['type'];
  answers: Array<{ text: string; correct: boolean }>;
}

type ConfirmAction = 'publish' | 'archive' | 'delete' | 'removeLesson' | 'deleteQuiz' | null;

@Component({
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    UiPageHeaderComponent,
    UiBadgeComponent,
    UiSpinnerComponent,
    UiTextareaComponent,
    UiSelectComponent,
    UiProgressBarComponent,
    UiEmptyStateComponent,
    UiModalComponent,
    UiSkeletonComponent
  ],
  template: `
    <div class="page-stack">
      <ui-page-header eyebrow="Training details" [title]="training()?.title || 'Training'" [description]="training()?.shortDescription || 'Trainer-owned content ready for company assignment.'">
        <a class="btn btn-secondary" routerLink="/trainings">Back</a>
      </ui-page-header>

      @if (loading()) {
        <section class="card"><ui-skeleton [rows]="6" /></section>
      } @else if (training(); as current) {
        <section class="training-hero">
          <div class="hero-media">
            @if (current.thumbnailUrl) {
              <img [src]="current.thumbnailUrl" [alt]="current.title" />
            } @else {
              <span class="material-symbols-outlined">auto_stories</span>
            }
          </div>
          <article class="card hero-card">
            <div class="toolbar">
              <ui-badge [tone]="statusTone(current.status)">{{ current.status }}</ui-badge>
              <span class="muted">{{ current.durationMinutes || 0 }} min - {{ current.language || 'en' }}</span>
            </div>
            <h2>{{ current.title }}</h2>
            <p>{{ current.description || current.shortDescription || 'No detailed description yet.' }}</p>
            <div class="hero-chips">
              <span>{{ current.category || 'General' }}</span>
              <span>{{ levelLabel(current.level) }}</span>
              <span>{{ lessons().length }} lessons</span>
              @if (progressForTraining()) {
                <span>{{ progressForTraining()?.progressPercentage || 0 }}% complete</span>
              }
            </div>
            @if (progressForTraining()) {
              <ui-progress-bar [value]="progressForTraining()?.progressPercentage || 0" />
            }
            @if (canManageTraining()) {
              <div class="form-actions">
                <button class="btn btn-primary" type="button" (click)="openConfirm('publish')" [disabled]="busy() || current.status === 'PUBLISHED'">
                  <span class="material-symbols-outlined">publish</span>
                  Publish
                </button>
                <button class="btn btn-secondary" type="button" (click)="openConfirm('archive')" [disabled]="busy() || current.status === 'ARCHIVED'">Archive</button>
                <button class="btn btn-danger" type="button" (click)="openConfirm('delete')" [disabled]="busy()">Delete</button>
              </div>
            }
          </article>
        </section>

        @if (canManageTraining()) {
          <section class="trainer-grid">
            <form class="card form-grid" [formGroup]="trainingForm" (ngSubmit)="updateTraining()">
              <div class="section-title">
                <span class="material-symbols-outlined">edit_note</span>
                <div>
                  <h2>Edit training</h2>
                  <p class="muted">Update catalog details without changing the backend contract.</p>
                </div>
              </div>
              <label class="field"><span>Title</span><input class="control" formControlName="title" /></label>
              <label class="field"><span>Short description</span><input class="control" formControlName="shortDescription" /></label>
              <label class="field"><span>Description</span><ui-textarea formControlName="description" /></label>
              <div class="grid grid-3">
                <label class="field"><span>Category</span><input class="control" formControlName="category" /></label>
                <label class="field"><span>Level</span><ui-select [options]="levels" formControlName="level" /></label>
                <label class="field"><span>Language</span><input class="control" formControlName="language" /></label>
              </div>
              <div class="grid grid-3">
                <label class="field"><span>Duration</span><input class="control" type="number" min="0" formControlName="durationMinutes" /></label>
                <label class="field"><span>Price</span><input class="control" type="number" min="0" step="0.01" formControlName="price" /></label>
                <label class="field"><span>Intro video URL</span><input class="control" formControlName="introVideoUrl" /></label>
              </div>
              <label class="field"><span>Thumbnail URL</span><input class="control" formControlName="thumbnailUrl" /></label>
              <div class="form-actions">
                <button class="btn btn-primary" type="submit" [disabled]="trainingForm.invalid || busy()">Save training</button>
              </div>
            </form>

            <article class="card form-grid">
              <div class="section-title">
                <span class="material-symbols-outlined">task_alt</span>
                <div>
                  <h2>Approvals and certificates</h2>
                  <p class="muted">Review completed learners, approve or reject completion, then generate certificates.</p>
                </div>
              </div>
              @for (learner of learnersAwaitingApproval(); track learner.progressId || learner.learnerId) {
                <article class="learner-row">
                  <div>
                    <strong>{{ learner.firstName }} {{ learner.lastName }}</strong>
                    <small>{{ learner.email }} - {{ learner.progressPercentage }}% complete</small>
                  </div>
                  <div class="form-actions compact-actions">
                    <button class="btn btn-danger btn-sm" type="button" (click)="rejectLearner(learner)" [disabled]="busy() || !learner.progressId">Reject</button>
                    <button class="btn btn-primary" type="button" (click)="approveLearner(learner)" [disabled]="busy() || !learner.progressId || learner.assignmentStatus === 'APPROVED'">Approve</button>
                    <button class="btn btn-secondary" type="button" (click)="generateCertificate(learner)" [disabled]="busy() || !learner.progressId || learner.assignmentStatus !== 'APPROVED' || learner.certificateStatus === 'GENERATED'">Certificate</button>
                  </div>
                </article>
              } @empty {
                <p class="empty-inline">No learners are waiting for approval for this training.</p>
              }
            </article>

            <article class="card form-grid">
              <div class="section-title">
                <span class="material-symbols-outlined">groups</span>
                <div>
                  <h2>Learner management</h2>
                  <p class="muted">Edunet tracks pending, accepted and refused enrollments per course.</p>
                </div>
              </div>
              <div class="enrollment-status-grid">
                <span class="badge badge-warning">Pending {{ learnerCount('PENDING') }}</span>
                <span class="badge badge-info">In progress {{ learnerCount('IN_PROGRESS') }}</span>
                <span class="badge badge-success">Completed {{ learnerCount('COMPLETED') + learnerCount('APPROVED') }}</span>
                <span class="badge badge-danger">Rejected {{ learnerCount('REJECTED') }}</span>
              </div>
              <div class="learner-list">
                @for (learner of trainerLearners(); track learner.learnerId + '-' + learner.trainingId) {
                  <article class="learner-row">
                    <div>
                      <strong>{{ learner.firstName }} {{ learner.lastName }}</strong>
                      <small>{{ learner.email }}</small>
                    </div>
                    <ui-progress-bar [value]="learner.progressPercentage || 0" />
                    <span class="badge badge-info">{{ learner.assignmentStatus }}</span>
                  </article>
                } @empty {
                  <p class="empty-inline">No learners are attached to this training yet.</p>
                }
              </div>
            </article>
          </section>
        }

        <section class="course-workspace">
          <aside class="lesson-sidebar card">
            <div class="toolbar">
              <div>
                <h2>Lessons</h2>
                <span class="muted">{{ lessons().length }} total</span>
              </div>
              @if (canManageTraining()) {
                <button class="btn btn-secondary icon-btn" type="button" (click)="toggleLessonForm()">
                  <span class="material-symbols-outlined">{{ showLessonForm() ? 'close' : 'add' }}</span>
                </button>
              }
            </div>

            @if (showLessonForm() && canManageTraining()) {
              <form class="lesson-form" [formGroup]="lessonForm" (ngSubmit)="createLesson()">
                <label class="field"><span>Title</span><input class="control" formControlName="title" /></label>
                <label class="field"><span>Duration</span><input class="control" type="number" min="0" formControlName="durationMinutes" /></label>
                <label class="field"><span>Order</span><input class="control" type="number" min="0" formControlName="orderIndex" /></label>
                <label class="field"><span>Video URL</span><input class="control" formControlName="videoUrl" placeholder="https://..." /></label>
                <label class="field"><span>Lesson content</span><ui-textarea formControlName="content" placeholder="Write the first version of the lesson content." /></label>
                <label class="check-row"><input type="checkbox" formControlName="preview" /> Preview lesson</label>
                <button class="btn btn-primary" type="submit" [disabled]="lessonForm.invalid || busy()">Add lesson</button>
              </form>
            }

            <div class="lesson-list">
              @for (lesson of lessons(); track lesson.id) {
                <button class="lesson-nav" type="button" [class.active]="selectedLesson()?.id === lesson.id" (click)="selectLesson(lesson)">
                  <span>{{ lesson.orderIndex + 1 }}</span>
                  <strong>{{ lesson.title }}</strong>
                  <small>{{ lesson.durationMinutes || 0 }} min</small>
                </button>
              } @empty {
                <p class="empty-inline">No lessons yet. Trainers can add the first lesson from this panel.</p>
              }
            </div>
          </aside>

          <main class="lesson-main card">
            @if (selectedLesson(); as lesson) {
              <div class="lesson-head">
                <div>
                  <span class="lesson-eyebrow">Lesson {{ lesson.orderIndex + 1 }}</span>
                  <h2>{{ lesson.title }}</h2>
                  <p class="muted">{{ lesson.durationMinutes || 0 }} minutes</p>
                </div>
                @if (canManageTraining()) {
                  <button class="btn btn-danger btn-sm" type="button" (click)="selectedLessonForRemoval.set(lesson); openConfirm('removeLesson')" [disabled]="busy()">Remove</button>
                }
              </div>

              @if (canManageTraining()) {
                <form class="lesson-editor" [formGroup]="lessonContentForm" (ngSubmit)="updateSelectedLesson()">
                  <div class="grid grid-3">
                    <label class="field"><span>Title</span><input class="control" formControlName="title" /></label>
                    <label class="field"><span>Duration</span><input class="control" type="number" min="0" formControlName="durationMinutes" /></label>
                    <label class="field"><span>Order</span><input class="control" type="number" min="0" formControlName="orderIndex" /></label>
                  </div>
                  <label class="field"><span>Lesson content</span><ui-textarea formControlName="content" placeholder="Write the lesson content learners should read." /></label>
                  <label class="field"><span>Video URL</span><input class="control" formControlName="videoUrl" placeholder="https://..." /></label>
                  <label class="check-row"><input type="checkbox" formControlName="preview" /> Preview lesson</label>
                  <article class="resource-panel">
                    <div class="toolbar">
                      <div>
                        <strong>Lesson resources</strong>
                        <p class="muted">Attach PDFs, images or supporting files to this lesson.</p>
                      </div>
                      <label class="btn btn-secondary resource-upload">
                        <span class="material-symbols-outlined">upload_file</span>
                        Upload
                        <input type="file" (change)="uploadLessonResource($event)" />
                      </label>
                    </div>
                    @if (resourceUploadProgress() > 0 && resourceUploadProgress() < 100) {
                      <ui-progress-bar [value]="resourceUploadProgress()" />
                    }
                    <div class="resource-list">
                      @for (resource of lessonResources(); track resource.id) {
                        <article class="resource-row">
                          <span class="material-symbols-outlined">description</span>
                          <a [href]="resourceUrl(resource)" target="_blank" rel="noreferrer">{{ resource.originalName }}</a>
                          <small>{{ resourceSize(resource.size) }}</small>
                          <button class="btn btn-ghost" type="button" (click)="deleteLessonResource(resource)" [disabled]="busy()">Delete</button>
                        </article>
                      } @empty {
                        <p class="empty-inline">No resources uploaded for this lesson yet.</p>
                      }
                    </div>
                  </article>
                  <div class="form-actions">
                    <button class="btn btn-primary" type="submit" [disabled]="busy()">Save lesson content</button>
                  </div>
                </form>
              } @else {
                <article class="lesson-content">
                  @if (lesson.videoUrl) {
                    <a class="video-link" [href]="lesson.videoUrl" target="_blank" rel="noreferrer">
                      <span class="material-symbols-outlined">play_circle</span>
                      Open lesson video
                    </a>
                  }
                  @if (lesson.content) {
                    <div class="rich-copy" [innerHTML]="lesson.content"></div>
                  } @else {
                    <p class="empty-inline">This lesson does not have written content yet.</p>
                  }
                  @if (lessonResources().length) {
                    <div class="resource-list">
                      @for (resource of lessonResources(); track resource.id) {
                        <a class="resource-row" [href]="resourceUrl(resource)" target="_blank" rel="noreferrer">
                          <span class="material-symbols-outlined">description</span>
                          <strong>{{ resource.originalName }}</strong>
                          <small>{{ resourceSize(resource.size) }}</small>
                        </a>
                      }
                    </div>
                  }
                  @if (canLearn()) {
                    <button class="btn btn-primary" type="button" (click)="completeLesson(lesson)" [disabled]="busy()">
                      <span class="material-symbols-outlined">done_all</span>
                      Mark lesson completed
                    </button>
                  }
                </article>
              }

              <section class="quiz-panel">
                <div class="toolbar">
                  <div>
                    <h2>Quiz</h2>
                    <p class="muted">One quiz can be attached to each lesson with the current backend.</p>
                  </div>
                  @if (quizLoading()) { <ui-spinner /> }
                </div>

                @if (activeQuiz(); as quiz) {
                  <article class="quiz-card">
                    <div class="toolbar">
                      <div>
                        <h3>{{ quiz.title }}</h3>
                        <p class="muted">Passing score: {{ quiz.passingScore }}% - Max attempts: {{ quiz.maxAttempts }}</p>
                      </div>
                      @if (canManageTraining()) {
                        <div class="form-actions compact-actions">
                          <span class="badge" [class.badge-success]="quiz.published" [class.badge-warning]="!quiz.published">{{ quiz.published ? 'Published' : 'Draft' }}</span>
                          <button class="btn btn-secondary" type="button" (click)="editQuiz(quiz)" [disabled]="busy()">Edit</button>
                          <button class="btn btn-secondary" type="button" (click)="toggleQuizPublished(quiz)" [disabled]="busy()">{{ quiz.published ? 'Unpublish' : 'Publish' }}</button>
                          <button class="btn btn-danger btn-sm" type="button" (click)="openConfirm('deleteQuiz')" [disabled]="busy()">Delete</button>
                        </div>
                      }
                    </div>

                    <div class="question-list">
                      @for (question of quiz.questions || []; track question.id) {
                        <article class="quiz-question">
                          <header>
                            <h4>{{ question.questionText }}</h4>
                            <span class="badge badge-info">{{ question.type.replaceAll('_', ' ') }}</span>
                          </header>
                          @for (answer of question.answers || []; track answer.id) {
                            <label class="answer-card" [class.selected]="isSelected(question.id, answer.id)">
                              <input
                                [type]="question.type === 'MULTIPLE_CHOICE' ? 'checkbox' : 'radio'"
                                [name]="'question-' + question.id"
                                [checked]="isSelected(question.id, answer.id)"
                                (change)="toggleAnswer(question.id, answer.id, question.type, $any($event.target).checked)"
                              />
                              <span>{{ answer.text }}</span>
                            </label>
                          }
                        </article>
                      }
                    </div>

                    @if (quizAttempt()) {
                      <div class="score-card">
                        <div class="score-ring" [style.--score]="scoreValue()"><span>{{ quizAttempt()?.score }}%</span></div>
                        <div>
                          <h3>{{ quizAttempt()?.passed ? 'Passed with confidence' : 'Keep practicing' }}</h3>
                          <p class="muted">Attempt {{ quizAttempt()?.attemptNumber }} - {{ quizAttempt()?.passed ? 'This score meets the passing threshold.' : 'Review the lesson and try again.' }}</p>
                        </div>
                      </div>
                    }

                    @if (canLearn()) {
                      <button class="btn btn-primary" type="button" (click)="submitQuiz()" [disabled]="busy() || !(quiz.questions || []).length">Submit quiz</button>
                    }
                  </article>
                } @else if (!quizLoading() && canManageTraining()) {
                  <form class="quiz-builder" [formGroup]="quizForm" (ngSubmit)="createQuiz()">
                    <div class="grid grid-3">
                      <label class="field"><span>Quiz title</span><input class="control" formControlName="title" /></label>
                      <label class="field"><span>Passing score</span><input class="control" type="number" min="0" max="100" formControlName="passingScore" /></label>
                      <label class="field"><span>Max attempts</span><input class="control" type="number" min="1" formControlName="maxAttempts" /></label>
                    </div>

                    <div class="question-builder-list">
                      @for (question of questionDrafts(); track $index; let questionIndex = $index) {
                        <article class="question-builder">
                          <div class="toolbar">
                            <strong>Question {{ questionIndex + 1 }}</strong>
                            <button class="btn btn-ghost" type="button" (click)="removeQuestion(questionIndex)" [disabled]="questionDrafts().length === 1">Remove</button>
                          </div>
                          <label class="field">
                            <span>Question text</span>
                            <input class="control" [value]="question.questionText" (input)="updateQuestionText(questionIndex, $any($event.target).value)" />
                          </label>
                          <label class="field">
                            <span>Type</span>
                            <select class="control" [value]="question.type" (change)="updateQuestionType(questionIndex, $any($event.target).value)">
                              <option value="SINGLE_CHOICE">Single choice</option>
                              <option value="MULTIPLE_CHOICE">Multiple choice</option>
                              <option value="TRUE_FALSE">True / false</option>
                            </select>
                          </label>
                          <div class="answer-builder">
                            @for (answer of question.answers; track $index; let answerIndex = $index) {
                              <label class="answer-edit-row">
                                <input
                                  [type]="question.type === 'MULTIPLE_CHOICE' ? 'checkbox' : 'radio'"
                                  [name]="'draft-question-' + questionIndex"
                                  [checked]="answer.correct"
                                  (change)="updateAnswerCorrect(questionIndex, answerIndex, $any($event.target).checked)"
                                />
                                <input class="control" [value]="answer.text" (input)="updateAnswerText(questionIndex, answerIndex, $any($event.target).value)" />
                              </label>
                            }
                          </div>
                        </article>
                      }
                    </div>
                    <div class="form-actions">
                      <button class="btn btn-secondary" type="button" (click)="addQuestion()">Add question</button>
                      <button class="btn btn-primary" type="submit" [disabled]="quizForm.invalid || busy()">{{ editingQuizId() ? 'Update quiz' : 'Create quiz' }}</button>
                    </div>
                  </form>
                } @else if (!quizLoading()) {
                  <ui-empty-state icon="quiz" title="No quiz yet" description="This lesson does not have an available quiz." />
                }
              </section>
            } @else {
              <ui-empty-state icon="menu_book" title="Select a lesson" description="Choose a lesson from the left to manage content or continue learning." />
            }
          </main>
        </section>
      } @else {
        <ui-empty-state icon="error" title="Training not found" description="This training does not exist, is not published, or you do not have access." />
      }

      <ui-modal [title]="confirmTitle()" [open]="confirmAction() !== null" (closed)="confirmAction.set(null)">
        <div class="confirm-stack">
          <p>{{ confirmBody() }}</p>
          <div class="form-actions">
            <button class="btn btn-secondary" type="button" (click)="confirmAction.set(null)" [disabled]="busy()">Cancel</button>
            <button class="btn btn-primary" type="button" (click)="runConfirmedAction()" [disabled]="busy()">Confirm</button>
          </div>
        </div>
      </ui-modal>
    </div>
  `,
  styles: [`
    .training-hero { display: grid; grid-template-columns: minmax(260px, 0.42fr) minmax(0, 1fr); gap: 24px; align-items: stretch; }
    .hero-media { min-height: 330px; display: grid; place-items: center; overflow: hidden; border-radius: var(--radius-xl); color: #fff; background: linear-gradient(135deg, var(--color-primary), var(--color-accent)); box-shadow: var(--shadow-card); }
    .hero-media img { width: 100%; height: 100%; object-fit: cover; }
    .hero-media .material-symbols-outlined { font-size: 72px; }
    .hero-card { display: grid; gap: 18px; align-content: center; }
    .hero-card h2 { margin: 0; color: var(--color-heading); font-size: 34px; line-height: 1.14; font-weight: 900; }
    .hero-card p { margin: 0; color: var(--color-muted); font-size: 15px; line-height: 1.75; }
    .hero-chips { display: flex; flex-wrap: wrap; gap: 9px; }
    .hero-chips span { padding: 7px 12px; border-radius: 999px; background: var(--color-primary-soft); color: var(--color-primary-strong); }
    .trainer-grid { display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(300px, 0.7fr); gap: 24px; align-items: start; }
    .trainer-grid form { grid-row: span 2; }
    .section-title { display: flex; gap: 14px; align-items: flex-start; }
    .section-title > span { display: grid; place-items: center; width: 42px; height: 42px; border-radius: 14px; background: var(--color-primary-soft); color: var(--color-primary); }
    h2, h3, p { margin: 0; }
    h2 { color: var(--color-heading); font-size: 20px; font-weight: 900; }
    h3 { color: var(--color-heading); font-size: 18px; font-weight: 900; }
    .danger-action { color: var(--color-danger-strong); }
    .enrollment-status-grid { display: flex; gap: 8px; flex-wrap: wrap; }
    .answer-card { display: flex; align-items: center; gap: 12px; padding: 12px 16px; border: 1px solid var(--color-border); border-radius: var(--radius-lg); background: var(--color-surface-soft); cursor: pointer; transition: border-color 180ms ease, background 180ms ease; }
    .answer-card:hover { border-color: var(--color-border-strong); background: rgba(238, 242, 255, 0.6); }
    .answer-card.selected { border-color: var(--color-primary); background: rgba(238, 242, 255, 0.9); box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.18); }
    .quiz-question { display: grid; gap: 12px; padding: var(--space-4); border: 1px solid var(--color-border); border-radius: var(--radius-lg); background: var(--color-surface); }
    .quiz-question header { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
    .quiz-question h4 { margin: 0; color: var(--color-heading); font-size: 15px; font-weight: 850; }
    .score-card { display: grid; grid-template-columns: auto 1fr; gap: var(--space-4); align-items: center; padding: var(--space-4); border: 1px solid var(--color-border); border-radius: var(--radius-lg); background: var(--color-surface-soft); }
    .score-ring { position: relative; display: grid; place-items: center; width: 80px; height: 80px; border-radius: 50%; background: conic-gradient(var(--color-primary) var(--score, 0%), rgba(215,227,248,0.6) 0); }
    .score-ring::before { content: ''; position: absolute; inset: 8px; border-radius: 50%; background: var(--color-surface-soft); }
    .score-ring span { position: relative; z-index: 1; font-size: 18px; font-weight: 900; color: var(--color-heading); }
    .score-card h3 { margin: 0; color: var(--color-heading); font-size: 16px; }
    .course-workspace { display: grid; grid-template-columns: minmax(260px, 0.34fr) minmax(0, 1fr); gap: 24px; align-items: start; }
    .lesson-sidebar { position: sticky; top: 92px; display: grid; gap: 16px; }
    .icon-btn { width: 42px; padding: 0; }
    .lesson-form, .lesson-list, .lesson-editor, .lesson-content, .quiz-panel, .quiz-card, .quiz-builder, .question-builder-list, .confirm-stack { display: grid; gap: 14px; }
    .check-row { display: flex; align-items: center; gap: 10px; color: var(--color-muted); font-weight: 800; }
    .lesson-nav { display: grid; grid-template-columns: 34px 1fr auto; gap: 10px; align-items: center; width: 100%; padding: 11px 12px; border-radius: 14px; background: transparent; color: var(--color-text); text-align: left; cursor: pointer; }
    .lesson-nav:hover, .lesson-nav.active { background: var(--color-primary-soft); }
    .lesson-nav span { display: grid; place-items: center; width: 30px; height: 30px; border-radius: 10px; background: linear-gradient(135deg, var(--color-primary), var(--color-accent)); color: #fff; font-size: 12px; font-weight: 900; }
    .lesson-nav strong { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .lesson-nav small { color: var(--color-muted); font-weight: 800; }
    .lesson-main { display: grid; gap: 22px; min-width: 0; }
    .lesson-head { display: flex; justify-content: space-between; gap: 16px; align-items: flex-start; padding-bottom: 18px; border-bottom: 1px solid var(--color-border); }
    .lesson-eyebrow { display: inline-flex; margin-bottom: 8px; color: var(--color-primary); font-size: 12px; font-weight: 900; letter-spacing: 0.08em; text-transform: uppercase; }
    .rich-copy { padding: 18px; border: 1px solid var(--color-border); border-radius: var(--radius-lg); background: var(--color-surface-soft); line-height: 1.8; }
    .video-link { display: inline-flex; align-items: center; gap: 10px; width: fit-content; padding: 11px 14px; border-radius: var(--radius-lg); background: var(--color-primary-soft); color: var(--color-primary-strong); }
    .resource-panel { display: grid; gap: 14px; padding: 14px; border: 1px dashed var(--color-border-strong); border-radius: var(--radius-lg); background: rgba(248,250,252,0.86); }
    .resource-upload { position: relative; overflow: hidden; }
    .resource-upload input { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
    .resource-list, .learner-list { display: grid; gap: 10px; }
    .resource-row, .learner-row { display: grid; grid-template-columns: 38px minmax(0, 1fr) auto auto; gap: 10px; align-items: center; padding: 12px; border: 1px solid var(--color-border); border-radius: var(--radius-lg); background: var(--color-surface-soft); }
    .resource-row > span { display: grid; place-items: center; width: 38px; height: 38px; border-radius: 12px; color: var(--color-primary); background: var(--color-primary-soft); }
    .resource-row a, .resource-row strong, .learner-row strong { min-width: 0; overflow: hidden; color: var(--color-heading); text-overflow: ellipsis; white-space: nowrap; }
    .resource-row small, .learner-row small { color: var(--color-muted); }
    .learner-row { grid-template-columns: minmax(0, 1fr) minmax(120px, 180px) auto; }
    .compact-actions { gap: 8px; justify-content: flex-end; flex-wrap: wrap; }
    .quiz-panel { padding-top: 22px; border-top: 1px solid var(--color-border); }
    .question-list, .answer-builder { display: grid; gap: 12px; }
    fieldset { display: grid; gap: 10px; padding: 16px; border: 1px solid var(--color-border); border-radius: var(--radius-lg); }
    legend { padding: 0 8px; color: var(--color-heading); font-weight: 900; }
    .answer-row, .answer-edit-row { display: flex; align-items: center; gap: 10px; }
    .answer-edit-row .control { flex: 1; }
    .question-builder { display: grid; gap: 13px; padding: 16px; border: 1px solid var(--color-border); border-radius: var(--radius-lg); }
    @media (max-width: 1040px) { .training-hero, .trainer-grid, .course-workspace { grid-template-columns: 1fr; } .lesson-sidebar { position: static; } }
    @media (max-width: 620px) { .hero-card h2 { font-size: 26px; } .lesson-head { flex-direction: column; } .lesson-nav { grid-template-columns: 34px 1fr; } .lesson-nav small { grid-column: 2; } }
  `]
})
export class TrainingDetailsPage implements OnInit {
  private readonly apiRoot = environment.apiBaseUrl.replace(/\/api\/v1$/, '');
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly trainings = inject(TrainingService);
  private readonly lessonService = inject(LessonService);
  private readonly quizService = inject(QuizService);
  private readonly progressService = inject(ProgressService);
  private readonly certificateService = inject(CertificateService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);

  readonly training = signal<TrainingResponse | null>(null);
  readonly lessons = signal<LessonResponse[]>([]);
  readonly selectedLesson = signal<LessonResponse | null>(null);
  readonly selectedLessonForRemoval = signal<LessonResponse | null>(null);
  readonly activeQuiz = signal<QuizResponse | null>(null);
  readonly quizAttempt = signal<QuizAttemptResponse | null>(null);
  readonly trainerLearners = signal<TrainerLearnerResponse[]>([]);
  readonly lessonResources = signal<LessonResourceResponse[]>([]);
  readonly selectedAnswers = signal<Record<number, number[]>>({});
  readonly progressForTraining = signal<{ progressPercentage: number; status: string } | null>(null);
  readonly loading = signal(true);
  readonly quizLoading = signal(false);
  readonly busy = signal(false);
  readonly showLessonForm = signal(false);
  readonly confirmAction = signal<ConfirmAction>(null);
  readonly questionDrafts = signal<QuestionDraft[]>([this.defaultQuestion()]);
  readonly editingQuizId = signal<number | null>(null);
  readonly resourceUploadProgress = signal(0);

  readonly levels = [
    { label: 'Beginner', value: 'BEGINNER' },
    { label: 'Intermediate', value: 'INTERMEDIATE' },
    { label: 'Advanced', value: 'ADVANCED' }
  ];

  readonly trainingForm = this.fb.group({
    title: ['', Validators.required],
    shortDescription: [''],
    description: [''],
    thumbnailUrl: [''],
    introVideoUrl: [''],
    category: [''],
    level: ['BEGINNER', Validators.required],
    language: ['en', Validators.required],
    durationMinutes: [0, [Validators.required, Validators.min(0)]],
    price: [0, [Validators.required, Validators.min(0)]]
  });

  readonly lessonForm = this.fb.group({
    title: ['', Validators.required],
    content: [''],
    videoUrl: [''],
    durationMinutes: [0, [Validators.required, Validators.min(0)]],
    orderIndex: [0, [Validators.required, Validators.min(0)]],
    preview: [false]
  });

  readonly lessonContentForm = this.fb.group({
    title: ['', Validators.required],
    content: [''],
    videoUrl: [''],
    durationMinutes: [0, [Validators.required, Validators.min(0)]],
    orderIndex: [0, [Validators.required, Validators.min(0)]],
    preview: [false]
  });

  readonly quizForm = this.fb.group({
    title: ['', Validators.required],
    passingScore: [70, [Validators.required, Validators.min(0), Validators.max(100)]],
    maxAttempts: [3, [Validators.required, Validators.min(1)]]
  });

  ngOnInit(): void {
    this.auth.ensureCurrentUser().pipe(catchError(() => of(null))).subscribe(() => this.load());
  }

  canManageTraining(): boolean {
    return this.hasAnyRole(['TRAINER', 'SUPER_ADMIN']);
  }

  canLearn(): boolean {
    return this.hasAnyRole(['LEARNER', 'TEAM_MANAGER', 'COMPANY_ADMIN']);
  }

  learnerCount(status: TrainerLearnerResponse['assignmentStatus']): number {
    return this.trainerLearners().filter((learner) => learner.assignmentStatus === status).length;
  }

  learnersAwaitingApproval(): TrainerLearnerResponse[] {
    return this.trainerLearners().filter((learner) => ['COMPLETED', 'APPROVED'].includes(learner.progressStatus || learner.assignmentStatus));
  }

  statusTone(status: TrainingStatus): 'success' | 'warning' | 'danger' | 'info' {
    if (status === 'PUBLISHED') {
      return 'success';
    }
    if (status === 'ARCHIVED') {
      return 'danger';
    }
    return 'warning';
  }

  levelLabel(level: string): string {
    return level ? level.replaceAll('_', ' ').toLowerCase() : 'all levels';
  }

  toggleLessonForm(): void {
    this.showLessonForm.update((value) => !value);
    this.lessonForm.patchValue({ orderIndex: this.lessons().length });
  }

  updateTraining(): void {
    const id = this.training()?.id;
    if (!id || this.trainingForm.invalid) {
      return;
    }
    this.busy.set(true);
    const payload = this.trainingForm.getRawValue();
    this.trainings.update(id, {
      ...payload,
      level: payload.level as 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED',
      durationMinutes: Number(payload.durationMinutes),
      price: Number(payload.price)
    }).subscribe({
      next: (response) => {
        this.training.set(response.data ?? null);
        this.busy.set(false);
        this.toast.success(response.message || 'Training updated.');
      },
      error: (error) => {
        this.busy.set(false);
        this.toast.error(parseApiError(error).message);
      }
    });
  }

  createLesson(): void {
    const trainingId = this.training()?.id;
    if (!trainingId || this.lessonForm.invalid) {
      return;
    }
    this.busy.set(true);
    const payload = this.lessonForm.getRawValue();
    this.lessonService.create(trainingId, {
      title: payload.title,
      content: payload.content,
      videoUrl: payload.videoUrl,
      durationMinutes: Number(payload.durationMinutes),
      orderIndex: Number(payload.orderIndex),
      preview: Boolean(payload.preview)
    }).subscribe({
      next: (response) => {
        this.busy.set(false);
        this.showLessonForm.set(false);
        this.lessonForm.reset({ title: '', content: '', videoUrl: '', durationMinutes: 0, orderIndex: this.lessons().length + 1, preview: false });
        if (response.data) {
          this.lessons.update((lessons) => [...lessons, response.data!].sort((left, right) => left.orderIndex - right.orderIndex));
          this.selectLesson(response.data);
        }
        this.toast.success(response.message || 'Lesson added.');
      },
      error: (error) => {
        this.busy.set(false);
        this.toast.error(parseApiError(error).message);
      }
    });
  }

  updateSelectedLesson(): void {
    const lesson = this.selectedLesson();
    if (!lesson) {
      return;
    }
    this.busy.set(true);
    const content = this.lessonContentForm.getRawValue();
    this.lessonService.update(lesson.id, {
      title: content.title,
      content: content.content,
      videoUrl: content.videoUrl,
      durationMinutes: Number(content.durationMinutes),
      orderIndex: Number(content.orderIndex),
      preview: Boolean(content.preview)
    }).subscribe({
      next: (response) => {
        this.busy.set(false);
        const updated = response.data;
        if (updated) {
          this.selectedLesson.set(updated);
          this.lessons.update((lessons) => lessons.map((item) => item.id === updated.id ? updated : item));
        }
        this.toast.success(response.message || 'Lesson updated.');
      },
      error: (error) => {
        this.busy.set(false);
        this.toast.error(parseApiError(error).message);
      }
    });
  }

  selectLesson(lesson: LessonResponse): void {
    this.selectedLesson.set(lesson);
    this.lessonContentForm.patchValue({
      title: lesson.title,
      content: lesson.content ?? '',
      videoUrl: lesson.videoUrl ?? '',
      durationMinutes: Number(lesson.durationMinutes ?? 0),
      orderIndex: Number(lesson.orderIndex ?? 0),
      preview: Boolean(lesson.preview)
    });
    this.activeQuiz.set(null);
    this.quizAttempt.set(null);
    this.selectedAnswers.set({});
    this.editingQuizId.set(null);
    this.lessonResources.set([]);
    this.loadLessonResources(lesson.id);
    this.quizLoading.set(true);
    this.quizService.getByLesson(lesson.id).subscribe({
      next: (response) => {
        this.activeQuiz.set(response.data ?? null);
        this.quizLoading.set(false);
      },
      error: () => {
        this.activeQuiz.set(null);
        this.quizLoading.set(false);
      }
    });
  }

  completeLesson(lesson: LessonResponse): void {
    const previousProgress = this.progressForTraining();
    const nextProgress = Math.min(100, Number(previousProgress?.progressPercentage ?? 0) + Math.ceil(100 / Math.max(this.lessons().length, 1)));
    this.progressForTraining.set({ progressPercentage: nextProgress, status: nextProgress >= 100 ? 'COMPLETED' : 'IN_PROGRESS' });
    this.busy.set(true);
    this.lessonService.complete(lesson.id).subscribe({
      next: (response) => {
        this.busy.set(false);
        if (response.data) {
          this.progressForTraining.set({ progressPercentage: Number(response.data.progressPercentage ?? 0), status: response.data.status });
        }
        this.toast.success(response.message || 'Lesson completed.');
      },
      error: (error) => {
        this.busy.set(false);
        this.progressForTraining.set(previousProgress);
        this.toast.error(parseApiError(error).message);
      }
    });
  }

  createQuiz(): void {
    const lesson = this.selectedLesson();
    if (!lesson || this.quizForm.invalid || !this.validQuestionDrafts()) {
      this.toast.error('Add a quiz title, at least one question, two answers, and a correct answer.');
      return;
    }
    const form = this.quizForm.getRawValue();
    const payload = {
      title: form.title,
      passingScore: Number(form.passingScore),
      maxAttempts: Number(form.maxAttempts),
      questions: this.questionDrafts().map((question, index) => ({
        questionText: question.questionText.trim(),
        type: question.type,
        orderIndex: index,
        answers: question.answers.map((answer) => ({ text: answer.text.trim(), correct: answer.correct }))
      }))
    };
    const existingQuizId = this.editingQuizId();
    this.busy.set(true);
    const request = existingQuizId ? this.quizService.update(existingQuizId, payload) : this.quizService.create(lesson.id, payload);
    request.subscribe({
      next: (response) => {
        this.busy.set(false);
        this.activeQuiz.set(response.data ?? null);
        this.questionDrafts.set([this.defaultQuestion()]);
        this.editingQuizId.set(null);
        this.toast.success(response.message || (existingQuizId ? 'Quiz updated.' : 'Quiz created.'));
      },
      error: (error) => {
        this.busy.set(false);
        this.toast.error(parseApiError(error).message);
      }
    });
  }

  addQuestion(): void {
    this.questionDrafts.update((questions) => [...questions, this.defaultQuestion()]);
  }

  removeQuestion(index: number): void {
    this.questionDrafts.update((questions) => questions.filter((_, questionIndex) => questionIndex !== index));
  }

  updateQuestionText(index: number, value: string): void {
    this.questionDrafts.update((questions) => questions.map((question, questionIndex) => questionIndex === index ? { ...question, questionText: value } : question));
  }

  updateQuestionType(index: number, value: string): void {
    const type = value as QuestionCreateRequest['type'];
    this.questionDrafts.update((questions) => questions.map((question, questionIndex) => {
      if (questionIndex !== index) {
        return question;
      }
      const answers = type === 'TRUE_FALSE'
        ? [{ text: 'True', correct: true }, { text: 'False', correct: false }]
        : question.answers.slice(0, Math.max(2, question.answers.length));
      return { ...question, type, answers };
    }));
  }

  updateAnswerText(questionIndex: number, answerIndex: number, value: string): void {
    this.questionDrafts.update((questions) => questions.map((question, currentQuestionIndex) => {
      if (currentQuestionIndex !== questionIndex) {
        return question;
      }
      return {
        ...question,
        answers: question.answers.map((answer, currentAnswerIndex) => currentAnswerIndex === answerIndex ? { ...answer, text: value } : answer)
      };
    }));
  }

  updateAnswerCorrect(questionIndex: number, answerIndex: number, checked: boolean): void {
    this.questionDrafts.update((questions) => questions.map((question, currentQuestionIndex) => {
      if (currentQuestionIndex !== questionIndex) {
        return question;
      }
      return {
        ...question,
        answers: question.answers.map((answer, currentAnswerIndex) => ({
          ...answer,
          correct: question.type === 'MULTIPLE_CHOICE'
            ? (currentAnswerIndex === answerIndex ? checked : answer.correct)
            : currentAnswerIndex === answerIndex
        }))
      };
    }));
  }

  toggleAnswer(questionId: number, answerId: number, type: QuestionResponse['type'], checked: boolean): void {
    this.selectedAnswers.update((answers) => {
      const current = answers[questionId] ?? [];
      if (type !== 'MULTIPLE_CHOICE') {
        return { ...answers, [questionId]: [answerId] };
      }
      return {
        ...answers,
        [questionId]: checked ? [...current, answerId] : current.filter((id) => id !== answerId)
      };
    });
  }

  isSelected(questionId: number, answerId: number): boolean {
    return (this.selectedAnswers()[questionId] ?? []).includes(answerId);
  }

  scoreValue(): string {
    return `${Math.max(0, Math.min(100, Number(this.quizAttempt()?.score ?? 0)))}%`;
  }

  submitQuiz(): void {
    const quiz = this.activeQuiz();
    if (!quiz) {
      return;
    }
    this.busy.set(true);
    this.quizService.submit(quiz.id, {
      answers: (quiz.questions ?? []).map((question) => ({
        questionId: question.id,
        selectedOptionIds: this.selectedAnswers()[question.id] ?? []
      }))
    }).subscribe({
      next: (response) => {
        this.busy.set(false);
        this.quizAttempt.set(response.data ?? null);
        this.toast.success(response.message || 'Quiz submitted.');
        this.loadProgress();
      },
      error: (error) => {
        this.busy.set(false);
        this.toast.error(parseApiError(error).message);
      }
    });
  }

  editQuiz(quiz: QuizResponse): void {
    this.editingQuizId.set(quiz.id);
    this.activeQuiz.set(null);
    this.quizForm.patchValue({
      title: quiz.title,
      passingScore: quiz.passingScore,
      maxAttempts: quiz.maxAttempts
    });
    this.questionDrafts.set((quiz.questions ?? []).map((question) => ({
      questionText: question.questionText,
      type: question.type,
      answers: (question.answers ?? []).map((answer) => ({
        text: answer.text,
        correct: Boolean(answer.correct)
      }))
    })));
  }

  toggleQuizPublished(quiz: QuizResponse): void {
    this.busy.set(true);
    const request = quiz.published ? this.quizService.unpublish(quiz.id) : this.quizService.publish(quiz.id);
    request.subscribe({
      next: (response) => {
        this.busy.set(false);
        this.activeQuiz.set(response.data ?? null);
        this.toast.success(response.message || 'Quiz updated.');
      },
      error: (error) => {
        this.busy.set(false);
        this.toast.error(parseApiError(error).message);
      }
    });
  }

  uploadLessonResource(event: Event): void {
    const lesson = this.selectedLesson();
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!lesson || !file) {
      return;
    }
    this.resourceUploadProgress.set(0);
    this.lessonService.uploadResource(lesson.id, file).subscribe({
      next: (state) => {
        this.resourceUploadProgress.set(state.progress);
        if (state.resource) {
          this.lessonResources.update((resources) => [state.resource!, ...resources]);
          this.toast.success('Lesson resource uploaded.');
          input.value = '';
        }
      },
      error: (error) => {
        this.resourceUploadProgress.set(0);
        this.toast.error(parseApiError(error).message);
      }
    });
  }

  deleteLessonResource(resource: LessonResourceResponse): void {
    this.busy.set(true);
    this.lessonService.deleteResource(resource.id).subscribe({
      next: (response) => {
        this.busy.set(false);
        this.lessonResources.update((resources) => resources.filter((item) => item.id !== resource.id));
        this.toast.success(response.message || 'Resource deleted.');
      },
      error: (error) => {
        this.busy.set(false);
        this.toast.error(parseApiError(error).message);
      }
    });
  }

  approveLearner(learner: TrainerLearnerResponse): void {
    if (!learner.progressId) {
      return;
    }
    this.busy.set(true);
    this.progressService.approve(learner.progressId).subscribe({
      next: () => {
        this.busy.set(false);
        this.trainerLearners.update((learners) => learners.map((item) => item.progressId === learner.progressId ? { ...item, assignmentStatus: 'APPROVED', progressStatus: 'APPROVED' } : item));
        this.toast.success('Learner completion approved.');
      },
      error: (error) => {
        this.busy.set(false);
        this.toast.error(parseApiError(error).message);
      }
    });
  }

  rejectLearner(learner: TrainerLearnerResponse): void {
    if (!learner.progressId) {
      return;
    }
    this.busy.set(true);
    this.progressService.reject(learner.progressId).subscribe({
      next: () => {
        this.busy.set(false);
        this.trainerLearners.update((learners) => learners.map((item) => item.progressId === learner.progressId ? { ...item, assignmentStatus: 'REJECTED', progressStatus: 'REJECTED' } : item));
        this.toast.success('Learner completion rejected.');
      },
      error: (error) => {
        this.busy.set(false);
        this.toast.error(parseApiError(error).message);
      }
    });
  }

  generateCertificate(learner: TrainerLearnerResponse): void {
    if (!learner.progressId) {
      return;
    }
    this.busy.set(true);
    this.certificateService.generate(learner.progressId).subscribe({
      next: (response) => {
        this.busy.set(false);
        this.trainerLearners.update((learners) => learners.map((item) => item.progressId === learner.progressId ? { ...item, certificateStatus: 'GENERATED' } : item));
        this.toast.success(response.message || 'Certificate generated.');
      },
      error: (error) => {
        this.busy.set(false);
        this.toast.error(parseApiError(error).message);
      }
    });
  }

  resourceSize(size: number): string {
    if (size < 1024) {
      return `${size} B`;
    }
    if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(1)} KB`;
    }
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }

  resourceUrl(resource: LessonResourceResponse): string {
    return resource.fileUrl.startsWith('http') ? resource.fileUrl : `${this.apiRoot}${resource.fileUrl}`;
  }

  openConfirm(action: ConfirmAction): void {
    this.confirmAction.set(action);
  }

  confirmTitle(): string {
    switch (this.confirmAction()) {
      case 'publish':
        return 'Publish training';
      case 'archive':
        return 'Archive training';
      case 'delete':
        return 'Delete training';
      case 'removeLesson':
        return 'Remove lesson';
      case 'deleteQuiz':
        return 'Delete quiz';
      default:
        return 'Confirm action';
    }
  }

  confirmBody(): string {
    switch (this.confirmAction()) {
      case 'publish':
        return 'This training will become visible to eligible learners and assignment flows.';
      case 'archive':
        return 'This training will be removed from the active catalog while keeping its record.';
      case 'delete':
        return 'This deletes the training record. Continue only if this is not needed for a demo.';
      case 'removeLesson':
        return `Remove ${this.selectedLessonForRemoval()?.title || 'this lesson'} from the training?`;
      case 'deleteQuiz':
        return `Delete ${this.activeQuiz()?.title || 'this quiz'} and its questions? Existing learner attempts for this quiz will also be removed by the backend.`;
      default:
        return '';
    }
  }

  runConfirmedAction(): void {
    const action = this.confirmAction();
    if (!action) {
      return;
    }
    if (action === 'removeLesson') {
      this.removeSelectedLesson();
      return;
    }
    if (action === 'deleteQuiz') {
      this.deleteActiveQuiz();
      return;
    }
    const id = this.training()?.id;
    if (!id) {
      return;
    }
    this.busy.set(true);
    if (action === 'delete') {
      this.trainings.remove(id).subscribe({
        next: (response) => {
          this.busy.set(false);
          this.confirmAction.set(null);
          this.toast.success(response.message || 'Training deleted.');
          void this.router.navigate(['/trainings']);
        },
        error: (error) => {
          this.busy.set(false);
          this.toast.error(parseApiError(error).message);
        }
      });
      return;
    }

    const previousTraining = this.training();
    this.training.update((training) => training ? { ...training, status: action === 'publish' ? 'PUBLISHED' : 'ARCHIVED' } : training);
    const request = action === 'publish' ? this.trainings.publish(id) : this.trainings.archive(id);
    request.subscribe({
      next: (response) => {
        this.busy.set(false);
        this.confirmAction.set(null);
        this.training.set(response.data ?? null);
        this.toast.success(response.message || 'Training updated.');
      },
      error: (error) => {
        this.busy.set(false);
        this.training.set(previousTraining);
        this.toast.error(parseApiError(error).message);
      }
    });
  }

  private load(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.loading.set(false);
      return;
    }
    this.trainings.get(id).subscribe({
      next: (response) => {
        const training = response.data ?? null;
        this.training.set(training);
        if (training) {
          this.patchTrainingForm(training);
          this.loadLessons(training.id);
          this.loadProgress();
          this.loadTrainingLearners(training.id);
          return;
        }
        this.loading.set(false);
      },
      error: (error) => {
        this.loading.set(false);
        this.toast.error(parseApiError(error).message);
      }
    });
  }

  private loadLessons(trainingId: number): void {
    this.lessonService.listByTraining(trainingId).subscribe({
      next: (response) => {
        const lessons = (response.data ?? []).sort((left, right) => left.orderIndex - right.orderIndex);
        this.lessons.set(lessons);
        this.lessonForm.patchValue({ orderIndex: lessons.length });
        if (lessons.length) {
          this.selectLesson(lessons[0]);
        }
        this.loading.set(false);
      },
      error: () => {
        this.lessons.set([]);
        this.loading.set(false);
      }
    });
  }

  private loadProgress(): void {
    const trainingId = this.training()?.id;
    if (!trainingId || !this.canLearn()) {
      this.progressForTraining.set(null);
      return;
    }
    this.progressService.my().pipe(catchError(() => of(null))).subscribe((response) => {
      const progress = response?.data?.find((item) => item.trainingId === trainingId);
      this.progressForTraining.set(progress ? { progressPercentage: Number(progress.progressPercentage ?? 0), status: progress.status } : null);
    });
  }

  private loadTrainingLearners(trainingId: number): void {
    if (!this.canManageTraining()) {
      this.trainerLearners.set([]);
      return;
    }
    this.trainings.learners(trainingId).pipe(catchError(() => of(null))).subscribe((response) => {
      this.trainerLearners.set(response?.data ?? []);
    });
  }

  private loadLessonResources(lessonId: number): void {
    this.lessonService.resources(lessonId).pipe(catchError(() => of(null))).subscribe((response) => {
      this.lessonResources.set(response?.data ?? []);
    });
  }

  private patchTrainingForm(training: TrainingResponse): void {
    this.trainingForm.patchValue({
      title: training.title,
      shortDescription: training.shortDescription ?? '',
      description: training.description ?? '',
      thumbnailUrl: training.thumbnailUrl ?? '',
      introVideoUrl: training.introVideoUrl ?? '',
      category: training.category ?? '',
      level: training.level || 'BEGINNER',
      language: training.language || 'en',
      durationMinutes: Number(training.durationMinutes ?? 0),
      price: Number(training.price ?? 0)
    });
  }

  private removeSelectedLesson(): void {
    const lesson = this.selectedLessonForRemoval();
    if (!lesson) {
      return;
    }
    this.busy.set(true);
    this.lessonService.remove(lesson.id).subscribe({
      next: (response) => {
        this.busy.set(false);
        this.confirmAction.set(null);
        this.selectedLessonForRemoval.set(null);
        this.lessons.update((lessons) => lessons.filter((item) => item.id !== lesson.id));
        if (this.selectedLesson()?.id === lesson.id) {
          this.selectedLesson.set(null);
          this.activeQuiz.set(null);
        }
        this.toast.success(response.message || 'Lesson removed.');
      },
      error: (error) => {
        this.busy.set(false);
        this.toast.error(parseApiError(error).message);
      }
    });
  }

  private deleteActiveQuiz(): void {
    const quiz = this.activeQuiz();
    if (!quiz) {
      return;
    }
    this.busy.set(true);
    this.quizService.remove(quiz.id).subscribe({
      next: (response) => {
        this.busy.set(false);
        this.confirmAction.set(null);
        this.activeQuiz.set(null);
        this.selectedAnswers.set({});
        this.quizAttempt.set(null);
        this.toast.success(response.message || 'Quiz deleted.');
      },
      error: (error) => {
        this.busy.set(false);
        this.toast.error(parseApiError(error).message);
      }
    });
  }

  private validQuestionDrafts(): boolean {
    return this.questionDrafts().every((question) => {
      const validAnswers = question.answers.filter((answer) => answer.text.trim());
      const correctAnswers = validAnswers.filter((answer) => answer.correct);
      return question.questionText.trim() && validAnswers.length >= 2 && correctAnswers.length >= 1;
    });
  }

  private defaultQuestion(): QuestionDraft {
    return {
      questionText: '',
      type: 'SINGLE_CHOICE',
      answers: [
        { text: '', correct: true },
        { text: '', correct: false }
      ]
    };
  }

  private hasAnyRole(roles: Role[]): boolean {
    const role = this.auth.currentUser()?.role;
    return !!role && roles.includes(role);
  }
}
