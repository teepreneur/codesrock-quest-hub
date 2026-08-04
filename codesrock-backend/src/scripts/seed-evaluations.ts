import { supabase } from '../config/supabase';

interface QuestionSeed {
  questionText: string;
  options: string[];
  correctAnswer: string;
}

interface EvaluationSeed {
  topicId: string;
  title: string;
  description: string;
  xpReward: number;
  questions: QuestionSeed[];
}

const evaluationSeeds: EvaluationSeed[] = [
  // 1. Introduction
  {
    topicId: '588c0d45-35e6-453b-a5f6-62782acb3edc',
    title: 'Introduction Evaluation',
    description: 'Test your foundational knowledge on computational thinking and CodesRock basics!',
    xpReward: 500,
    questions: [
      {
        questionText: 'What is CodesRock?',
        options: [
          'A game-based computational thinking program for early learners',
          'A typing speed test',
          'A space exploration game',
          'A drawing app'
        ],
        correctAnswer: 'A game-based computational thinking program for early learners'
      },
      {
        questionText: 'What is the primary goal of computational thinking?',
        options: [
          'To break down complex problems and solve them step by step',
          'To memorize computer hardware components',
          'To write fast code without planning',
          'To replace teachers with computers'
        ],
        correctAnswer: 'To break down complex problems and solve them step by step'
      },
      {
        questionText: 'How do unplugged activities help young learners?',
        options: [
          'They teach core coding and logic concepts without needing screens',
          'They require high-speed internet to run',
          'They only work on tablets',
          'They teach children how to fix broken screens'
        ],
        correctAnswer: 'They teach core coding and logic concepts without needing screens'
      },
      {
        questionText: 'Who is Rocky in the CodesRock platform?',
        options: [
          'The friendly Logic Star mascot guiding learners',
          'A computer virus',
          'The head principal',
          'A robot character in space'
        ],
        correctAnswer: 'The friendly Logic Star mascot guiding learners'
      },
      {
        questionText: 'True or False: You must be able to write text code in Python to start learning computational thinking with CodesRock.',
        options: ['False', 'True'],
        correctAnswer: 'False'
      }
    ]
  },

  // 2. Algorithm
  {
    topicId: '7e4b1704-925a-43c1-ba73-00e9617bf056',
    title: 'Algorithm Evaluation',
    description: 'Test your understanding of algorithms, steps, and ordering!',
    xpReward: 500,
    questions: [
      {
        questionText: 'An algorithm is a ______ of steps used to complete a task.',
        options: ['plan or set', 'random mix', 'secret code', 'guessing game'],
        correctAnswer: 'plan or set'
      },
      {
        questionText: 'The steps in an algorithm must be followed in the correct ______.',
        options: ['order', 'speed', 'color', 'language'],
        correctAnswer: 'order'
      },
      {
        questionText: 'If you skip a step or change the order in an algorithm, what will happen to the result?',
        options: [
          'The result will be different or wrong',
          'The result will stay the exact same',
          'It makes no difference at all',
          'The computer turns off'
        ],
        correctAnswer: 'The result will be different or wrong'
      },
      {
        questionText: 'Getting dressed in the morning or making a sandwich is an example of an everyday ______.',
        options: ['algorithm', 'bug', 'software update', 'compiler'],
        correctAnswer: 'algorithm'
      },
      {
        questionText: 'What is each individual action inside an algorithm called?',
        options: ['A step', 'A bug', 'A loop', 'A function'],
        correctAnswer: 'A step'
      },
      {
        questionText: 'What is an algorithm?',
        options: [
          'A step-by-step plan to complete a task',
          'A type of computer screen',
          'A musical instrument',
          'A math test'
        ],
        correctAnswer: 'A step-by-step plan to complete a task'
      },
      {
        questionText: 'True or False: A list of instructions given to a person or robot to follow in order is an algorithm.',
        options: ['True', 'False'],
        correctAnswer: 'True'
      }
    ]
  },

  // 3. Spatial Reasoning
  {
    topicId: '4f4efbab-491d-4cc1-b770-c0373e197101',
    title: 'Spatial Reasoning Evaluation',
    description: 'Evaluate your knowledge of directions, orientation, and spatial commands!',
    xpReward: 500,
    questions: [
      {
        questionText: 'When you face forward and step one foot back, which direction are you moving?',
        options: ['Backward', 'Forward', 'Left', 'Right'],
        correctAnswer: 'Backward'
      },
      {
        questionText: 'To go from facing forward to facing the complete opposite direction, what must you do?',
        options: ['Turn around', 'Jump up', 'Step forward', 'Sit down'],
        correctAnswer: 'Turn around'
      },
      {
        questionText: 'Raising your hand toward the ceiling is an example of moving in which direction?',
        options: ['Up', 'Down', 'Backward', 'Left'],
        correctAnswer: 'Up'
      },
      {
        questionText: 'Moving your hand or body toward the floor is moving in which direction?',
        options: ['Down', 'Up', 'Right', 'Forward'],
        correctAnswer: 'Down'
      },
      {
        questionText: 'Spatial reasoning helps us understand position and ______.',
        options: ['direction', 'color', 'weight', 'temperature'],
        correctAnswer: 'direction'
      },
      {
        questionText: 'True or False: "Forward" and "backward" describe the exact same direction.',
        options: ['False', 'True'],
        correctAnswer: 'False'
      },
      {
        questionText: 'Which direction command moves a character straight ahead toward the front?',
        options: ['Forward', 'Backward', 'Turn Left', 'Turn Right'],
        correctAnswer: 'Forward'
      }
    ]
  },

  // 4. Sequencing
  {
    topicId: 'f445a090-554e-4c62-a3c3-7dd648d5be05',
    title: 'Sequencing Evaluation',
    description: 'Master the art of arranging instruction cards in exact sequential order!',
    xpReward: 500,
    questions: [
      {
        questionText: 'What does sequencing mean in coding?',
        options: [
          'Putting instructions in the exact right order',
          'Choosing random colors for cards',
          'Making sounds with music',
          'Writing long paragraphs'
        ],
        correctAnswer: 'Putting instructions in the exact right order'
      },
      {
        questionText: 'In mat missions, what do story characters follow to reach their target goal?',
        options: [
          'A sequence of direction/instruction cards',
          'A pile of random blocks',
          'A clock timer',
          'A drawing pad'
        ],
        correctAnswer: 'A sequence of direction/instruction cards'
      },
      {
        questionText: 'What will happen if two steps in a sequence are swapped or placed out of order?',
        options: [
          'The character may miss the goal or follow the wrong path',
          'The character arrives at the goal faster',
          'The path automatically fixes itself',
          'The character turns into a star'
        ],
        correctAnswer: 'The character may miss the goal or follow the wrong path'
      },
      {
        questionText: 'What is the name of the hands-on activity kit used for floor mat missions?',
        options: ["Let's Go Code", 'Robot Runner', 'Cyber Quest', 'Logic Blocks'],
        correctAnswer: "Let's Go Code"
      },
      {
        questionText: 'Who are the four story characters guiding the CodesRock missions?',
        options: [
          'Kojo, Kwame, Akua, and Ama',
          'Alex, Ben, Charlie, and David',
          'Rocky, Ruby, Rusty, and Rex',
          'Sam, Tim, Leo, and Max'
        ],
        correctAnswer: 'Kojo, Kwame, Akua, and Ama'
      },
      {
        questionText: 'True or False: A sequence will still execute correctly even if its steps are placed completely out of order.',
        options: ['False', 'True'],
        correctAnswer: 'False'
      },
      {
        questionText: 'Complete the sentence: A sequence is a series of actions performed one ______ a time, in order.',
        options: ['after', 'before', 'without', 'against'],
        correctAnswer: 'after'
      }
    ]
  },

  // 5. Sequencing and Debugging
  {
    topicId: '7a29c8e3-098a-4d5e-90c6-85088444bc11',
    title: 'Sequencing and Debugging Evaluation',
    description: 'Learn how to spot bugs, remove obstacles, and debug your sequence!',
    xpReward: 500,
    questions: [
      {
        questionText: 'In programming, what is a mistake or error in a sequence called?',
        options: ['A bug', 'A feature', 'A command', 'A variable'],
        correctAnswer: 'A bug'
      },
      {
        questionText: 'What is the process of finding and fixing a mistake in a sequence called?',
        options: ['Debugging', 'Sequencing', 'Encoding', 'Printing'],
        correctAnswer: 'Debugging'
      },
      {
        questionText: 'In Missions 10–12, what element is added to block the path and force you to debug your sequence?',
        options: ['Obstacles or blockades', 'Extra points', 'Bonus stars', 'Speed boosts'],
        correctAnswer: 'Obstacles or blockades'
      },
      {
        questionText: 'What is the very first thing you must do before you can fix a bug in a sequence?',
        options: ['Find the bug', 'Delete the program', 'Turn off the screen', 'Add more steps'],
        correctAnswer: 'Find the bug'
      },
      {
        questionText: 'True or False: Debugging means throwing away the entire sequence and starting over, even if only one step is wrong.',
        options: ['False', 'True'],
        correctAnswer: 'False'
      },
      {
        questionText: 'Which statement best explains the difference between sequencing and debugging?',
        options: [
          'Sequencing is arranging steps in order; debugging is finding and fixing mistakes',
          'Sequencing is fixing bugs; debugging is making songs',
          'They are identical words with no difference',
          'Debugging is only for computers, sequencing is for humans'
        ],
        correctAnswer: 'Sequencing is arranging steps in order; debugging is finding and fixing mistakes'
      }
    ]
  },

  // 6. Tips
  {
    topicId: '3389c395-c059-4e92-8592-8d936779a9e0',
    title: 'Tips Evaluation',
    description: 'Test your knowledge on instructional tips, song pairings, and classroom guidance!',
    xpReward: 500,
    questions: [
      {
        questionText: 'Where does the Tips content primarily originate from in the CodesRock platform?',
        options: [
          'The instructor audio and video guidance library',
          'Printed student workbooks',
          'Math textbooks',
          'Poster board prints'
        ],
        correctAnswer: 'The instructor audio and video guidance library'
      },
      {
        questionText: "What common teaching challenge does the 'Direction Confusion' tip address?",
        options: [
          'Helping instructors avoid mixing up left and right direction cues',
          'Fixing computer monitor resolution',
          'Teaching children how to spell long words',
          'Managing playground time'
        ],
        correctAnswer: 'Helping instructors avoid mixing up left and right direction cues'
      },
      {
        questionText: "What is the goal of the 'When to Use What Song' guide?",
        options: [
          'To help teachers pair specific songs to the right lesson activity moment',
          'To teach children how to play piano',
          'To select background music for nap time',
          'To rank the most popular pop songs'
        ],
        correctAnswer: 'To help teachers pair specific songs to the right lesson activity moment'
      },
      {
        questionText: "The guide 'Using Components to Complement Each Other' explains how to combine songs, mat missions, and ______.",
        options: ['direction cards', 'video games', 'homework exams', 'scientific calculators'],
        correctAnswer: 'direction cards'
      },
      {
        questionText: 'Who is the Tips section primarily designed for?',
        options: [
          'Teachers, instructors, and parents',
          'Toddlers studying alone',
          'Software engineers',
          'High school principals'
        ],
        correctAnswer: 'Teachers, instructors, and parents'
      },
      {
        questionText: 'True or False: The Tips section appears as printed page numbers inside the student activity book.',
        options: ['False', 'True'],
        correctAnswer: 'False'
      }
    ]
  },

  // 7. Algorithm Basics
  {
    topicId: 'df110f84-2a6b-414e-9fe9-4e9cd90c3add',
    title: 'Algorithm Basics Evaluation',
    description: 'Evaluate your understanding of algorithms and computational thinking fundamentals.',
    xpReward: 500,
    questions: [
      {
        questionText: 'What is an algorithm?',
        options: [
          'A clear set of step-by-step instructions to solve a problem',
          'A type of computer screen',
          'A fast internet connection',
          'A random guess'
        ],
        correctAnswer: 'A clear set of step-by-step instructions to solve a problem'
      },
      {
        questionText: 'Why is order important in an algorithm?',
        options: [
          'If the steps are executed out of order, the output will be incorrect',
          'Order does not matter at all',
          'Computers randomize the order anyway',
          'Order only matters for numbers'
        ],
        correctAnswer: 'If the steps are executed out of order, the output will be incorrect'
      }
    ]
  },

  // 8. Loops in coding
  {
    topicId: '142f7f0f-280a-4d5e-90c6-85088444bc11',
    title: 'Loops Evaluation',
    description: 'Test your knowledge of repetition and loops in code.',
    xpReward: 500,
    questions: [
      {
        questionText: 'What does a loop do in computer programming?',
        options: [
          'Repeats a set of instructions multiple times',
          'Stops the program immediately',
          'Deletes mistakes in code',
          'Changes the background color'
        ],
        correctAnswer: 'Repeats a set of instructions multiple times'
      },
      {
        questionText: 'Why do programmers use loops?',
        options: [
          'To save time and avoid writing repetitive code',
          'To make code harder to read',
          'To slow down the computer',
          'To turn off the monitor'
        ],
        correctAnswer: 'To save time and avoid writing repetitive code'
      }
    ]
  },

  // 9. Events in coding
  {
    topicId: '14257c9e-aab0-45f9-b171-74f44b64c8e0',
    title: 'Events Evaluation',
    description: 'Understand triggers, key presses, and event listeners in code.',
    xpReward: 500,
    questions: [
      {
        questionText: 'What is an event in programming?',
        options: [
          'An action or occurrence that triggers a response in code (like clicking a button)',
          'A school holiday',
          'A computer crash',
          'A type of variable'
        ],
        correctAnswer: 'An action or occurrence that triggers a response in code (like clicking a button)'
      }
    ]
  },

  // 10. Loop in a Loop
  {
    topicId: '2dbb2410-51e2-43f9-ba5d-ff6f24dc7189',
    title: 'Nested Loops Evaluation',
    description: 'Master nested loops and grid iterations.',
    xpReward: 500,
    questions: [
      {
        questionText: 'What is a nested loop?',
        options: [
          'A loop inside another loop',
          'A loop that never starts',
          'A broken loop',
          'A loop with no variables'
        ],
        correctAnswer: 'A loop inside another loop'
      }
    ]
  },

  // 11. Conditionals
  {
    topicId: '8328500a-e612-4643-a446-cdd2600f8346',
    title: 'Conditionals Evaluation',
    description: 'Master IF/THEN decision making in code.',
    xpReward: 500,
    questions: [
      {
        questionText: 'What does a conditional statement do in code?',
        options: [
          'Makes decisions based on whether a condition is true or false (IF/THEN)',
          'Repeats code forever',
          'Deletes variables',
          'Prints images'
        ],
        correctAnswer: 'Makes decisions based on whether a condition is true or false (IF/THEN)'
      }
    ]
  },

  // 12. Functions
  {
    topicId: '60d107e6-abd4-485d-818a-810c49e1d0b8',
    title: 'Functions Evaluation',
    description: 'Learn how to group reusable blocks of code.',
    xpReward: 500,
    questions: [
      {
        questionText: 'What is a function in programming?',
        options: [
          'A reusable block of code designed to perform a specific task',
          'A mathematical equation',
          'A computer keyboard key',
          'A type of screen'
        ],
        correctAnswer: 'A reusable block of code designed to perform a specific task'
      }
    ]
  },

  // 13. Modules
  {
    topicId: '53ac0e92-a83c-4317-8bef-421297d48c7b',
    title: 'Modules Evaluation',
    description: 'Understand modular programming and code organization.',
    xpReward: 500,
    questions: [
      {
        questionText: 'What is a module in software design?',
        options: [
          'A separate, self-contained unit of code that can be reused across a project',
          'A small battery',
          'A type of mouse',
          'A single line of code'
        ],
        correctAnswer: 'A separate, self-contained unit of code that can be reused across a project'
      }
    ]
  },

  // 14. Libraries
  {
    topicId: '29a7f2b1-c921-43e8-9ac9-525bb3b58a05',
    title: 'Libraries Evaluation',
    description: 'Explore external libraries and pre-written code packages.',
    xpReward: 500,
    questions: [
      {
        questionText: 'What is a code library?',
        options: [
          'A collection of pre-written code and functions that developers can import and use',
          'A physical building with books',
          'A list of usernames',
          'A database backup'
        ],
        correctAnswer: 'A collection of pre-written code and functions that developers can import and use'
      }
    ]
  }
];

