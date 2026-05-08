import React, { useState, useEffect } from 'react';
import { Joyride, Step, CallBackProps, STATUS } from 'react-joyride';
import { useNavigate, useLocation } from 'react-router-dom';
import { onboardingService, OnboardingStatus, authService } from '@/services';
import { RockyTourGuide } from './RockyTourGuide';

interface TeacherTourProps {
  status: OnboardingStatus;
  onStatusUpdate: () => void;
}

export const TeacherTour: React.FC<TeacherTourProps> = ({ status, onStatusUpdate }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = authService.getStoredUser();

  const [run, setRun] = useState(false);
  const [steps, setSteps] = useState<Step[]>([]);

  // Only run for teachers who are not yet completed
  useEffect(() => {
    if (user?.role === 'teacher' && !status.completed) {
      // Determine steps based on phase and current location
      const newSteps = getStepsForPhase(status.phase, location.pathname);
      setSteps(newSteps);
      
      // Auto-run if we have steps for this page
      if (newSteps.length > 0) {
        setRun(true);
      } else {
        setRun(false);
      }
    }
  }, [status, location.pathname, user?.role]);

  const getStepsForPhase = (phase: number, pathname: string): Step[] => {
    // Phase 1: Training & Activation
    if (phase === 1) {
      if (pathname === '/dashboard') {
        return [
          {
            target: 'body',
            placement: 'center',
            content: <RockyTourGuide message="Welcome to CodesRock, partner! I'm Rocky, and I'll be your guide. Let's get you ready to lead your students to victory!" />,
            disableBeacon: true,
          },
          {
            target: '[data-tour="sidebar-learning"]',
            content: <RockyTourGuide message="First stop: The Learning Path. This is where your training journey begins. Click here to see your mission map!" />,
            disableBeacon: true,
          }
        ];
      }
      if (pathname === '/videos') {
        return [
          {
            target: '[data-tour="module-card"]',
            content: <RockyTourGuide message="Here are your training modules. We've selected the first one for you. Let's look at the missions inside!" />,
            disableBeacon: true,
          },
          {
            target: '[data-tour="first-mission"]',
            content: <RockyTourGuide message="Each node is a mission. Watch the videos to master the skills. Complete all missions in the first module to unlock your finale challenge!" />,
            disableBeacon: true,
          },
          {
            target: '[data-tour="quiz-card"]',
            content: <RockyTourGuide message="Once you've mastered all the missions, this Final Challenge will unlock. Pass it to earn your Pioneer Badge!" />,
            disableBeacon: true,
          },
          {
            target: '[data-tour="sidebar-quiz"]',
            content: <RockyTourGuide message="You can also access all your evaluations here. Ready to start your journey?" />,
            disableBeacon: true,
          },
          {
            target: '[data-tour="video-player"]',
            content: <RockyTourGuide message="Rock on! Watch this video to master the skill. When you're done, I'll help you with the next one!" />,
            disableBeacon: true,
          }
        ];
      }
      if (pathname.includes('/evaluation')) {
        return [
          {
            target: 'body',
            placement: 'center',
            content: <RockyTourGuide message="Time for the finale! I'll be here to coach you through. You've got this, partner!" />,
            disableBeacon: true,
          },
          {
            target: '[data-tour="quiz-question"]',
            content: <RockyTourGuide message="Read each question carefully. Use what you learned in the videos to find the best answer!" />,
            disableBeacon: true,
          }
        ];
      }
    }

    // Phase 2: Class Setup
    if (phase === 2) {
      if (pathname === '/dashboard') {
        const isMobile = window.innerWidth < 1024;
        const phase2Steps: Step[] = [];
        
        if (isMobile) {
          phase2Steps.push({
            target: '[data-tour="sidebar-trigger"]',
            content: <RockyTourGuide message="Great job on the training! Open the menu here to find your class management tools." />,
            disableBeacon: true,
          });
        }
        
        phase2Steps.push({
          target: '[data-tour="sidebar-classes"]',
          content: <RockyTourGuide message="Now, let's set up your first class. Head over to the Classes section." />,
          disableBeacon: true,
        });
        
        return phase2Steps;
      }
      if (pathname === '/classes') {
        return [
          {
            target: '[data-tour="add-class-btn"]',
            content: <RockyTourGuide message="Click here to create your class and add your students. Once they're in, they can start their own coding adventures!" />,
            disableBeacon: true,
          }
        ];
      }
    }

    return [];
  };

  const handleJoyrideCallback = async (data: CallBackProps) => {
    const { status: tourStatus, step, action } = data;

    if (([STATUS.FINISHED, STATUS.SKIPPED] as string[]).includes(tourStatus)) {
      setRun(false);
      
      // If they skip or finish, we should at least mark this step as seen if it's a critical transition
      // For now, we only update status on specific actions (like passing a quiz or clicking setup)
    }
  };

  return (
    <Joyride
      callback={handleJoyrideCallback}
      continuous
      hideBackButton
      run={run}
      scrollToFirstStep
      showProgress
      showSkipButton
      steps={steps}
      styles={{
        options: {
          primaryColor: '#6366f1',
          zIndex: 10000,
        },
        tooltipContainer: {
          textAlign: 'left',
          padding: 0,
        },
        tooltip: {
          padding: 0,
          backgroundColor: 'transparent',
          boxShadow: 'none',
        }
      }}
    />
  );
};
