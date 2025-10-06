export interface Teacher {
  id: string;
  name: string;
  email: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
  streak: number;
  school: string;
  completionPercentage: number;
}

export interface Video {
  id: string;
  title: string;
  category: string;
  duration: number;
  xpReward: number;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  thumbnail: string;
  completed: boolean;
  progress: number;
  locked: boolean;
  prerequisite?: string;
}

export interface Resource {
  id: string;
  title: string;
  type: "lesson-plan" | "worksheet" | "slides" | "handout" | "assessment";
  category: string;
  gradeLevel: string[];
  fileType: string;
  fileSize: string;
  downloads: number;
  rating: number;
  thumbnail: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: "completion" | "engagement" | "milestone" | "special";
  earned: boolean;
  earnedDate?: string;
  xpReward: number;
  unlockRequirement: string;
}

export interface Certificate {
  id: string;
  title: string;
  type: "course" | "level" | "program";
  dateEarned: string;
  certificateId: string;
  thumbnail: string;
}

export interface ChecklistItem {
  id: string;
  title: string;
  category: "videos" | "readings" | "assessments" | "quiz";
  completed: boolean;
  xpReward: number;
  dueDate?: string;
}

export interface TrainingSession {
  id: string;
  title: string;
  date: string;
  time: string;
  duration: number;
  trainer: string;
  isLive: boolean;
  isPast: boolean;
  recordingUrl?: string;
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  xp: number;
  level: number;
}

export const currentTeacher: Teacher = {
  id: "1",
  name: "Sarah Johnson",
  email: "sarah.johnson@school.edu",
  level: 5,
  xp: 2450,
  xpToNextLevel: 3000,
  streak: 7,
  school: "Lincoln Elementary School",
  completionPercentage: 68,
};

export const levelTitles = [
  "Code Cadet",
  "Debug Detective",
  "Loop Legend",
  "Algorithm Ace",
  "Binary Master",
  "Syntax Sensei",
  "Programming Pro",
  "CodesRock Champion",
];

export const videos: Video[] = [
  {
    id: "1",
    title: "Introduction to Block-Based Coding",
    category: "Beginner Coding",
    duration: 25,
    xpReward: 50,
    difficulty: "Beginner",
    thumbnail: "🎯",
    completed: true,
    progress: 100,
    locked: false,
  },
  {
    id: "2",
    title: "Variables and Data Types for Kids",
    category: "Beginner Coding",
    duration: 30,
    xpReward: 75,
    difficulty: "Beginner",
    thumbnail: "📦",
    completed: true,
    progress: 100,
    locked: false,
  },
  {
    id: "3",
    title: "Loops and Iteration Basics",
    category: "Intermediate Programming",
    duration: 40,
    xpReward: 100,
    difficulty: "Intermediate",
    thumbnail: "🔁",
    completed: false,
    progress: 45,
    locked: false,
  },
  {
    id: "4",
    title: "Conditional Logic for Young Coders",
    category: "Intermediate Programming",
    duration: 35,
    xpReward: 85,
    difficulty: "Intermediate",
    thumbnail: "🔀",
    completed: false,
    progress: 0,
    locked: false,
  },
  {
    id: "5",
    title: "Functions and Code Reusability",
    category: "Advanced Curriculum",
    duration: 45,
    xpReward: 125,
    difficulty: "Advanced",
    thumbnail: "⚙️",
    completed: false,
    progress: 0,
    locked: true,
    prerequisite: "Complete Loops and Iteration",
  },
  {
    id: "6",
    title: "Classroom Management Strategies",
    category: "Classroom Management",
    duration: 20,
    xpReward: 60,
    difficulty: "Beginner",
    thumbnail: "👥",
    completed: true,
    progress: 100,
    locked: false,
  },
  {
    id: "7",
    title: "Arrays and Lists for Students",
    category: "Intermediate Programming",
    duration: 38,
    xpReward: 95,
    difficulty: "Intermediate",
    thumbnail: "📊",
    completed: false,
    progress: 0,
    locked: false,
  },
  {
    id: "8",
    title: "Introduction to Algorithms",
    category: "Advanced Curriculum",
    duration: 50,
    xpReward: 150,
    difficulty: "Advanced",
    thumbnail: "🧮",
    completed: false,
    progress: 0,
    locked: true,
    prerequisite: "Complete Functions",
  },
];

