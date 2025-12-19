export interface ILevel {
  level: number;
  name: string;
  minXP: number;
  maxXP: number;
  color: string;
  icon: string;
}

export const LEVELS: ILevel[] = [
  {
    level: 1,
    name: 'Code Cadet',
    minXP: 0,
    maxXP: 99,
    color: '#94A3B8',
    icon: '🎯'
  },
  {
    level: 2,
    name: 'Tech Explorer',
    minXP: 100,
    maxXP: 249,
    color: '#60A5FA',
    icon: '🔍'
  },
  {
    level: 3,
    name: 'Digital Creator',
    minXP: 250,
    maxXP: 449,
    color: '#34D399',
    icon: '🎨'
  },
  {
    level: 4,
    name: 'Innovation Scout',
    minXP: 450,
    maxXP: 699,
    color: '#A78BFA',
    icon: '🚀'
  },
  {
    level: 5,
    name: 'Tech Mentor',
    minXP: 700,
    maxXP: 999,
    color: '#F59E0B',
    icon: '👨‍🏫'
  },
  {
    level: 6,
    name: 'Digital Champion',
    minXP: 1000,
    maxXP: 1349,
    color: '#EF4444',
    icon: '🏆'
  },
  {
    level: 7,
    name: 'Innovation Leader',
    minXP: 1350,
    maxXP: 1749,
    color: '#EC4899',
    icon: '⭐'
  },
  {
    level: 8,
    name: 'CodesRock Champion',
    minXP: 1750,
    maxXP: Infinity,
    color: '#8B5CF6',
    icon: '👑'
  }
];

export const getLevelByXP = (xp: number): ILevel => {
  for (const level of LEVELS) {
    if (xp >= level.minXP && xp <= level.maxXP) {
      return level;
    }
  }
  return LEVELS[LEVELS.length - 1]; // Return max level if XP exceeds all levels
};

export const getLevelByNumber = (levelNumber: number): ILevel | undefined => {
  return LEVELS.find(level => level.level === levelNumber);
};

export const getNextLevel = (currentLevel: number): ILevel | undefined => {
  return LEVELS.find(level => level.level === currentLevel + 1);
};
