import express from 'express';
import {
  getAllCourses,
  createCourse,
  updateCourse,
  deleteCourse,
  getAllResources,
  createResource,
  updateResource,
  deleteResource,
  getContentStats,
} from '../../controllers/admin/contentController';
import {
  getEvaluationByTopic,
  saveEvaluation,
  submitEvaluation,
} from '../../controllers/admin/evaluationController';
import {
  getTopicsByCourse,
  createTopic,
  updateTopic,
  deleteTopic,
} from '../../controllers/admin/topicController';
import {
  getVideosByTopic,
  createVideo,
  updateVideo,
  deleteVideo,
} from '../../controllers/admin/videoController';
import { protect } from '../../middleware/auth';
import { requireContentAdmin, auditLog } from '../../middleware/roleAuth';

const router = express.Router();

// All routes require authentication and content admin role
router.use(protect);
router.use(requireContentAdmin);
router.use(auditLog);

// Content stats
router.get('/stats', getContentStats);

// Course routes — specific nested routes MUST come before generic :id route
router.route('/courses').get(getAllCourses).post(createCourse);
router.route('/courses/:courseId/topics').get(getTopicsByCourse).post(createTopic);
router.route('/courses/:id').put(updateCourse).delete(deleteCourse);

// Topic routes
router.route('/topics/:topicId/videos').get(getVideosByTopic).post(createVideo);
router.route('/topics/:topicId').put(updateTopic).delete(deleteTopic);

// Video routes
router.route('/videos/:videoId').put(updateVideo).delete(deleteVideo);

// Resource routes
router.route('/resources').get(getAllResources).post(createResource);
router.route('/resources/:id').put(updateResource).delete(deleteResource);

// Evaluation routes
router.get('/evaluations/topic/:topicId', getEvaluationByTopic);
router.post('/evaluations/save', saveEvaluation);

export default router;
