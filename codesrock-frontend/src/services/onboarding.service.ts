import { apiService } from './api.service';

export interface OnboardingStatus {
  phase: number;
  step: number;
  completed: boolean;
}

class OnboardingService {
  /**
   * Update teacher onboarding status
   */
  async updateStatus(status: OnboardingStatus): Promise<void> {
    return apiService.post('/onboarding/status', { status });
  }

  /**
   * Activate teacher and award Pioneer badge
   */
  async activateTeacher(): Promise<void> {
    return apiService.post('/onboarding/activate', {});
  }
}

export const onboardingService = new OnboardingService();