export const resources: Resource[] = [
  {
    id: "1",
    title: "Block Coding Lesson Plan - Week 1",
    type: "lesson-plan",
    category: "Beginner Coding",
    gradeLevel: ["K-2", "3-5"],
    fileType: "PDF",
    fileSize: "2.4 MB",
    downloads: 342,
    rating: 4.8,
    thumbnail: "📄",
  },
  {
    id: "2",
    title: "Variables Practice Worksheet",
    type: "worksheet",
    category: "Beginner Coding",
    gradeLevel: ["3-5"],
    fileType: "PDF",
    fileSize: "1.2 MB",
    downloads: 289,
    rating: 4.9,
    thumbnail: "📝",
  },
  {
    id: "3",
    title: "Introduction to Coding Slides",
    type: "slides",
    category: "Beginner Coding",
    gradeLevel: ["K-2", "3-5"],
    fileType: "PPTX",
    fileSize: "8.5 MB",
    downloads: 456,
    rating: 4.7,
    thumbnail: "📊",
  },
  {
    id: "4",
    title: "Loop Challenges Student Handout",
    type: "handout",
    category: "Intermediate Programming",
    gradeLevel: ["3-5", "6-8"],
    fileType: "PDF",
    fileSize: "1.8 MB",
    downloads: 198,
    rating: 4.6,
    thumbnail: "📋",
  },
  {
    id: "5",
    title: "Coding Concepts Assessment Quiz",
    type: "assessment",
    category: "Intermediate Programming",
    gradeLevel: ["3-5", "6-8"],
    fileType: "PDF",
    fileSize: "0.9 MB",
    downloads: 267,
    rating: 4.8,
    thumbnail: "✅",
  },
  {
    id: "6",
    title: "Classroom Setup Guide",
    type: "lesson-plan",
    category: "Classroom Management",
    gradeLevel: ["K-2", "3-5", "6-8"],
    fileType: "PDF",
    fileSize: "3.1 MB",
    downloads: 501,
    rating: 4.9,
    thumbnail: "🏫",
  },
  {
    id: "7",
    title: "Algorithm Thinking Exercises",
    type: "worksheet",
    category: "Advanced Curriculum",
    gradeLevel: ["6-8"],
    fileType: "PDF",
    fileSize: "2.0 MB",
    downloads: 154,
    rating: 4.7,
    thumbnail: "🧩",
  },
  {
    id: "8",
    title: "Parent Communication Templates",
    type: "handout",
    category: "Classroom Management",
    gradeLevel: ["K-2", "3-5", "6-8"],
    fileType: "DOCX",
    fileSize: "0.5 MB",
    downloads: 389,
    rating: 4.8,
    thumbnail: "💌",
  },
];

export const badges: Badge[] = [
  {
    id: "1",
    name: "First Steps",
    description: "Complete your first video",
    icon: "👣",
    category: "milestone",
    earned: true,
    earnedDate: "2025-01-15",
    xpReward: 25,
    unlockRequirement: "Complete 1 video",
  },
  {
    id: "2",
    name: "Early Bird",
    description: "Login before 8 AM",
    icon: "🌅",
    category: "engagement",
    earned: true,
    earnedDate: "2025-01-18",
    xpReward: 15,
    unlockRequirement: "Login before 8 AM",
  },
  {
    id: "3",
    name: "Night Owl",
    description: "Complete a course after 8 PM",
    icon: "🦉",
    category: "engagement",
    earned: false,
    xpReward: 15,
    unlockRequirement: "Complete course after 8 PM",
  },
  {
    id: "4",
    name: "Speed Learner",
    description: "Complete 5 videos in one day",
    icon: "⚡",
    category: "engagement",
    earned: false,
    xpReward: 50,
    unlockRequirement: "Complete 5 videos in 1 day",
  },
  {
    id: "5",
    name: "Resource Collector",
    description: "Download 20+ resources",
    icon: "📚",
    category: "milestone",
    earned: true,
    earnedDate: "2025-02-01",
    xpReward: 30,
    unlockRequirement: "Download 20+ resources",
  },
  {
    id: "6",
    name: "Perfect Score",
    description: "Pass certification quiz with 100%",
    icon: "🎯",
    category: "completion",
    earned: false,
    xpReward: 100,
    unlockRequirement: "100% on certification quiz",
  },
  {
    id: "7",
    name: "7 Day Streak",
    description: "Login 7 consecutive days",
    icon: "🔥",
    category: "engagement",
    earned: true,
    earnedDate: "2025-02-10",
    xpReward: 40,
    unlockRequirement: "7 day login streak",
  },
  {
    id: "8",
    name: "Helping Hand",
    description: "Rate 10 resources",
    icon: "🤝",
    category: "engagement",
    earned: false,
    xpReward: 20,
    unlockRequirement: "Rate 10 resources",
  },
  {
    id: "9",
    name: "Course Master",
    description: "Complete entire Beginner category",
    icon: "👑",
    category: "completion",
    earned: true,
    earnedDate: "2025-01-28",
    xpReward: 150,
    unlockRequirement: "Complete all Beginner videos",
  },
  {
    id: "10",
    name: "Algorithm Ace",
    description: "Complete all Advanced courses",
    icon: "🏆",
    category: "completion",
    earned: false,
    xpReward: 200,
    unlockRequirement: "Complete all Advanced videos",
  },
];

