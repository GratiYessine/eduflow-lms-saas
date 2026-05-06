export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string>;
  timestamp: string;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first?: boolean;
  last: boolean;
}

export type Role = 'SUPER_ADMIN' | 'TRAINER' | 'COMPANY_ADMIN' | 'TEAM_MANAGER' | 'LEARNER';
export type UserStatus = 'ACTIVE' | 'PENDING' | 'SUSPENDED';
export type TrainerVerificationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface UserResponse {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  role: Role;
  status: UserStatus;
  companyId?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthResponse {
  accessToken?: string | null;
  refreshToken?: string | null;
  tokenType: string;
  user: UserResponse;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterCompanyRequest extends LoginRequest {
  firstName: string;
  lastName: string;
  companyName: string;
  industry?: string;
  website?: string;
  companySize?: string;
}

export interface CreateUserRequest extends LoginRequest {
  firstName: string;
  lastName: string;
  role: Role;
  companyId?: number | null;
  phone?: string;
}

export interface CompanyResponse {
  id: number;
  name: string;
  industry?: string;
  website?: string;
  logoUrl?: string;
  size?: string;
  subscriptionPlan?: string;
  status: string;
  createdAt?: string;
}

export interface TeamMemberResponse {
  id: number;
  userId: number;
  teamId: number;
  companyId: number;
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: Role;
  status?: UserStatus;
  position?: string;
  joinedAt?: string;
}

export interface TeamResponse {
  id: number;
  name: string;
  companyId: number;
  managerId?: number;
  description?: string;
  members?: TeamMemberResponse[];
  createdAt?: string;
}

export interface TeamCreateRequest {
  name: string;
  managerId?: number | null;
  description?: string;
}

export interface AddTeamMemberRequest {
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  position?: string;
}

export type TrainingStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface TrainingResponse {
  id: number;
  trainerId: number;
  title: string;
  slug: string;
  shortDescription?: string;
  description?: string;
  thumbnailUrl?: string;
  introVideoUrl?: string;
  category?: string;
  level: string;
  language: string;
  durationMinutes: number;
  price: number;
  status: TrainingStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface TrainingCreateRequest {
  title: string;
  shortDescription?: string;
  description?: string;
  thumbnailUrl?: string;
  introVideoUrl?: string;
  category?: string;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  language: string;
  durationMinutes: number;
  price: number;
}

export interface TrainingUpdateRequest {
  title?: string;
  shortDescription?: string;
  description?: string;
  thumbnailUrl?: string;
  introVideoUrl?: string;
  category?: string;
  level?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  language?: string;
  durationMinutes?: number;
  price?: number;
}

export interface LessonResponse {
  id: number;
  trainingId: number;
  title: string;
  content?: string;
  videoUrl?: string;
  durationMinutes: number;
  orderIndex: number;
  preview: boolean;
}

export interface LessonCreateRequest {
  title: string;
  content?: string;
  videoUrl?: string;
  durationMinutes: number;
  orderIndex: number;
  preview: boolean;
}

export interface LessonUpdateRequest {
  title?: string;
  content?: string;
  videoUrl?: string;
  durationMinutes?: number;
  orderIndex?: number;
  preview?: boolean;
}

export interface QuizResponse {
  id: number;
  lessonId: number;
  title: string;
  passingScore: number;
  maxAttempts: number;
  published: boolean;
  questions?: QuestionResponse[];
}

export interface QuestionResponse {
  id: number;
  quizId: number;
  questionText: string;
  type: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'TRUE_FALSE';
  orderIndex: number;
  answers?: AnswerOptionResponse[];
}

export interface AnswerOptionResponse {
  id: number;
  questionId: number;
  text: string;
  correct?: boolean | null;
}

export interface AnswerOptionCreateRequest {
  text: string;
  correct: boolean;
}

export interface QuestionCreateRequest {
  questionText: string;
  type: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'TRUE_FALSE';
  orderIndex: number;
  answers: AnswerOptionCreateRequest[];
}

export interface QuizCreateRequest {
  title: string;
  passingScore: number;
  maxAttempts: number;
  questions: QuestionCreateRequest[];
}

export interface QuizAttemptResponse {
  id: number;
  learnerId: number;
  quizId: number;
  score: number;
  passed: boolean;
  attemptNumber: number;
  submittedAt: string;
}

export interface ProgressResponse {
  id: number;
  learnerId: number;
  trainingId: number;
  completedLessons: number;
  progressPercentage: number;
  status: 'PENDING' | 'ACCEPTED' | 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'APPROVED' | 'REJECTED';
  startedAt?: string;
  completedAt?: string;
  approvedAt?: string;
  approvedBy?: number;
}

export interface CertificateResponse {
  id: number;
  certificateNumber: string;
  learnerId: number;
  trainingId: number;
  trainerId: number;
  issuedAt: string;
  fileUrl?: string;
  verificationCode: string;
}

export interface CertificateVerificationResponse {
  valid: boolean;
  certificateNumber: string;
  learnerId: number;
  trainingId: number;
  issuedAt: string;
}

export interface NotificationResponse {
  id: number;
  userId?: number;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
}

export type FileCategory = 'AVATAR' | 'COMPANY_LOGO' | 'TRAINING_THUMBNAIL' | 'VIDEO' | 'CERTIFICATE' | 'OTHER';

export interface FileResponse {
  id: number;
  originalFilename: string;
  contentType: string;
  size: number;
  category: FileCategory;
  url: string;
}

export interface AssignmentResponse {
  id: number;
  trainingId: number;
  companyId: number;
  teamId?: number;
  learnerId?: number;
  assignedBy: number;
  dueDate?: string;
  status: string;
  createdAt?: string;
}

export interface AssignmentCreateRequest {
  trainingId: number;
  companyId?: number | null;
  teamId?: number | null;
  learnerId?: number | null;
  dueDate?: string | null;
}

export type AssignmentTargetType = 'COMPANY' | 'TEAM' | 'LEARNER';

export interface BulkAssignmentCreateRequest {
  trainingId: number;
  companyId?: number | null;
  targetType: AssignmentTargetType;
  teamIds?: number[];
  learnerIds?: number[];
  dueDate?: string | null;
}

export interface TrainerProfileResponse {
  id: number;
  userId: number;
  bio?: string;
  expertise?: string;
  portfolioUrl?: string;
  socialLinks?: string;
  verificationStatus?: TrainerVerificationStatus;
  motivation?: string;
  cvUrl?: string;
  certificateUrl?: string;
  diplomaUrl?: string;
  rejectionReason?: string;
  approvedAt?: string;
  approvedBy?: number;
  rating?: number;
  totalTrainings?: number;
}

export interface UpdateTrainerProfileRequest {
  bio?: string;
  expertise?: string;
  portfolioUrl?: string;
  socialLinks?: string;
  motivation?: string;
  cvUrl?: string;
  certificateUrl?: string;
  diplomaUrl?: string;
}

export interface TrainerApplicationResponse {
  trainerId: number;
  profileId: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  userStatus: UserStatus;
  verificationStatus: TrainerVerificationStatus;
  expertise?: string;
  bio?: string;
  portfolioUrl?: string;
  socialLinks?: string;
  motivation?: string;
  cvUrl?: string;
  certificateUrl?: string;
  diplomaUrl?: string;
  rejectionReason?: string;
  approvedAt?: string;
  approvedBy?: number;
  submittedAt?: string;
}

export interface TrainerLearnerResponse {
  learnerId: number;
  firstName: string;
  lastName: string;
  email: string;
  trainingId: number;
  trainingTitle: string;
  assignmentStatus: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'IN_PROGRESS' | 'COMPLETED' | 'APPROVED';
  progressId?: number | null;
  progressStatus?: string;
  progressPercentage: number;
  quizScore?: number | null;
  certificateStatus: 'GENERATED' | 'NOT_GENERATED';
}

export interface TrainerApprovalResponse {
  progressId: number;
  learnerId: number;
  firstName: string;
  lastName: string;
  email: string;
  trainingId: number;
  trainingTitle: string;
  progressPercentage: number;
  quizScore?: number | null;
  status: string;
  certificateGenerated: boolean;
}

export interface TrainerWalletResponse {
  totalRevenue: number;
  platformCommission: number;
  netRevenue: number;
  approvedPaymentsCount: number;
}

export interface LessonResourceResponse {
  id: number;
  lessonId: number;
  fileId: number;
  fileUrl: string;
  fileType: string;
  originalName: string;
  size: number;
  createdAt: string;
}
