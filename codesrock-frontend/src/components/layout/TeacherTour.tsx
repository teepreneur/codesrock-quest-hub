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
    // Phase 1: Learning Journey
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
            target: '[data-tour="mission-map"]',
            content: <RockyTourGuide message="First stop: The Mission Map. This is where you'll find your training modules. You'll need to pass the first one to activate your account!" />,
          }
        ];
      }
      if (pathname === '/learning') {
        return [
          {
            target: '.mission-node:first-child',
            content: <RockyTourGuide message="Click on the first module to start your journey. Watch the videos, pass the quiz, and you'll be a certified CodesRock pioneer!" />,
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
