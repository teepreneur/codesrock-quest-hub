import { Router } from 'express';
import * as onboardingController from '../controllers/onboardingController';
import { protect } from '../middleware/auth';

const router = Router();

// All onboarding routes require authentication
router.use(protect);

router.post('/status', onboardingController.updateOnboardingStatus);
router.post('/activate', onboardingController.activateTeacher);

export default router;