export const certificates: Certificate[] = [
  {
    id: "1",
    title: "Beginner Coding Completion",
    type: "course",
    dateEarned: "2025-01-28",
    certificateId: "CR-BEG-2025-0128-SJ",
    thumbnail: "🎓",
  },
  {
    id: "2",
    title: "Level 3: Loop Legend",
    type: "level",
    dateEarned: "2025-02-05",
    certificateId: "CR-LVL3-2025-0205-SJ",
    thumbnail: "⭐",
  },
  {
    id: "3",
    title: "Classroom Management Specialist",
    type: "course",
    dateEarned: "2025-02-12",
    certificateId: "CR-CLM-2025-0212-SJ",
    thumbnail: "🏅",
  },
];

export const checklistItems: ChecklistItem[] = [
  {
    id: "1",
    title: "Introduction to Block-Based Coding",
    category: "videos",
    completed: true,
    xpReward: 50,
  },
  {
    id: "2",
    title: "Variables and Data Types for Kids",
    category: "videos",
    completed: true,
    xpReward: 75,
  },
  {
    id: "3",
    title: "Loops and Iteration Basics",
    category: "videos",
    completed: false,
    xpReward: 100,
  },
  {
    id: "4",
    title: "Conditional Logic for Young Coders",
    category: "videos",
    completed: false,
    xpReward: 85,
  },
  {
    id: "5",
    title: "Read: Teaching Coding Best Practices",
    category: "readings",
    completed: true,
    xpReward: 30,
  },
  {
    id: "6",
    title: "Read: Age-Appropriate Programming Concepts",
    category: "readings",
    completed: false,
    xpReward: 30,
  },
  {
    id: "7",
    title: "Submit Sample Lesson Plan",
    category: "assessments",
    completed: true,
    xpReward: 100,
  },
  {
    id: "8",
    title: "Conduct Practice Teaching Session",
    category: "assessments",
    completed: false,
    xpReward: 150,
  },
  {
    id: "9",
    title: "Certification Quiz",
    category: "quiz",
    completed: false,
    xpReward: 200,
    dueDate: "2025-03-15",
  },
];

export const trainingSessions: TrainingSession[] = [
  {
    id: "1",
    title: "Getting Started with CodesRock",
    date: "2025-02-18",
    time: "10:00 AM EST",
    duration: 60,
    trainer: "Dr. Emily Chen",
    isLive: false,
    isPast: true,
    recordingUrl: "#",
  },
  {
    id: "2",
    title: "Advanced Debugging Techniques",
    date: "2025-02-25",
    time: "2:00 PM EST",
    duration: 90,
    trainer: "Michael Roberts",
    isLive: false,
    isPast: false,
  },
  {
    id: "3",
    title: "Engaging Students with Code Challenges",
    date: "2025-03-04",
    time: "11:00 AM EST",
    duration: 75,
    trainer: "Lisa Martinez",
    isLive: false,
    isPast: false,
  },
  {
    id: "4",
    title: "Assessment & Progress Tracking",
    date: "2025-03-11",
    time: "1:00 PM EST",
    duration: 60,
    trainer: "Dr. Emily Chen",
    isLive: false,
    isPast: false,
  },
];

export const leaderboard: LeaderboardEntry[] = [
  { rank: 1, name: "Jennifer Kim", xp: 3250, level: 6 },
  { rank: 2, name: "Marcus Thompson", xp: 2890, level: 5 },
  { rank: 3, name: "Sarah Johnson", xp: 2450, level: 5 },
  { rank: 4, name: "David Chen", xp: 2120, level: 5 },
  { rank: 5, name: "Amanda Rodriguez", xp: 1950, level: 4 },
];

export const recentActivity = [
  { id: "1", text: "Completed 'Variables and Data Types for Kids'", time: "2 hours ago", icon: "✅" },
  { id: "2", text: "Earned badge: 7 Day Streak 🔥", time: "1 day ago", icon: "🏆" },
  { id: "3", text: "Downloaded 'Loop Challenges Handout'", time: "2 days ago", icon: "📥" },
  { id: "4", text: "Reached Level 5: Binary Master", time: "5 days ago", icon: "⭐" },
];
