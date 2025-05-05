import { db } from "./index";
import * as schema from "@shared/schema";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcryptjs";

async function seed() {
  try {
    console.log("Seeding database...");

    // Seed languages
    const languageData = [
      { name: "Spanish", code: "es", imageUrl: "https://images.unsplash.com/photo-1596523651809-d942bd3e7f01?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" },
      { name: "French", code: "fr", imageUrl: "https://images.unsplash.com/photo-1509439581779-6298f75bf6e5?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" },
      { name: "German", code: "de", imageUrl: "https://images.unsplash.com/photo-1573166364524-d9dbfd8bbf83?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" },
      { name: "Japanese", code: "ja", imageUrl: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" },
      { name: "Mandarin", code: "zh", imageUrl: "https://images.unsplash.com/photo-1547981609-4b6bfe67ca0b?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" },
      { name: "Italian", code: "it", imageUrl: "https://images.unsplash.com/photo-1519482816300-1490fdf2c2bd?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" }
    ];

    for (const language of languageData) {
      const existingLanguage = await db.query.languages.findFirst({
        where: eq(schema.languages.code, language.code)
      });

      if (!existingLanguage) {
        await db.insert(schema.languages).values(language);
        console.log(`Created language: ${language.name}`);
      } else {
        console.log(`Language ${language.name} already exists`);
      }
    }

    // Get all languages from the database
    const languages = await db.query.languages.findMany();
    const languageMap = languages.reduce((map, language) => {
      map[language.code] = language.id;
      return map;
    }, {} as Record<string, number>);

    // Seed users (instructors)
    const instructors = [
      { username: "maria.rodriguez", email: "maria@example.com", password: "password123", fullName: "Maria Rodriguez", avatar: "https://api.dicebear.com/6.x/avataaars/svg?seed=Felix", role: "instructor", bio: "Spanish language teacher with over 10 years of experience in language education." },
      { username: "pierre.dupont", email: "pierre@example.com", password: "password123", fullName: "Pierre Dupont", avatar: "https://api.dicebear.com/6.x/avataaars/svg?seed=Pierre", role: "instructor", bio: "Native French speaker with a passion for teaching French literature and conversation." },
      { username: "yuki.tanaka", email: "yuki@example.com", password: "password123", fullName: "Yuki Tanaka", avatar: "https://api.dicebear.com/6.x/avataaars/svg?seed=Yuki", role: "instructor", bio: "Experienced Japanese teacher specializing in teaching non-native speakers." }
    ];

    const instructorIds: Record<string, number> = {};

    for (const instructor of instructors) {
      const existingUser = await db.query.users.findFirst({
        where: eq(schema.users.email, instructor.email)
      });

      if (!existingUser) {
        const hashedPassword = await bcrypt.hash(instructor.password, 10);
        const [newUser] = await db.insert(schema.users).values({
          ...instructor,
          password: hashedPassword
        }).returning();
        instructorIds[instructor.username] = newUser.id;
        console.log(`Created instructor: ${instructor.fullName}`);
      } else {
        instructorIds[instructor.username] = existingUser.id;
        console.log(`Instructor ${instructor.fullName} already exists`);
      }
    }

    // Seed courses
    const coursesData = [
      {
        title: "Spanish for Beginners: Complete Course",
        description: "Master Spanish fundamentals with our comprehensive beginner course designed for quick progress.",
        price: 59.99,
        imageUrl: "https://images.unsplash.com/photo-1596523651809-d942bd3e7f01?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        level: "beginner",
        duration: 6,
        languageId: languageMap["es"],
        instructorId: instructorIds["maria.rodriguez"],
        featured: true,
        bestSeller: true,
        isNew: false
      },
      {
        title: "French Conversation and Culture",
        description: "Take your French skills to the next level with focus on conversation and cultural understanding.",
        price: 79.99,
        imageUrl: "https://images.unsplash.com/photo-1509439581779-6298f75bf6e5?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        level: "intermediate",
        duration: 8,
        languageId: languageMap["fr"],
        instructorId: instructorIds["pierre.dupont"],
        featured: true,
        bestSeller: false,
        isNew: false
      },
      {
        title: "Japanese Essentials: Speaking & Writing",
        description: "Learn the fundamentals of Japanese language including hiragana, katakana, and basic kanji.",
        price: 89.99,
        imageUrl: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        level: "beginner",
        duration: 10,
        languageId: languageMap["ja"],
        instructorId: instructorIds["yuki.tanaka"],
        featured: true,
        bestSeller: false,
        isNew: true
      },
      {
        title: "German for Business: Professional Communication",
        description: "Master business German vocabulary and professional communication for international careers.",
        price: 129.99,
        imageUrl: "https://images.unsplash.com/photo-1573166364524-d9dbfd8bbf83?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
        level: "intermediate",
        duration: 12,
        languageId: languageMap["de"],
        instructorId: instructorIds["pierre.dupont"],
        featured: false,
        bestSeller: false,
        isNew: false
      }
    ];

    const courseIds: Record<string, number> = {};

    for (const courseData of coursesData) {
      const existingCourse = await db.query.courses.findFirst({
        where: eq(schema.courses.title, courseData.title)
      });

      if (!existingCourse) {
        const [newCourse] = await db.insert(schema.courses).values(courseData).returning();
        courseIds[courseData.title] = newCourse.id;
        console.log(`Created course: ${courseData.title}`);
      } else {
        courseIds[courseData.title] = existingCourse.id;
        console.log(`Course ${courseData.title} already exists`);
      }
    }

    // Seed modules for Spanish course
    if (courseIds["Spanish for Beginners: Complete Course"]) {
      const spanishCourseId = courseIds["Spanish for Beginners: Complete Course"];
      const spanishModules = [
        { title: "Introduction to Spanish", description: "Learn the basics of Spanish pronunciation and greetings", orderIndex: 0, courseId: spanishCourseId },
        { title: "Essential Vocabulary", description: "Build your Spanish vocabulary with common words and phrases", orderIndex: 1, courseId: spanishCourseId },
        { title: "Basic Grammar", description: "Learn fundamental Spanish grammar rules", orderIndex: 2, courseId: spanishCourseId },
        { title: "Everyday Conversations", description: "Practice common conversations in Spanish", orderIndex: 3, courseId: spanishCourseId }
      ];

      const moduleIds: Record<string, number> = {};

      for (const moduleData of spanishModules) {
        const existingModule = await db.query.modules.findFirst({
          where: eq(schema.modules.title, moduleData.title)
        });

        if (!existingModule) {
          const [newModule] = await db.insert(schema.modules).values(moduleData).returning();
          moduleIds[moduleData.title] = newModule.id;
          console.log(`Created module: ${moduleData.title}`);
        } else {
          moduleIds[moduleData.title] = existingModule.id;
          console.log(`Module ${moduleData.title} already exists`);
        }
      }

      // Seed lessons for Introduction module
      if (moduleIds["Introduction to Spanish"]) {
        const introModuleId = moduleIds["Introduction to Spanish"];
        const introLessons = [
          { title: "Spanish Alphabet and Pronunciation", description: "Learn the Spanish alphabet and how to pronounce each letter", content: "Spanish alphabet lesson content", videoUrl: "https://www.example.com/videos/spanish-alphabet", duration: 720, orderIndex: 0, moduleId: introModuleId },
          { title: "Basic Greetings", description: "Learn how to greet people in Spanish", content: "Spanish greetings lesson content", videoUrl: "https://www.example.com/videos/spanish-greetings", duration: 540, orderIndex: 1, moduleId: introModuleId },
          { title: "Introducing Yourself", description: "Learn how to introduce yourself in Spanish", content: "Spanish introductions lesson content", videoUrl: "https://www.example.com/videos/spanish-introductions", duration: 660, orderIndex: 2, moduleId: introModuleId }
        ];

        for (const lessonData of introLessons) {
          const existingLesson = await db.query.lessons.findFirst({
            where: eq(schema.lessons.title, lessonData.title)
          });

          if (!existingLesson) {
            await db.insert(schema.lessons).values(lessonData);
            console.log(`Created lesson: ${lessonData.title}`);
          } else {
            console.log(`Lesson ${lessonData.title} already exists`);
          }
        }
      }
    }

    // Add some demo users
    const demoUsers = [
      { username: "john.doe", email: "john@example.com", password: "password123", fullName: "John Doe", avatar: "https://api.dicebear.com/6.x/avataaars/svg?seed=John", role: "student" },
      { username: "sarah.johnson", email: "sarah@example.com", password: "password123", fullName: "Sarah Johnson", avatar: "https://api.dicebear.com/6.x/avataaars/svg?seed=Sarah", role: "student" },
      { username: "michael.chen", email: "michael@example.com", password: "password123", fullName: "Michael Chen", avatar: "https://api.dicebear.com/6.x/avataaars/svg?seed=Michael", role: "student" }
    ];

    const userIds: Record<string, number> = {};

    for (const user of demoUsers) {
      const existingUser = await db.query.users.findFirst({
        where: eq(schema.users.email, user.email)
      });

      if (!existingUser) {
        const hashedPassword = await bcrypt.hash(user.password, 10);
        const [newUser] = await db.insert(schema.users).values({
          ...user,
          password: hashedPassword
        }).returning();
        userIds[user.username] = newUser.id;
        console.log(`Created user: ${user.fullName}`);
      } else {
        userIds[user.username] = existingUser.id;
        console.log(`User ${user.fullName} already exists`);
      }
    }

    // Seed some reviews
    const reviewsData = [
      {
        userId: userIds["john.doe"],
        courseId: courseIds["Spanish for Beginners: Complete Course"],
        rating: 5,
        comment: "After just 3 months with LinguaLearn's Spanish course, I was able to have full conversations during my trip to Mexico. The video lessons and practice exercises made a huge difference."
      },
      {
        userId: userIds["sarah.johnson"],
        courseId: courseIds["French Conversation and Culture"],
        rating: 5,
        comment: "The French for Business course was exactly what I needed for my career. The focus on practical vocabulary and real-world business scenarios was invaluable. Highly recommend!"
      },
      {
        userId: userIds["michael.chen"],
        courseId: courseIds["Japanese Essentials: Speaking & Writing"],
        rating: 4,
        comment: "Learning Japanese seemed daunting until I found this platform. The step-by-step approach and excellent instructors made the process enjoyable. I can now read basic manga!"
      }
    ];

    for (const reviewData of reviewsData) {
      const existingReview = await db.query.reviews.findFirst({
        where: (and(
          eq(schema.reviews.userId, reviewData.userId),
          eq(schema.reviews.courseId, reviewData.courseId)
        ))
      });

      if (!existingReview) {
        await db.insert(schema.reviews).values(reviewData);
        console.log(`Created review for course ID ${reviewData.courseId}`);
      } else {
        console.log(`Review already exists for course ID ${reviewData.courseId}`);
      }
    }

    console.log("Database seeding completed!");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}

seed();
