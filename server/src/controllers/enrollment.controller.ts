// server/src/controllers/enrollment.controller.ts

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { AppError } from '../utils/AppError';
import { emailService } from '../services/email.service';

const enrollSchema = z.object({
  courseId: z.string().uuid(),
});

export const enrollmentController = {
  /**
   * Enroll in a course
   */
  enrollInCourse: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.id;
      const { courseId } = enrollSchema.parse(req.body);

      // Check if course exists and is published
      const course = await prisma.course.findUnique({
        where: { id: courseId },
        include: {
          instructor: {
            select: { firstName: true, lastName: true },
          },
        },
      });

      if (!course) {
        throw new AppError('Course not found', 404);
      }

      if (course.status !== 'PUBLISHED') {
        throw new AppError('Course is not available for enrollment', 400);
      }

      // Check if already enrolled
      const existingEnrollment = await prisma.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId,
            courseId,
          },
        },
      });

      if (existingEnrollment) {
        throw new AppError('Already enrolled in this course', 400);
      }

      // Check prerequisites
      const prerequisites = await prisma.coursePrerequisite.findMany({
        where: { courseId },
        include: {
          prerequisite: true,
        },
      });

      if (prerequisites.length > 0) {
        const completedPrerequisites = await prisma.enrollment.findMany({
          where: {
            userId,
            courseId: {
              in: prerequisites.map((p) => p.prerequisiteId),
            },
            status: 'COMPLETED',
          },
        });

        if (completedPrerequisites.length < prerequisites.length) {
          throw new AppError('Prerequisites not completed', 400);
        }
      }

      // Create enrollment
      const enrollment = await prisma.enrollment.create({
        data: {
          userId,
          courseId,
          status: 'ACTIVE',
        },
        include: {
          course: {
            include: {
              instructor: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      });

      // Create activity
      await prisma.activity.create({
        data: {
          userId,
          type: 'COURSE_ENROLLED',
          metadata: {
            courseId,
            courseName: course.title,
          },
        },
      });

      // Create notification
      await prisma.notification.create({
        data: {
          userId,
          title: 'Enrollment Successful',
          message: `You have successfully enrolled in ${course.title}`,
          type: 'ENROLLMENT',
          link: `/courses/${course.id}`,
        },
      });

      // Send email
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (user) {
        await emailService.sendCourseEnrollmentEmail(
          user.email,
          user.firstName,
          course.title
        );
      }

      res.status(201).json({
        success: true,
        data: { enrollment },
        message: 'Successfully enrolled in course',
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get user's enrolled courses
   */
  getMyEnrollments: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
      const skip = (page - 1) * limit;
      const status = req.query.status as string;

      const where: any = { userId };
      if (status) where.status = status;

      const [enrollments, total] = await Promise.all([
        prisma.enrollment.findMany({
          where,
          skip,
          take: limit,
          include: {
            course: {
              include: {
                instructor: {
                  select: {
                    firstName: true,
                    lastName: true,
                    avatar: true,
                  },
                },
                _count: {
                  select: {
                    modules: true,
                  },
                },
              },
            },
          },
          orderBy: { enrolledAt: 'desc' },
        }),
        prisma.enrollment.count({ where }),
      ]);

      // Calculate total lessons for each course
      const enrollmentsWithDetails = await Promise.all(
        enrollments.map(async (enrollment) => {
          const totalLessons = await prisma.lesson.count({
            where: {
              module: {
                courseId: enrollment.courseId,
              },
            },
          });

          const completedLessons = await prisma.progress.count({
            where: {
              userId,
              completed: true,
              lesson: {
                module: {
                  courseId: enrollment.courseId,
                },
              },
            },
          });

          return {
            ...enrollment,
            totalLessons,
            completedLessons,
            progressPercentage: totalLessons > 0 
              ? Math.round((completedLessons / totalLessons) * 100) 
              : 0,
          };
        })
      );

      res.json({
        success: true,
        data: {
          enrollments: enrollmentsWithDetails,
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
   * Get specific enrollment details
   */
  getEnrollment: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.id;
      const { courseId } = req.params;

      const enrollment = await prisma.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId,
            courseId,
          },
        },
        include: {
          course: {
            include: {
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
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!enrollment) {
        throw new AppError('Enrollment not found', 404);
      }

      // Get progress for each lesson
      const allLessonIds = enrollment.course.modules.flatMap((module) =>
        module.lessons.map((lesson) => lesson.id)
      );

      const progressRecords = await prisma.progress.findMany({
        where: {
          userId,
          lessonId: {
            in: allLessonIds,
          },
        },
      });

      const progressMap = new Map(
        progressRecords.map((p) => [p.lessonId, p])
      );

      // Enrich course data with progress
      const enrichedCourse = {
        ...enrollment.course,
        modules: enrollment.course.modules.map((module) => ({
          ...module,
          lessons: module.lessons.map((lesson) => ({
            ...lesson,
            progress: progressMap.get(lesson.id) || null,
          })),
        })),
      };

      res.json({
        success: true,
        data: {
          enrollment: {
            ...enrollment,
            course: enrichedCourse,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Drop/unenroll from course
   */
  dropCourse: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;

      const enrollment = await prisma.enrollment.findUnique({
        where: { id },
        include: {
          course: true,
        },
      });

      if (!enrollment) {
        throw new AppError('Enrollment not found', 404);
      }

      if (enrollment.userId !== userId) {
        throw new AppError('Not authorized to drop this enrollment', 403);
      }

      if (enrollment.status === 'COMPLETED') {
        throw new AppError('Cannot drop a completed course', 400);
      }

      await prisma.enrollment.update({
        where: { id },
        data: { status: 'DROPPED' },
      });

      // Create activity
      await prisma.activity.create({
        data: {
          userId,
          type: 'COURSE_DROPPED',
          metadata: {
            courseId: enrollment.courseId,
            courseName: enrollment.course.title,
          },
        },
      });

      res.json({
        success: true,
        message: 'Successfully dropped course',
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get enrollment statistics
   */
  getEnrollmentStats: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.id;

      const [activeCount, completedCount, totalCount] = await Promise.all([
        prisma.enrollment.count({
          where: { userId, status: 'ACTIVE' },
        }),
        prisma.enrollment.count({
          where: { userId, status: 'COMPLETED' },
        }),
        prisma.enrollment.count({ where: { userId } }),
      ]);

      // Get recent activity
      const recentActivity = await prisma.activity.findMany({
        where: {
          userId,
          type: {
            in: ['COURSE_ENROLLED', 'COURSE_COMPLETE', 'LESSON_COMPLETE'],
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });

      // Get achievements
      const achievements = await prisma.userAchievement.findMany({
        where: { userId },
        include: {
          achievement: true,
        },
        orderBy: { earnedAt: 'desc' },
      });

      res.json({
        success: true,
        data: {
          stats: {
            active: activeCount,
            completed: completedCount,
            total: totalCount,
            dropped: totalCount - activeCount - completedCount,
          },
          recentActivity,
          achievements,
        },
      });
    } catch (error) {
      next(error);
    }
  },
};
