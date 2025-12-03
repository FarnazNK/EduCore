// server/src/controllers/course.controller.ts

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { AppError } from '../utils/AppError';
import { generateSlug } from '../utils/helpers';

const createCourseSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10),
  category: z.string(),
  level: z.enum(['Beginner', 'Intermediate', 'Advanced']),
  language: z.string().default('en'),
  price: z.number().min(0).default(0),
  thumbnail: z.string().url().optional(),
});

const updateCourseSchema = createCourseSchema.partial();

export const courseController = {
  /**
   * Get all courses with pagination and filters
   */
  getCourses: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
      const skip = (page - 1) * limit;

      const { category, level, search, status } = req.query;

      const where: any = {
        status: status || 'PUBLISHED',
      };

      if (category) where.category = category;
      if (level) where.level = level;
      if (search) {
        where.OR = [
          { title: { contains: search as string, mode: 'insensitive' } },
          { description: { contains: search as string, mode: 'insensitive' } },
        ];
      }

      const [courses, total] = await Promise.all([
        prisma.course.findMany({
          where,
          skip,
          take: limit,
          include: {
            instructor: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
            _count: {
              select: {
                enrollments: true,
                modules: true,
                reviews: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.course.count({ where }),
      ]);

      // Calculate average ratings
      const coursesWithRatings = await Promise.all(
        courses.map(async (course) => {
          const avgRating = await prisma.review.aggregate({
            where: { courseId: course.id },
            _avg: { rating: true },
          });

          return {
            ...course,
            averageRating: avgRating._avg.rating || 0,
            totalEnrollments: course._count.enrollments,
            totalModules: course._count.modules,
            totalReviews: course._count.reviews,
          };
        })
      );

      res.json({
        success: true,
        data: {
          courses: coursesWithRatings,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get course by ID or slug
   */
  getCourse: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const course = await prisma.course.findFirst({
        where: {
          OR: [{ id }, { slug: id }],
        },
        include: {
          instructor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
              bio: true,
            },
          },
          modules: {
            orderBy: { order: 'asc' },
            include: {
              lessons: {
                orderBy: { order: 'asc' },
                select: {
                  id: true,
                  title: true,
                  duration: true,
                  order: true,
                  published: true,
                },
              },
            },
          },
          _count: {
            select: {
              enrollments: true,
              reviews: true,
            },
          },
        },
      });

      if (!course) {
        throw new AppError('Course not found', 404);
      }

      // Calculate average rating and total duration
      const [avgRating, totalDuration] = await Promise.all([
        prisma.review.aggregate({
          where: { courseId: course.id },
          _avg: { rating: true },
        }),
        prisma.lesson.aggregate({
          where: {
            module: { courseId: course.id },
          },
          _sum: { duration: true },
        }),
      ]);

      res.json({
        success: true,
        data: {
          course: {
            ...course,
            averageRating: avgRating._avg.rating || 0,
            totalDuration: totalDuration._sum.duration || 0,
            totalEnrollments: course._count.enrollments,
            totalReviews: course._count.reviews,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Create new course (Instructor/Admin only)
   */
  createCourse: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.id;
      const validatedData = createCourseSchema.parse(req.body);

      const slug = generateSlug(validatedData.title);

      // Check if slug exists
      const existingCourse = await prisma.course.findUnique({
        where: { slug },
      });

      if (existingCourse) {
        throw new AppError('Course with similar title already exists', 400);
      }

      const course = await prisma.course.create({
        data: {
          ...validatedData,
          slug,
          instructorId: userId,
        },
        include: {
          instructor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
        },
      });

      res.status(201).json({
        success: true,
        data: { course },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update course
   */
  updateCourse: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = (req as any).user.id;
      const userRole = (req as any).user.role;
      const validatedData = updateCourseSchema.parse(req.body);

      // Check if course exists
      const existingCourse = await prisma.course.findUnique({
        where: { id },
      });

      if (!existingCourse) {
        throw new AppError('Course not found', 404);
      }

      // Check permissions
      if (existingCourse.instructorId !== userId && userRole !== 'ADMIN') {
        throw new AppError('Not authorized to update this course', 403);
      }

      // Update slug if title changed
      let updateData: any = { ...validatedData };
      if (validatedData.title) {
        updateData.slug = generateSlug(validatedData.title);
      }

      const course = await prisma.course.update({
        where: { id },
        data: updateData,
        include: {
          instructor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
        },
      });

      res.json({
        success: true,
        data: { course },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Delete course
   */
  deleteCourse: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = (req as any).user.id;
      const userRole = (req as any).user.role;

      const course = await prisma.course.findUnique({
        where: { id },
      });

      if (!course) {
        throw new AppError('Course not found', 404);
      }

      if (course.instructorId !== userId && userRole !== 'ADMIN') {
        throw new AppError('Not authorized to delete this course', 403);
      }

      await prisma.course.delete({
        where: { id },
      });

      res.json({
        success: true,
        message: 'Course deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Publish course
   */
  publishCourse: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = (req as any).user.id;
      const userRole = (req as any).user.role;

      const course = await prisma.course.findUnique({
        where: { id },
        include: {
          modules: {
            include: {
              lessons: true,
            },
          },
        },
      });

      if (!course) {
        throw new AppError('Course not found', 404);
      }

      if (course.instructorId !== userId && userRole !== 'ADMIN') {
        throw new AppError('Not authorized to publish this course', 403);
      }

      // Validate course has content
      if (course.modules.length === 0) {
        throw new AppError('Course must have at least one module', 400);
      }

      const hasLessons = course.modules.some((module) => module.lessons.length > 0);
      if (!hasLessons) {
        throw new AppError('Course must have at least one lesson', 400);
      }

      const updatedCourse = await prisma.course.update({
        where: { id },
        data: {
          status: 'PUBLISHED',
          publishedAt: new Date(),
        },
      });

      res.json({
        success: true,
        data: { course: updatedCourse },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get course reviews
   */
  getCourseReviews: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
      const skip = (page - 1) * limit;

      const [reviews, total] = await Promise.all([
        prisma.review.findMany({
          where: { courseId: id },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.review.count({ where: { courseId: id } }),
      ]);

      res.json({
        success: true,
        data: {
          reviews,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error) {
      next(error);
    }
  },
};
