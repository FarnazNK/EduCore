// server/src/controllers/progress.controller.ts

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { AppError } from '../utils/AppError';
import { io } from '../index';
import { emitToUser } from '../socket';

const updateProgressSchema = z.object({
  completed: z.boolean().optional(),
  watchTime: z.number().min(0).optional(),
});

export const progressController = {
  /**
   * Update lesson progress
   */
  updateProgress: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.id;
      const { lessonId } = req.params;
      const validatedData = updateProgressSchema.parse(req.body);

      // Verify lesson exists
      const lesson = await prisma.lesson.findUnique({
        where: { id: lessonId },
        include: {
          module: {
            include: {
              course: true,
            },
          },
        },
      });

      if (!lesson) {
        throw new AppError('Lesson not found', 404);
      }

      // Verify enrollment
      const enrollment = await prisma.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId,
            courseId: lesson.module.courseId,
          },
        },
      });

      if (!enrollment) {
        throw new AppError('Not enrolled in this course', 403);
      }

      // Update or create progress
      const progress = await prisma.progress.upsert({
        where: {
          userId_lessonId: {
            userId,
            lessonId,
          },
        },
        update: {
          ...(validatedData.completed !== undefined && {
            completed: validatedData.completed,
            completedAt: validatedData.completed ? new Date() : null,
          }),
          ...(validatedData.watchTime !== undefined && {
            watchTime: validatedData.watchTime,
          }),
        },
        create: {
          userId,
          lessonId,
          completed: validatedData.completed || false,
          watchTime: validatedData.watchTime || 0,
          completedAt: validatedData.completed ? new Date() : null,
        },
      });

      // If lesson was just completed, create activity
      if (validatedData.completed && progress.completedAt) {
        await prisma.activity.create({
          data: {
            userId,
            type: 'LESSON_COMPLETE',
            metadata: {
              lessonId,
              lessonTitle: lesson.title,
              courseId: lesson.module.courseId,
              courseName: lesson.module.course.title,
            },
          },
        });

        // Check if course is completed
        const [totalLessons, completedLessons] = await Promise.all([
          prisma.lesson.count({
            where: {
              module: {
                courseId: lesson.module.courseId,
              },
              published: true,
            },
          }),
          prisma.progress.count({
            where: {
              userId,
              completed: true,
              lesson: {
                module: {
                  courseId: lesson.module.courseId,
                },
                published: true,
              },
            },
          }),
        ]);

        const progressPercentage = Math.round(
          (completedLessons / totalLessons) * 100
        );

        // Update enrollment progress
        await prisma.enrollment.update({
          where: {
            userId_courseId: {
              userId,
              courseId: lesson.module.courseId,
            },
          },
          data: {
            progress: progressPercentage,
            ...(progressPercentage === 100 && {
              status: 'COMPLETED',
              completedAt: new Date(),
            }),
          },
        });

        // If course completed, award achievement
        if (progressPercentage === 100) {
          await prisma.activity.create({
            data: {
              userId,
              type: 'COURSE_COMPLETE',
              metadata: {
                courseId: lesson.module.courseId,
                courseName: lesson.module.course.title,
              },
            },
          });

          // Award completion achievement
          const completionAchievement = await prisma.achievement.findFirst({
            where: { name: 'Course Completer' },
          });

          if (completionAchievement) {
            await prisma.userAchievement.create({
              data: {
                userId,
                achievementId: completionAchievement.id,
              },
            }).catch(() => {}); // Ignore if already exists
          }

          // Create notification
          await prisma.notification.create({
            data: {
              userId,
              title: 'Course Completed!',
              message: `Congratulations! You've completed ${lesson.module.course.title}`,
              type: 'ACHIEVEMENT',
            },
          });

          // Send certificate email
          const user = await prisma.user.findUnique({
            where: { id: userId },
          });

          if (user) {
            await emailService.sendCertificateEmail(
              user.email,
              user.firstName,
              lesson.module.course.title,
              `https://yourdomain.com/certificates/${enrollment.id}`
            );
          }
        }

        // Emit real-time update
        if (io) {
          emitToUser(io, userId, 'progress:updated', {
            lessonId,
            courseId: lesson.module.courseId,
            progress: progressPercentage,
          });
        }
      }

      res.json({
        success: true,
        data: { progress },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get lesson progress
   */
  getLessonProgress: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.id;
      const { lessonId } = req.params;

      const progress = await prisma.progress.findUnique({
        where: {
          userId_lessonId: {
            userId,
            lessonId,
          },
        },
      });

      res.json({
        success: true,
        data: { progress: progress || null },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get course progress
   */
  getCourseProgress: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.id;
      const { courseId } = req.params;

      // Get all lessons in course
      const lessons = await prisma.lesson.findMany({
        where: {
          module: {
            courseId,
          },
          published: true,
        },
        include: {
          module: {
            select: {
              id: true,
              title: true,
              order: true,
            },
          },
        },
        orderBy: [
          { module: { order: 'asc' } },
          { order: 'asc' },
        ],
      });

      const lessonIds = lessons.map((l) => l.id);

      // Get progress for all lessons
      const progressRecords = await prisma.progress.findMany({
        where: {
          userId,
          lessonId: {
            in: lessonIds,
          },
        },
      });

      const progressMap = new Map(
        progressRecords.map((p) => [p.lessonId, p])
      );

      // Organize by module
      const moduleMap = new Map<string, any>();

      lessons.forEach((lesson) => {
        if (!moduleMap.has(lesson.module.id)) {
          moduleMap.set(lesson.module.id, {
            moduleId: lesson.module.id,
            moduleTitle: lesson.module.title,
            moduleOrder: lesson.module.order,
            lessons: [],
          });
        }

        const module = moduleMap.get(lesson.module.id);
        module.lessons.push({
          id: lesson.id,
          title: lesson.title,
          duration: lesson.duration,
          order: lesson.order,
          progress: progressMap.get(lesson.id) || null,
        });
      });

      const modules = Array.from(moduleMap.values()).sort(
        (a, b) => a.moduleOrder - b.moduleOrder
      );

      // Calculate overall progress
      const totalLessons = lessons.length;
      const completedLessons = progressRecords.filter((p) => p.completed).length;
      const progressPercentage = totalLessons > 0 
        ? Math.round((completedLessons / totalLessons) * 100) 
        : 0;

      // Calculate total watch time
      const totalWatchTime = progressRecords.reduce(
        (sum, p) => sum + p.watchTime,
        0
      );

      res.json({
        success: true,
        data: {
          courseId,
          totalLessons,
          completedLessons,
          progressPercentage,
          totalWatchTime,
          modules,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get user's overall progress statistics
   */
  getOverallProgress: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.id;

      // Get enrollments
      const enrollments = await prisma.enrollment.findMany({
        where: { userId },
        include: {
          course: {
            select: {
              id: true,
              title: true,
              thumbnail: true,
            },
          },
        },
      });

      // Get total lessons completed
      const totalCompletedLessons = await prisma.progress.count({
        where: {
          userId,
          completed: true,
        },
      });

      // Get total watch time
      const watchTimeResult = await prisma.progress.aggregate({
        where: { userId },
        _sum: { watchTime: true },
      });

      const totalWatchTime = watchTimeResult._sum.watchTime || 0;

      // Get recent progress
      const recentProgress = await prisma.progress.findMany({
        where: {
          userId,
          completed: true,
        },
        include: {
          lesson: {
            include: {
              module: {
                include: {
                  course: {
                    select: {
                      title: true,
                      thumbnail: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { completedAt: 'desc' },
        take: 10,
      });

      // Calculate learning streak
      const activities = await prisma.activity.findMany({
        where: {
          userId,
          type: 'LESSON_COMPLETE',
        },
        orderBy: { createdAt: 'desc' },
      });

      let streak = 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (const activity of activities) {
        const activityDate = new Date(activity.createdAt);
        activityDate.setHours(0, 0, 0, 0);

        const diffDays = Math.floor(
          (today.getTime() - activityDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (diffDays === streak) {
          streak++;
        } else {
          break;
        }
      }

      res.json({
        success: true,
        data: {
          totalEnrollments: enrollments.length,
          activeEnrollments: enrollments.filter((e) => e.status === 'ACTIVE').length,
          completedCourses: enrollments.filter((e) => e.status === 'COMPLETED').length,
          totalCompletedLessons,
          totalWatchTime,
          learningStreak: streak,
          recentProgress,
          enrollments: enrollments.map((e) => ({
            courseId: e.course.id,
            courseTitle: e.course.title,
            courseThumbnail: e.course.thumbnail,
            progress: e.progress,
            status: e.status,
            enrolledAt: e.enrolledAt,
          })),
        },
      });
    } catch (error) {
      next(error);
    }
  },
};
