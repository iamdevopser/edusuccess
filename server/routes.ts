import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import {
  coursesInsertSchema,
  enrollmentsInsertSchema,
  subjectsInsertSchema,
  lessonProgressInsertSchema,
  lessonsInsertSchema,
  modulesInsertSchema,
  reviewsInsertSchema,
  usersInsertSchema
} from "@shared/schema";
import { eq, and, like, desc, gte, lte, or, isNull, not, inArray, sql } from "drizzle-orm";
import Stripe from "stripe";
import { db } from "@db";
import { courses, enrollments, languages, lessonProgress, lessons, modules, reviews, users } from "@shared/schema";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { pool } from "@db";
import { createPaypalOrder, capturePaypalOrder, loadPaypalDefault } from "./paypal";

const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key";
const SESSION_SECRET = process.env.SESSION_SECRET || "your-super-secret-session-key";

// Authentication middleware
const authenticate = async (req: any, res: any, next: any) => {
  const token = req.session.token || req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized: Invalid token" });
  }
};

// API prefix
const API_PREFIX = "/api";

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Configure session middleware for authentication
  const PgSession = connectPgSimple(session);
  app.use(
    session({
      store: new PgSession({
        pool: pool,
        tableName: 'session',
        createTableIfMissing: true,
      }),
      secret: SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
      },
    })
  );

  // Auth routes
  app.post(`${API_PREFIX}/auth/register`, async (req, res) => {
    try {
      const userData = usersInsertSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await db.query.users.findFirst({
        where: or(
          eq(users.email, userData.email),
          eq(users.username, userData.username)
        )
      });
      
      if (existingUser) {
        return res.status(400).json({ message: "User with this email or username already exists" });
      }
      
      // Hash the password
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      // Create the user
      const [newUser] = await db.insert(users).values({
        ...userData,
        password: hashedPassword
      }).returning({
        id: users.id,
        username: users.username,
        email: users.email,
        fullName: users.fullName,
        avatar: users.avatar,
        role: users.role
      });
      
      // Create a token
      const token = jwt.sign({ userId: newUser.id }, JWT_SECRET, { expiresIn: '7d' });
      
      // Store the token in session
      (req.session as any).token = token;
      
      return res.status(201).json({ 
        user: newUser,
        token
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error('Error registering user:', error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(`${API_PREFIX}/auth/login`, async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }
      
      // Find the user
      const user = await db.query.users.findFirst({
        where: eq(users.email, email)
      });
      
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Verify the password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Create a token
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
      
      // Store the token in session
      (req.session as any).token = token;
      
      return res.status(200).json({ 
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          avatar: user.avatar,
          role: user.role
        },
        token
      });
    } catch (error) {
      console.error('Error logging in:', error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(`${API_PREFIX}/auth/logout`, (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error('Error destroying session:', err);
        return res.status(500).json({ message: "Error logging out" });
      }
      res.clearCookie('connect.sid');
      return res.status(200).json({ message: "Successfully logged out" });
    });
  });

  app.get(`${API_PREFIX}/auth/me`, authenticate, async (req, res) => {
    try {
      const user = await db.query.users.findFirst({
        where: eq(users.id, req.userId),
        columns: {
          id: true,
          username: true,
          email: true,
          fullName: true,
          avatar: true,
          role: true,
          bio: true,
          createdAt: true
        }
      });
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      return res.status(200).json(user);
    } catch (error) {
      console.error('Error getting current user:', error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Subjects routes (formerly Languages)
  app.get(`${API_PREFIX}/languages`, async (req, res) => {
    try {
      const allSubjects = await db.query.languages.findMany();
      return res.status(200).json(allSubjects);
    } catch (error) {
      console.error('Error getting subjects:', error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Courses routes
  app.get(`${API_PREFIX}/courses`, async (req, res) => {
    try {
      const { language, level, search, featured, page = 1, limit = 12 } = req.query;
      
      let query = db.select().from(courses);
      
      // Apply filters
      const filters = [];
      if (language && language !== 'all') {
        filters.push(eq(courses.languageId, Number(language)));
      }
      
      if (level && level !== 'all') {
        filters.push(eq(courses.level, String(level)));
      }
      
      if (featured === 'true') {
        filters.push(eq(courses.featured, true));
      }
      
      if (search) {
        filters.push(
          or(
            like(courses.title, `%${search}%`),
            like(courses.description, `%${search}%`)
          )
        );
      }
      
      if (filters.length > 0) {
        query = query.where(and(...filters));
      }
      
      // Apply pagination
      const offset = (Number(page) - 1) * Number(limit);
      query = query.limit(Number(limit)).offset(offset).orderBy(desc(courses.createdAt));
      
      const results = await query;
      
      // Get total count for pagination
      let totalCourses = 0;
      
      try {
        // Use a simpler count approach with proper error handling
        const countQuery = db
          .select({ count: sql`count(${courses.id})` })
          .from(courses);
          
        if (filters.length > 0) {
          countQuery.where(and(...filters));
        }
        
        const countResult = await countQuery;
        
        if (countResult && countResult.length > 0) {
          // Safely extract the count value, regardless of its property name
          const countValue = countResult[0]?.count || Object.values(countResult[0])[0];
          if (countValue !== undefined) {
            totalCourses = Number(countValue);
          }
        }
      } catch (countError) {
        console.error('Error getting course count:', countError);
        // Continue with 0 as the count if there's an error
      }
      
      const totalPages = Math.ceil(totalCourses / Number(limit));
      
      // Fetch instructors and languages for courses
      const courseIds = results.map(course => course.id);
      
      // Get all instructor IDs and language IDs from results
      const instructorIdsSet = new Set(results.map(course => course.instructorId));
      const languageIdsSet = new Set(results.map(course => course.languageId));
      const instructorIds = Array.from(instructorIdsSet);
      const languageIds = Array.from(languageIdsSet);

      // Fetch instructors
      const instructors = await db.query.users.findMany({
        where: instructorIds.length > 0 
          ? inArray(users.id, instructorIds) 
          : undefined
      });
      
      // Fetch languages
      const courseLanguages = await db.query.languages.findMany({
        where: languageIds.length > 0 
          ? inArray(languages.id, languageIds) 
          : undefined
      });
      
      // Get review statistics for each course
      let reviewStats = [];
      
      if (courseIds.length > 0) {
        try {
          // Only run if there are courses to query
          reviewStats = await db
            .select({
              courseId: reviews.courseId,
              avgRating: sql`avg(${reviews.rating})`,
              reviewCount: sql`count(*)`
            })
            .from(reviews)
            .where(inArray(reviews.courseId, courseIds))
            .groupBy(reviews.courseId);
        } catch (error) {
          console.error('Error fetching review stats:', error);
          // Continue with empty reviews if there's an error
        }
      }
      
      // Combine the data
      const coursesWithDetails = results.map(course => {
        const instructor = instructors.find(i => i.id === course.instructorId);
        const language = courseLanguages.find(l => l.id === course.languageId);
        const stats = reviewStats.find(s => s.courseId === course.id);
        
        return {
          ...course,
          instructor: instructor ? {
            id: instructor.id,
            fullName: instructor.fullName,
            avatar: instructor.avatar,
            username: instructor.username
          } : null,
          language: language ? {
            id: language.id,
            name: language.name,
            code: language.code
          } : null,
          ratings: {
            average: stats ? (stats.avgRating !== undefined ? Number(stats.avgRating) : 
              (Object.values(stats)[0] !== undefined ? Number(Object.values(stats)[0]) : 0)) : 0,
            count: stats ? (stats.reviewCount !== undefined ? Number(stats.reviewCount) : 
              (Object.values(stats).length > 1 ? Number(Object.values(stats)[1]) : 0)) : 0
          }
        };
      });
      
      return res.status(200).json({
        courses: coursesWithDetails,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          totalCourses,
          totalPages
        }
      });
    } catch (error) {
      console.error('Error getting courses:', error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(`${API_PREFIX}/courses/:id`, async (req, res) => {
    try {
      const courseId = Number(req.params.id);
      
      const course = await db.query.courses.findFirst({
        where: eq(courses.id, courseId),
        with: {
          language: true,
          instructor: {
            columns: {
              id: true,
              fullName: true,
              avatar: true,
              username: true,
              bio: true
            }
          },
          modules: {
            orderBy: (modules, { asc }) => [asc(modules.orderIndex)],
            with: {
              lessons: {
                orderBy: (lessons, { asc }) => [asc(lessons.orderIndex)]
              }
            }
          }
        }
      });
      
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      // Get review statistics
      let reviewStats = [];
      
      try {
        // Safely get review statistics
        reviewStats = await db
          .select({
            avgRating: sql`avg(${reviews.rating})`,
            reviewCount: sql`count(*)`
          })
          .from(reviews)
          .where(eq(reviews.courseId, courseId));
      } catch (error) {
        console.error('Error fetching review stats for course:', error);
        // Continue with empty review stats if there's an error
      }
      
      // Get reviews with user details
      const courseReviews = await db.query.reviews.findMany({
        where: eq(reviews.courseId, courseId),
        orderBy: (reviews, { desc }) => [desc(reviews.createdAt)],
        with: {
          user: {
            columns: {
              id: true,
              fullName: true,
              avatar: true,
              username: true
            }
          }
        }
      });
      
      // Safely extract review stats values
      const avgRating = reviewStats[0] ? 
        (reviewStats[0].avgRating !== undefined ? Number(reviewStats[0].avgRating) : 
         (Object.values(reviewStats[0])[0] !== undefined ? Number(Object.values(reviewStats[0])[0]) : 0)) : 0;
      
      const reviewCount = reviewStats[0] ?
        (reviewStats[0].reviewCount !== undefined ? Number(reviewStats[0].reviewCount) : 
         (Object.values(reviewStats[0]).length > 1 ? Number(Object.values(reviewStats[0])[1]) : 0)) : 0;
      
      return res.status(200).json({
        ...course,
        ratings: {
          average: avgRating,
          count: reviewCount
        },
        reviews: courseReviews
      });
    } catch (error) {
      console.error('Error getting course details:', error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Enrollment routes
  app.post(`${API_PREFIX}/enrollments`, authenticate, async (req, res) => {
    try {
      const { courseId, paymentId, paymentAmount } = req.body;
      
      if (!courseId) {
        return res.status(400).json({ message: "Course ID is required" });
      }
      
      // Check if the course exists
      const course = await db.query.courses.findFirst({
        where: eq(courses.id, Number(courseId))
      });
      
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      // Check if already enrolled
      const existingEnrollment = await db.query.enrollments.findFirst({
        where: and(
          eq(enrollments.userId, req.userId),
          eq(enrollments.courseId, Number(courseId))
        )
      });
      
      if (existingEnrollment) {
        return res.status(400).json({ message: "You are already enrolled in this course" });
      }
      
      // Create enrollment
      const [newEnrollment] = await db.insert(enrollments).values({
        userId: req.userId,
        courseId: Number(courseId),
        paymentStatus: paymentId ? 'completed' : 'pending',
        paymentId: paymentId || null,
        paymentAmount: paymentAmount || course.price
      }).returning();
      
      return res.status(201).json(newEnrollment);
    } catch (error) {
      console.error('Error enrolling in course:', error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(`${API_PREFIX}/enrollments`, authenticate, async (req, res) => {
    try {
      const userEnrollments = await db.query.enrollments.findMany({
        where: eq(enrollments.userId, req.userId),
        with: {
          course: {
            with: {
              language: true,
              instructor: {
                columns: {
                  id: true,
                  fullName: true,
                  avatar: true,
                  username: true
                }
              }
            }
          }
        }
      });
      
      // Get progress information for each enrollment
      const enhancedEnrollments = await Promise.all(
        userEnrollments.map(async (enrollment) => {
          // Get all lessons for the course
          const courseModules = await db.query.modules.findMany({
            where: eq(modules.courseId, enrollment.courseId),
            with: {
              lessons: true
            }
          });
          
          const allLessons = courseModules.flatMap(module => module.lessons);
          const totalLessons = allLessons.length;
          
          // Get completed lessons
          const completedLessons = await db.query.lessonProgress.findMany({
            where: and(
              eq(lessonProgress.userId, req.userId),
              eq(lessonProgress.completed, true),
              eq(lessonProgress.lessonId, allLessons.map(lesson => lesson.id))
            )
          });
          
          const completedCount = completedLessons.length;
          const progressPercentage = totalLessons > 0 
            ? Math.round((completedCount / totalLessons) * 100) 
            : 0;
          
          return {
            ...enrollment,
            progress: progressPercentage,
            totalLessons,
            completedLessons: completedCount
          };
        })
      );
      
      return res.status(200).json(enhancedEnrollments);
    } catch (error) {
      console.error('Error getting enrollments:', error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Lesson progress routes
  app.post(`${API_PREFIX}/lesson-progress`, authenticate, async (req, res) => {
    try {
      const { lessonId, completed, lastPosition } = req.body;
      
      if (!lessonId) {
        return res.status(400).json({ message: "Lesson ID is required" });
      }
      
      // Check if the lesson exists
      const lesson = await db.query.lessons.findFirst({
        where: eq(lessons.id, Number(lessonId)),
        with: {
          module: {
            with: {
              course: {
                with: {
                  enrollments: {
                    where: eq(enrollments.userId, req.userId)
                  }
                }
              }
            }
          }
        }
      });
      
      if (!lesson) {
        return res.status(404).json({ message: "Lesson not found" });
      }
      
      // Check if user is enrolled in the course
      if (lesson.module.course.enrollments.length === 0) {
        return res.status(403).json({ message: "You must be enrolled in this course to track progress" });
      }
      
      // Check if progress entry exists
      const existingProgress = await db.query.lessonProgress.findFirst({
        where: and(
          eq(lessonProgress.userId, req.userId),
          eq(lessonProgress.lessonId, Number(lessonId))
        )
      });
      
      let result;
      if (existingProgress) {
        // Update existing progress
        [result] = await db
          .update(lessonProgress)
          .set({
            completed: completed !== undefined ? completed : existingProgress.completed,
            lastPosition: lastPosition !== undefined ? lastPosition : existingProgress.lastPosition,
            updatedAt: new Date()
          })
          .where(eq(lessonProgress.id, existingProgress.id))
          .returning();
      } else {
        // Create new progress entry
        [result] = await db
          .insert(lessonProgress)
          .values({
            userId: req.userId,
            lessonId: Number(lessonId),
            completed: completed !== undefined ? completed : false,
            lastPosition: lastPosition !== undefined ? lastPosition : 0
          })
          .returning();
      }
      
      // Update enrollment progress if lesson is completed
      if (completed) {
        const courseId = lesson.module.course.id;
        
        // Get all lessons for the course
        const courseModules = await db.query.modules.findMany({
          where: eq(modules.courseId, courseId),
          with: {
            lessons: true
          }
        });
        
        const allLessons = courseModules.flatMap(module => module.lessons);
        const totalLessons = allLessons.length;
        
        // Get completed lessons
        const completedLessons = await db.query.lessonProgress.findMany({
          where: and(
            eq(lessonProgress.userId, req.userId),
            eq(lessonProgress.completed, true),
            eq(lessonProgress.lessonId, allLessons.map(lesson => lesson.id))
          )
        });
        
        const completedCount = completedLessons.length;
        const progressPercentage = Math.round((completedCount / totalLessons) * 100);
        
        // Update enrollment progress
        await db
          .update(enrollments)
          .set({
            progress: progressPercentage,
            completed: progressPercentage === 100,
            completedAt: progressPercentage === 100 ? new Date() : null
          })
          .where(
            and(
              eq(enrollments.userId, req.userId),
              eq(enrollments.courseId, courseId)
            )
          );
      }
      
      return res.status(200).json(result);
    } catch (error) {
      console.error('Error updating lesson progress:', error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(`${API_PREFIX}/lesson-progress/:lessonId`, authenticate, async (req, res) => {
    try {
      const lessonId = Number(req.params.lessonId);
      
      const progress = await db.query.lessonProgress.findFirst({
        where: and(
          eq(lessonProgress.userId, req.userId),
          eq(lessonProgress.lessonId, lessonId)
        )
      });
      
      if (!progress) {
        return res.status(200).json({
          userId: req.userId,
          lessonId,
          completed: false,
          lastPosition: 0
        });
      }
      
      return res.status(200).json(progress);
    } catch (error) {
      console.error('Error getting lesson progress:', error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Reviews routes
  app.post(`${API_PREFIX}/reviews`, authenticate, async (req, res) => {
    try {
      const reviewData = reviewsInsertSchema.parse({
        ...req.body,
        userId: req.userId
      });
      
      // Check if the course exists
      const course = await db.query.courses.findFirst({
        where: eq(courses.id, reviewData.courseId)
      });
      
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      
      // Check if user is enrolled in the course
      const enrollment = await db.query.enrollments.findFirst({
        where: and(
          eq(enrollments.userId, req.userId),
          eq(enrollments.courseId, reviewData.courseId)
        )
      });
      
      if (!enrollment) {
        return res.status(403).json({ message: "You must be enrolled in this course to review it" });
      }
      
      // Check if user already reviewed this course
      const existingReview = await db.query.reviews.findFirst({
        where: and(
          eq(reviews.userId, req.userId),
          eq(reviews.courseId, reviewData.courseId)
        )
      });
      
      let result;
      if (existingReview) {
        // Update existing review
        [result] = await db
          .update(reviews)
          .set({
            rating: reviewData.rating,
            comment: reviewData.comment,
            updatedAt: new Date()
          })
          .where(eq(reviews.id, existingReview.id))
          .returning();
      } else {
        // Create new review
        [result] = await db
          .insert(reviews)
          .values(reviewData)
          .returning();
      }
      
      // Get user details
      const user = await db.query.users.findFirst({
        where: eq(users.id, req.userId),
        columns: {
          id: true,
          fullName: true,
          avatar: true,
          username: true
        }
      });
      
      return res.status(201).json({
        ...result,
        user
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error('Error creating/updating review:', error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Stripe Payment routes - public endpoint, no authentication required
  app.post(`${API_PREFIX}/create-payment-intent`, async (req, res) => {
    try {
      const { courseId } = req.body;
      
      if (!courseId) {
        return res.status(400).json({ error: { message: "Course ID is required" } });
      }
      
      // Get course information to determine the amount
      const course = await db.query.courses.findFirst({
        where: eq(courses.id, Number(courseId)),
        columns: {
          id: true,
          title: true,
          price: true
        }
      });
      
      if (!course) {
        return res.status(404).json({ error: { message: "Course not found" } });
      }
      
      // Check if the user is authenticated
      const token = req.session.token || req.headers.authorization?.split(' ')[1];
      let userId = null;
      
      if (token) {
        try {
          const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
          userId = decoded.userId;
          
          // If user is authenticated, check if already enrolled
          if (userId) {
            const existingEnrollment = await db.query.enrollments.findFirst({
              where: and(
                eq(enrollments.userId, userId),
                eq(enrollments.courseId, Number(courseId))
              )
            });
            
            if (existingEnrollment && existingEnrollment.paymentStatus === 'completed') {
              return res.status(400).json({ error: { message: "You are already enrolled in this course" } });
            }
          }
        } catch (error) {
          // Token verification failed, continue as guest
          console.log('Token verification failed, proceeding as guest checkout');
        }
      }
      
      // Create a PaymentIntent with the order amount and currency
      const amount = typeof course.price === 'number' 
        ? Math.round(course.price * 100) // Convert to cents
        : Math.round(parseFloat(course.price.toString()) * 100);
        
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        // Store some metadata about what is being purchased
        metadata: {
          courseId: course.id.toString(),
          userId: userId ? userId.toString() : 'guest',
          courseTitle: course.title
        },
      });

      return res.status(200).json({
        clientSecret: paymentIntent.client_secret,
        courseId: course.id,
        price: course.price
      });
    } catch (error: any) {
      console.error('Error creating payment intent:', error);
      return res.status(500).json({ 
        error: { 
          message: error.message || "Failed to create payment intent" 
        } 
      });
    }
  });
  
  // Stripe webhook to handle payment completion
  app.post(`${API_PREFIX}/webhook`, async (req, res) => {
    const payload = req.body;
    const sig = req.headers['stripe-signature'] as string;
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    let event;
    
    // Verify webhook signature
    try {
      if (endpointSecret) {
        event = stripe.webhooks.constructEvent(
          payload, 
          sig, 
          endpointSecret
        );
      } else {
        // For development, we'll just use the raw payload
        event = payload;
      }
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    
    // Handle the checkout.session.completed event
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      const { courseId, userId, courseTitle } = paymentIntent.metadata;
      
      if (!courseId) {
        console.error('Missing courseId in payment metadata');
        return res.status(400).send('Missing metadata');
      }
      
      // If userId is 'guest', we'll skip enrollment creation
      // A guest purchase will need to be claimed later by a logged-in user
      if (userId === 'guest') {
        console.log(`Guest purchase for course ${courseId} (${courseTitle}) completed with payment ${paymentIntent.id}`);
        return res.status(200).json({ 
          received: true,
          status: 'guest_purchase'
        });
      }
      
      try {
        // Check if there's already an enrollment
        const existingEnrollment = await db.query.enrollments.findFirst({
          where: and(
            eq(enrollments.userId, Number(userId)),
            eq(enrollments.courseId, Number(courseId))
          )
        });
        
        if (existingEnrollment) {
          // Update the existing enrollment
          await db.update(enrollments)
            .set({
              paymentStatus: 'completed',
              paymentId: paymentIntent.id,
              paymentAmount: Number(paymentIntent.amount) / 100, // Convert from cents
              updatedAt: new Date()
            })
            .where(eq(enrollments.id, existingEnrollment.id));
        } else {
          // Create a new enrollment
          await db.insert(enrollments).values({
            userId: Number(userId),
            courseId: Number(courseId),
            paymentStatus: 'completed',
            paymentId: paymentIntent.id,
            paymentAmount: Number(paymentIntent.amount) / 100, // Convert from cents
            progress: 0
          });
        }
        
        console.log(`Successfully enrolled user ${userId} in course ${courseId}`);
      } catch (error) {
        console.error('Error processing payment webhook:', error);
        return res.status(500).send('Error processing payment');
      }
    }
    
    res.status(200).json({ received: true });
  });

  // PayPal Payment routes
  app.get(`${API_PREFIX}/paypal/setup`, async (req, res) => {
    await loadPaypalDefault(req, res);
  });

  app.post(`${API_PREFIX}/paypal/order`, async (req, res) => {
    // Request body should contain: { intent, amount, currency }
    await createPaypalOrder(req, res);
  });

  app.post(`${API_PREFIX}/paypal/order/:orderID/capture`, async (req, res) => {
    await capturePaypalOrder(req, res);
  });

  // PayPal webhook to handle payment completion
  app.post(`${API_PREFIX}/paypal/webhook`, async (req, res) => {
    try {
      const payload = req.body;
      console.log('PayPal webhook received:', payload);
      
      // Process the PayPal webhook
      if (payload.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
        const { id, custom_id, amount } = payload.resource;
        
        // custom_id should contain courseId and userId (if available)
        if (custom_id) {
          try {
            const [courseId, userId] = custom_id.split(':');
            
            if (!courseId) {
              console.error('Missing courseId in PayPal webhook data');
              return res.status(400).send('Missing courseId');
            }
            
            // If this is a guest purchase (no userId), just log it
            if (!userId || userId === 'guest') {
              console.log(`Guest purchase for course ${courseId} completed with PayPal payment ${id}`);
              return res.status(200).json({ 
                received: true,
                status: 'guest_purchase'
              });
            }
            
            // Check if there's already an enrollment
            const existingEnrollment = await db.query.enrollments.findFirst({
              where: and(
                eq(enrollments.userId, Number(userId)),
                eq(enrollments.courseId, Number(courseId))
              )
            });
            
            if (existingEnrollment) {
              // Update the existing enrollment
              await db.update(enrollments)
                .set({
                  paymentStatus: 'completed',
                  paymentId: id,
                  paymentAmount: Number(amount.value),
                  updatedAt: new Date()
                })
                .where(eq(enrollments.id, existingEnrollment.id));
            } else {
              // Create a new enrollment
              await db.insert(enrollments).values({
                userId: Number(userId),
                courseId: Number(courseId),
                paymentStatus: 'completed',
                paymentId: id,
                paymentAmount: Number(amount.value),
                progress: 0
              });
            }
            
            console.log(`Successfully enrolled user ${userId} in course ${courseId} via PayPal`);
          } catch (error) {
            console.error('Error processing PayPal webhook:', error);
            return res.status(500).send('Error processing payment');
          }
        }
      }
      
      res.status(200).json({ received: true });
    } catch (error) {
      console.error('Error handling PayPal webhook:', error);
      res.status(500).json({ error: 'Failed to process webhook' });
    }
  });

  // Instructor routes
  
  // Check if user is an instructor
  const isInstructor = async (req: any, res: any, next: any) => {
    try {
      const user = await db.query.users.findFirst({
        where: eq(users.id, req.userId),
      });
      
      if (!user || user.role !== 'instructor') {
        return res.status(403).json({ message: "Access denied. Instructor role required." });
      }
      
      next();
    } catch (error) {
      console.error('Error in instructor middleware:', error);
      return res.status(500).json({ message: "Internal server error" });
    }
  };
  
  // Get instructor's courses
  app.get(`${API_PREFIX}/instructor/courses`, authenticate, isInstructor, async (req, res) => {
    try {
      const instructorCourses = await db.query.courses.findMany({
        where: eq(courses.instructorId, req.userId),
        with: {
          language: true,
        },
        orderBy: [desc(courses.createdAt)],
      });
      
      // Enhance course data with enrollment and review statistics
      const enhancedCourses = await Promise.all(instructorCourses.map(async (course) => {
        // Get enrollment count
        const enrollmentCount = await db.select({ count: sql<number>`count(*)` })
          .from(enrollments)
          .where(eq(enrollments.courseId, course.id));
        
        // Get average rating
        const ratingData = await db.select({
          average: sql<number>`avg(${reviews.rating})`,
          count: sql<number>`count(*)`
        })
        .from(reviews)
        .where(eq(reviews.courseId, course.id));
        
        return {
          ...course,
          totalEnrollments: enrollmentCount[0]?.count || 0,
          averageRating: ratingData[0]?.average ? Number(ratingData[0].average.toFixed(1)) : null,
          reviewCount: ratingData[0]?.count || 0
        };
      }));
      
      return res.json(enhancedCourses);
    } catch (error) {
      console.error('Error getting instructor courses:', error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Get instructor dashboard statistics
  app.get(`${API_PREFIX}/instructor/stats`, authenticate, isInstructor, async (req, res) => {
    try {
      // Get total number of students enrolled in instructor's courses
      const studentCountQuery = await db.select({
        count: sql<number>`count(distinct ${enrollments.userId})`
      })
      .from(enrollments)
      .innerJoin(courses, eq(enrollments.courseId, courses.id))
      .where(eq(courses.instructorId, req.userId));
      
      // Calculate total revenue from completed enrollments
      const revenueQuery = await db.select({
        total: sql<number>`sum(${enrollments.paymentAmount})`
      })
      .from(enrollments)
      .innerJoin(courses, eq(enrollments.courseId, courses.id))
      .where(
        and(
          eq(courses.instructorId, req.userId),
          eq(enrollments.paymentStatus, 'completed')
        )
      );
      
      // Get average rating across all instructor courses
      const ratingsQuery = await db.select({
        average: sql<number>`avg(${reviews.rating})`
      })
      .from(reviews)
      .innerJoin(courses, eq(reviews.courseId, courses.id))
      .where(eq(courses.instructorId, req.userId));
      
      // Get recent course enrollments (last 10)
      const recentEnrollmentsQuery = await db.select({
        enrollmentId: enrollments.id,
        enrolledAt: enrollments.enrolledAt,
        courseId: courses.id,
        courseTitle: courses.title,
        userId: enrollments.userId,
      })
      .from(enrollments)
      .innerJoin(courses, eq(enrollments.courseId, courses.id))
      .innerJoin(users, eq(enrollments.userId, users.id))
      .where(eq(courses.instructorId, req.userId))
      .orderBy(desc(enrollments.enrolledAt))
      .limit(10);
      
      // Get recent reviews (last 5)
      const recentReviewsQuery = await db.select({
        reviewId: reviews.id,
        rating: reviews.rating,
        comment: reviews.comment,
        createdAt: reviews.createdAt,
        courseId: courses.id,
        courseTitle: courses.title,
        userId: reviews.userId,
        userName: users.fullName,
      })
      .from(reviews)
      .innerJoin(courses, eq(reviews.courseId, courses.id))
      .innerJoin(users, eq(reviews.userId, users.id))
      .where(eq(courses.instructorId, req.userId))
      .orderBy(desc(reviews.createdAt))
      .limit(5);
      
      // Format recent activities for timeline display
      const recentActivities = [
        ...recentEnrollmentsQuery.map(enrollment => ({
          type: 'enrollment',
          title: `New enrollment in "${enrollment.courseTitle}"`,
          time: new Date(enrollment.enrolledAt).toLocaleDateString(),
          data: enrollment
        })),
        ...recentReviewsQuery.map(review => ({
          type: 'review',
          title: `New ${review.rating}-star review for "${review.courseTitle}"`,
          time: new Date(review.createdAt).toLocaleDateString(),
          data: review
        }))
      ].sort((a, b) => {
        const dateA = new Date(a.data.createdAt || a.data.enrolledAt);
        const dateB = new Date(b.data.createdAt || b.data.enrolledAt);
        return dateB.getTime() - dateA.getTime();
      }).slice(0, 10);
      
      return res.json({
        totalStudents: studentCountQuery[0]?.count || 0,
        totalRevenue: revenueQuery[0]?.total ? Number(revenueQuery[0].total.toFixed(2)) : 0,
        averageRating: ratingsQuery[0]?.average ? Number(ratingsQuery[0].average.toFixed(1)) : 0,
        recentActivities
      });
    } catch (error) {
      console.error('Error getting instructor stats:', error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  return httpServer;
}
