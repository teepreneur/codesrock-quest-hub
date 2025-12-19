/**
 * Content Management Types
 * Type definitions for courses and resources
 */

export type CourseCategory = 'HTML/CSS' | 'JavaScript' | 'Computer Science' | 'Coding';
export type CourseDifficulty = 'Beginner' | 'Intermediate' | 'Advanced';

export interface Course {
  _id: string;
  title: string;
  description: string;
  thumbnail: string;
  videoUrl?: string;
  youtubeVideoId?: string;
  youtubeEmbedUrl?: string;
  category: CourseCategory;
  difficulty: CourseDifficulty;
  duration: number; // in minutes
  xpReward: number; // 25-100 XP
  prerequisites: string[]; // Array of course IDs
  order: number;
  tags: string[];
  isActive: boolean;
  viewCount: number;
  completionCount: number;
  averageRating: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCourseData {
  title: string;
  description: string;
  thumbnail?: string;
  videoUrl?: string;
  youtubeVideoId?: string;
  category: CourseCategory;
  difficulty: CourseDifficulty;
  duration: number;
  xpReward: number;
  prerequisites?: string[];
  order?: number;
  tags?: string[];
  isActive?: boolean;
}

export interface UpdateCourseData extends Partial<CreateCourseData> {}

export type ResourceCategory = 'Lesson Plans' | 'Worksheets' | 'Projects' | 'Guides' | 'Templates';
export type FileType = 'PDF' | 'DOC' | 'DOCX' | 'ZIP' | 'PPT' | 'PPTX';
export type GradeLevel = 'Elementary' | 'Middle' | 'High' | 'All';

export interface Resource {
  _id: string;
  title: string;
  description: string;
  category: ResourceCategory;
  fileType: FileType;
  fileUrl: string;
  cloudinaryUrl?: string;
  cloudinaryPublicId?: string;
  fileSize: number; // in bytes
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
