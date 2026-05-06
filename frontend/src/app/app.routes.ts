import { Routes } from '@angular/router';

import { authGuard } from './core/auth/auth.guard';
import { guestGuard } from './core/auth/guest.guard';
import { roleGuard } from './core/auth/role.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./layouts/public-layout/public-layout.component').then((m) => m.PublicLayoutComponent),
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () => import('./features/public/home.page').then((m) => m.HomePage)
      }
    ]
  },
  {
    path: 'auth',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./layouts/auth-layout/auth-layout.component').then((m) => m.AuthLayoutComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'login' },
      { path: 'login', loadComponent: () => import('./features/auth/login.page').then((m) => m.LoginPage) },
      {
        path: 'register',
        loadComponent: () =>
          import('./features/auth/register-company.page').then((m) => m.RegisterCompanyPage)
      },
      {
        path: 'trainer-pending',
        loadComponent: () =>
          import('./features/auth/trainer-pending.page').then((m) => m.TrainerPendingPage)
      },
      {
        path: 'forgot-password',
        loadComponent: () =>
          import('./features/auth/forgot-password.page').then((m) => m.ForgotPasswordPage)
      },
      {
        path: 'reset-password',
        loadComponent: () =>
          import('./features/auth/reset-password.page').then((m) => m.ResetPasswordPage)
      },
      {
        path: 'verify-email',
        loadComponent: () => import('./features/auth/verify-email.page').then((m) => m.VerifyEmailPage)
      },
      {
        path: 'accept-invitation',
        loadComponent: () =>
          import('./features/auth/accept-invitation.page').then((m) => m.AcceptInvitationPage)
      }
    ]
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./layouts/app-shell/app-shell.component').then((m) => m.AppShellComponent),
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.page').then((m) => m.DashboardPage)
      },
      {
        path: 'trainings',
        loadComponent: () =>
          import('./features/trainings/trainings-list.page').then((m) => m.TrainingsListPage)
      },
      {
        path: 'trainings/create',
        canActivate: [roleGuard],
        data: { roles: ['TRAINER', 'SUPER_ADMIN'] },
        loadComponent: () =>
          import('./features/trainings/create-training.page').then((m) => m.CreateTrainingPage)
      },
      {
        path: 'trainings/:id',
        loadComponent: () =>
          import('./features/trainings/training-details.page').then((m) => m.TrainingDetailsPage)
      },
      {
        path: 'company',
        canActivate: [roleGuard],
        data: { roles: ['SUPER_ADMIN', 'COMPANY_ADMIN', 'TEAM_MANAGER'] },
        loadComponent: () =>
          import('./features/companies/company-dashboard.page').then((m) => m.CompanyDashboardPage)
      },
      {
        path: 'teams',
        loadComponent: () => import('./features/teams/teams-list.page').then((m) => m.TeamsListPage)
      },
      {
        path: 'teams/:id',
        loadComponent: () => import('./features/teams/team-details.page').then((m) => m.TeamDetailsPage)
      },
      {
        path: 'assignments',
        loadComponent: () =>
          import('./features/assignments/assignments.page').then((m) => m.AssignmentsPage)
      },
      {
        path: 'progress',
        loadComponent: () => import('./features/progress/progress.page').then((m) => m.ProgressPage)
      },
      {
        path: 'notifications',
        loadComponent: () =>
          import('./features/notifications/notifications.page').then((m) => m.NotificationsPage)
      },
      {
        path: 'users',
        canActivate: [roleGuard],
        data: { roles: ['SUPER_ADMIN', 'COMPANY_ADMIN'] },
        loadComponent: () => import('./features/users/users.page').then((m) => m.UsersPage)
      },
      {
        path: 'admin/trainers/pending',
        canActivate: [roleGuard],
        data: { roles: ['SUPER_ADMIN'] },
        loadComponent: () =>
          import('./features/admin/trainer-applications.page').then((m) => m.TrainerApplicationsPage)
      },
      {
        path: 'certificates',
        loadComponent: () =>
          import('./features/certificates/certificates.page').then((m) => m.CertificatesPage)
      },
      {
        path: 'profile',
        loadComponent: () => import('./features/profile/profile.page').then((m) => m.ProfilePage)
      }
    ]
  },
  { path: '**', redirectTo: '' }
];
