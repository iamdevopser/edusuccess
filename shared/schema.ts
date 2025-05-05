import { pgTable, text, serial, integer, boolean, timestamp, decimal, jsonb } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { relations } from 'drizzle-orm';
import { z } from 'zod';

// Users table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  password: text('password').notNull(),
  email: text('email').notNull().unique(),
  fullName: text('full_name').notNull(),
  avatar: text('avatar'),
  bio: text('bio'),
  role: text('role').default('student').notNull(), // student, instructor, admin
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// Create user schema for validation
export const usersInsertSchema = createInsertSchema(users, {
  username: (schema) => schema.min(3, "Username must be at least 3 characters"),
  password: (schema) => schema.min(6, "Password must be at least 6 characters"),
  email: (schema) => schema.email("Must provide a valid email"),
  fullName: (schema) => schema.min(2, "Name must be at least 2 characters"),
});

export type UserInsert = z.infer<typeof usersInsertSchema>;
export type User = typeof users.$inferSelect;

// Subjects table (formerly Languages)
export const subjects = pgTable('languages', { // Keeping the table name as 'languages' for database compatibility
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  code: text('code').notNull().unique(), // Subject code/abbreviation (e.g., MATH, SCI, ENG)
  imageUrl: text('image_url'),
  gradeLevel: text('grade_level'), // Optional: elementary, middle, high
  createdAt: timestamp('created_at').defaultNow().notNull()
});

export const subjectsInsertSchema = createInsertSchema(subjects, {
  name: (schema) => schema.min(2, "Subject name must be at least 2 characters"),
  code: (schema) => schema.min(2, "Subject code must be at least 2 characters"),
});

export type SubjectInsert = z.infer<typeof subjectsInsertSchema>;
export type Subject = typeof subjects.$inferSelect;

// Alias for backward compatibility
export const languages = subjects;

// Courses table
export const courses = pgTable('courses', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  imageUrl: text('image_url'),
  level: text('level').notNull(), // elementary, middle, high, or grade-specific levels
  duration: integer('duration').notNull(), // duration in weeks
  languageId: integer('language_id').references(() => subjects.id).notNull(), // Now refers to subject ID
  instructorId: integer('instructor_id').references(() => users.id).notNull(),
  featured: boolean('featured').default(false),
  bestSeller: boolean('best_seller').default(false),
  isNew: boolean('is_new').default(false),
  gradeLevel: text('grade_level'), // K-12 grade level (K, 1-12)
  publishedAt: timestamp('published_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
});

export const coursesInsertSchema = createInsertSchema(courses, {
  title: (schema) => schema.min(5, "Title must be at least 5 characters"),
  description: (schema) => schema.min(20, "Description must be at least 20 characters"),
  price: (schema) => schema.refine((val) => val > 0, "Price must be greater than 0"),
  duration: (schema) => schema.refine((val) => val > 0, "Duration must be greater than 0"),
});

export type CourseInsert = z.infer<typeof coursesInsertSchema>;
export type Course = typeof courses.$inferSelect;

// Modules (curriculum sections) table
export const modules = pgTable('modules', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  orderIndex: integer('order_index').notNull(),
  courseId: integer('course_id').references(() => courses.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
});

export const modulesInsertSchema = createInsertSchema(modules, {
  title: (schema) => schema.min(3, "Title must be at least 3 characters"),
  orderIndex: (schema) => schema.refine((val) => val >= 0, "Order index must be non-negative"),
});

export type ModuleInsert = z.infer<typeof modulesInsertSchema>;
export type Module = typeof modules.$inferSelect;

// Lessons table
export const lessons = pgTable('lessons', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  content: text('content'),
  videoUrl: text('video_url'),
  duration: integer('duration'), // duration in seconds
  orderIndex: integer('order_index').notNull(),
  moduleId: integer('module_id').references(() => modules.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
});

