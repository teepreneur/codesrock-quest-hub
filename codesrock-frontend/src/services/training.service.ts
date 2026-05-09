import { apiService } from './api.service';

export interface TrainingSession {
  id: string;
  title: string;
  description: string;
  instructor: string;
  start_time: string;
  end_time: string;
  type: 'live' | 'recorded';
  meeting_link?: string;
  recording_url?: string;
  max_participants: number;
  current_participants: number;
  tags?: string[];
  xp_reward: number;
  isRSVPed?: boolean;
  isLive?: boolean;
}

class TrainingService {
  /**
   * Get upcoming training sessions
   */
  async getUpcomingSessions(): Promise<TrainingSession[]> {
    return apiService.get<TrainingSession[]>('/sessions?upcoming=true');
  }

  /**
   * Get past training sessions / recordings
   */
  async getPastSessions(): Promise<TrainingSession[]> {
    return apiService.get<TrainingSession[]>('/sessions?type=recorded');
  }

  /**
   * RSVP to a session
   */
  async rsvpToSession(sessionId: string): Promise<void> {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return apiService.post('/sessions/register', { 
      userId: user.id,
      sessionId 
    });
  }
}

export const trainingService = new TrainingService();