async function seedEvaluations() {
  console.log('🚀 Seeding evaluations and objective quiz questions...');

  for (const seed of evaluationSeeds) {
    console.log(`\nProcessing topic: ${seed.title} (${seed.topicId})...`);

    // 1. Upsert evaluation record
    const { data: evaluation, error: evalError } = await supabase
      .from('evaluations')
      .upsert(
        {
          topic_id: seed.topicId,
          title: seed.title,
          description: seed.description,
          xp_reward: seed.xpReward,
          is_active: true,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'topic_id' }
      )
      .select()
      .single();

    if (evalError) {
      console.error(`❌ Failed to upsert evaluation for ${seed.title}:`, evalError);
      continue;
    }

    console.log(`✅ Evaluation upserted: ID ${evaluation.id}`);

    // 2. Delete existing questions
    await supabase.from('evaluation_questions').delete().eq('evaluation_id', evaluation.id);

    // Helper function to shuffle array (Fisher-Yates)
    const shuffleArray = <T>(array: T[]): T[] => {
      const arr = [...array];
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    };

    // 3. Insert new objective questions with randomized option positions
    const questionsToInsert = seed.questions.map((q, index) => ({
      evaluation_id: evaluation.id,
      question_text: q.questionText,
      question_type: 'multiple_choice',
      options: shuffleArray(q.options),
      correct_answer: q.correctAnswer,
      order_index: index
    }));

    const { error: qError } = await supabase
      .from('evaluation_questions')
      .insert(questionsToInsert);

    if (qError) {
      console.error(`❌ Failed to insert questions for ${seed.title}:`, qError);
    } else {
      console.log(`   └─ Added ${questionsToInsert.length} objective multiple-choice questions.`);
    }
  }

  console.log('\n🎉 All module evaluations and quiz questions seeded successfully!');
}

seedEvaluations().then(() => process.exit(0));
