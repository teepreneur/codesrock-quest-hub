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
} from '../../controllers/admin/evaluationController';
import {
  getTopicsByCourse,
  getAllTopics,
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
import {
  getCurricula,
  createUnit,
  updateUnit,
  moveUnit,
  deleteUnit,
  createActivity,
  updateActivity,
  moveActivity,
  deleteActivity,
} from '../../controllers/admin/curriculumController';
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
router.get('/topics', getAllTopics);
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

// Activity books (the curriculum teachers log lessons against)
router.get('/curriculum', getCurricula);
router.post('/curriculum/:curriculumId/units', createUnit);
router.patch('/curriculum/units/:id', updateUnit);
router.post('/curriculum/units/:id/move', moveUnit);
router.delete('/curriculum/units/:id', deleteUnit);
router.post('/curriculum/units/:unitId/activities', createActivity);
router.patch('/curriculum/activities/:id', updateActivity);
router.post('/curriculum/activities/:id/move', moveActivity);
router.delete('/curriculum/activities/:id', deleteActivity);

export default router;
