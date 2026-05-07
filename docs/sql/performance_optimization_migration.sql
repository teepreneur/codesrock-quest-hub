-- =============================================
-- PERFORMANCE OPTIMIZATION INDEXES
-- =============================================

-- Core Content Relationships
CREATE INDEX IF NOT EXISTS idx_topics_course_id ON topics(course_id);
CREATE INDEX IF NOT EXISTS idx_videos_topic_id ON videos(topic_id);
CREATE INDEX IF NOT EXISTS idx_videos_course_id ON videos(course_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_topic_id ON evaluations(topic_id);
CREATE INDEX IF NOT EXISTS idx_evaluation_questions_eval_id ON evaluation_questions(evaluation_id);

-- User Progress & Gamification
CREATE INDEX IF NOT EXISTS idx_video_progress_video_id ON video_progress(video_id);
CREATE INDEX IF NOT EXISTS idx_video_progress_user_completed ON video_progress(user_id, completed);
CREATE INDEX IF NOT EXISTS idx_evaluation_progress_user_eval ON evaluation_progress(user_id, evaluation_id);
CREATE INDEX IF NOT EXISTS idx_evaluation_progress_passed ON evaluation_progress(passed);

-- Admin & Content Stats
CREATE INDEX IF NOT EXISTS idx_activities_user_type ON activities(user_id, type);
CREATE INDEX IF NOT EXISTS idx_activities_created_at_desc ON activities(created_at DESC);

-- Analytics
CREATE INDEX IF NOT EXISTS idx_resources_category ON resources(category);
CREATE INDEX IF NOT EXISTS idx_resource_downloads_resource_id ON resource_downloads(resource_id);