export const lessonsInsertSchema = createInsertSchema(lessons, {
  title: (schema) => schema.min(3, "Title must be at least 3 characters"),
  orderIndex: (schema) => schema.refine((val) => val >= 0, "Order index must be non-negative"),
});

export type LessonInsert = z.infer<typeof lessonsInsertSchema>;
export type Lesson = typeof lessons.$inferSelect;

// Enrollments table
export const enrollments = pgTable('enrollments', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  courseId: integer('course_id').references(() => courses.id).notNull(),
  enrolledAt: timestamp('enrolled_at').defaultNow().notNull(),
  completed: boolean('completed').default(false),
  completedAt: timestamp('completed_at'),
  progress: integer('progress').default(0), // percentage of completion
  paymentStatus: text('payment_status').default('pending').notNull(), // pending, completed, failed
  paymentAmount: decimal('payment_amount', { precision: 10, scale: 2 }),
  paymentId: text('payment_id')
});

export const enrollmentsInsertSchema = createInsertSchema(enrollments);

export type EnrollmentInsert = z.infer<typeof enrollmentsInsertSchema>;
export type Enrollment = typeof enrollments.$inferSelect;

// Progress tracking table
export const lessonProgress = pgTable('lesson_progress', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  lessonId: integer('lesson_id').references(() => lessons.id).notNull(),
  completed: boolean('completed').default(false),
  lastPosition: integer('last_position').default(0), // video position in seconds
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

export const lessonProgressInsertSchema = createInsertSchema(lessonProgress);

export type LessonProgressInsert = z.infer<typeof lessonProgressInsertSchema>;
export type LessonProgress = typeof lessonProgress.$inferSelect;

// Reviews table
export const reviews = pgTable('reviews', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  courseId: integer('course_id').references(() => courses.id).notNull(),
  rating: integer('rating').notNull(), // 1-5
  comment: text('comment'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
});

export const reviewsInsertSchema = createInsertSchema(reviews, {
  rating: (schema) => schema.refine((val) => val >= 1 && val <= 5, "Rating must be between 1 and 5"),
});

export type ReviewInsert = z.infer<typeof reviewsInsertSchema>;
export type Review = typeof reviews.$inferSelect;

// Define relationships

export const usersRelations = relations(users, ({ many }) => ({
  instructorCourses: many(courses, { relationName: 'instructorCourses' }),
  enrollments: many(enrollments),
  progress: many(lessonProgress),
  reviews: many(reviews)
}));

export const languagesRelations = relations(languages, ({ many }) => ({
  courses: many(courses)
}));

export const coursesRelations = relations(courses, ({ one, many }) => ({
  language: one(languages, { fields: [courses.languageId], references: [languages.id] }),
  instructor: one(users, { fields: [courses.instructorId], references: [users.id] }),
  modules: many(modules),
  enrollments: many(enrollments),
  reviews: many(reviews)
}));

export const modulesRelations = relations(modules, ({ one, many }) => ({
  course: one(courses, { fields: [modules.courseId], references: [courses.id] }),
  lessons: many(lessons)
}));

export const lessonsRelations = relations(lessons, ({ one, many }) => ({
  module: one(modules, { fields: [lessons.moduleId], references: [modules.id] }),
  progress: many(lessonProgress)
}));

export const enrollmentsRelations = relations(enrollments, ({ one }) => ({
  user: one(users, { fields: [enrollments.userId], references: [users.id] }),
  course: one(courses, { fields: [enrollments.courseId], references: [courses.id] })
}));

export const lessonProgressRelations = relations(lessonProgress, ({ one }) => ({
  user: one(users, { fields: [lessonProgress.userId], references: [users.id] }),
  lesson: one(lessons, { fields: [lessonProgress.lessonId], references: [lessons.id] })
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  user: one(users, { fields: [reviews.userId], references: [users.id] }),
  course: one(courses, { fields: [reviews.courseId], references: [courses.id] })
}));
