/**
 * Content Management Types
 * Type definitions for courses, topics, videos, and resources
 */

// Course categories are now dynamic — these are the initial ones
export type CourseCategory = string;
export type CourseDifficulty = 'Beginner' | 'Intermediate' | 'Advanced';

export interface Course {
  id: string;
  _id?: string;
  title: string;
  description: string;
  thumbnail: string;
  category: CourseCategory;
  difficulty: CourseDifficulty;
  duration: number; // total duration across all videos (minutes)
  xpReward: number; // total XP across all videos
  prerequisites: string[];
  order: number;
  tags: string[];
  isActive: boolean;
  viewCount: number;
  completionCount: number;
  averageRating: number;
  topicCount?: number;
  videoCount?: number;
  topics?: Topic[];
  userProgress?: CourseProgress | null;
  createdAt: string;
  updatedAt: string;
}

export interface CourseProgress {
  completedVideos: number;
  totalVideos: number;
  progressPercentage: number;
  isCompleted: boolean;
}

export interface Topic {
  id: string;
  courseId: string;
  title: string;
  description: string;
  thumbnail: string | null;
  orderIndex: number;
  isActive: boolean;
  videoCount?: number;
  videos?: Video[];
  createdAt: string;
  updatedAt: string;
}

export interface Video {
  id: string;
  topicId: string;
  courseId: string;
  title: string;
  description: string;
  videoUrl: string | null;
  thumbnail: string | null;
  duration: number;
  xpReward: number;
  orderIndex: number;
  isActive: boolean;
  viewCount: number;
  completionCount: number;
  userProgress?: VideoProgress | null;
  createdAt: string;
  updatedAt: string;
}

export interface VideoProgress {
  completed: boolean;
  watchPercentage: number;
  lastWatchedAt: string;
}

export interface CreateCourseData {
  title: string;
  description: string;
  thumbnail?: string;
  category?: CourseCategory;
  difficulty: CourseDifficulty;
  xpReward?: number;
  order?: number;
  tags?: string[];
  isActive?: boolean;
}

export interface UpdateCourseData extends Partial<CreateCourseData> {}

export interface CreateTopicData {
  title: string;
  description?: string;
  thumbnail?: string;
  orderIndex?: number;
}

export interface UpdateTopicData extends Partial<CreateTopicData> {
  isActive?: boolean;
}

export interface CreateVideoData {
  title: string;
  description?: string;
  videoUrl?: string;
  thumbnail?: string;
  duration?: number;
  xpReward?: number;
  orderIndex?: number;
}

export interface UpdateVideoData extends Partial<CreateVideoData> {
  isActive?: boolean;
}

export type ResourceCategory = 'Lesson Plans' | 'Worksheets' | 'Projects' | 'Guides' | 'Templates';
export type FileType = 'PDF' | 'DOC' | 'DOCX' | 'ZIP' | 'PPT' | 'PPTX';
export type GradeLevel = 'Elementary' | 'Middle' | 'High' | 'All';

export interface Resource {
  id: string;
  _id?: string;
  title: string;
  description: string;
  category: ResourceCategory;
  fileType: FileType;
  fileUrl: string;
  cloudinaryUrl?: string;
  cloudinaryPublicId?: string;
  fileSize: number;
  thumbnailUrl: string;
  gradeLevel: GradeLevel;
  subject: string;
  tags: string[];
  xpReward: number;
  downloadCount: number;
  averageRating: number;
  ratingCount: number;
  isActive: boolean;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateResourceData {
  title: string;
  description: string;
  category: ResourceCategory;
  fileType: FileType;
  fileUrl: string;
  cloudinaryUrl?: string;
  cloudinaryPublicId?: string;
  fileSize: number;
  thumbnailUrl?: string;
  gradeLevel: GradeLevel;
  subject: string;
  tags?: string[];
  xpReward?: number;
  isActive?: boolean;
}

export interface UpdateResourceData extends Partial<CreateResourceData> {}
