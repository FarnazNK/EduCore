// client/src/components/courses/CourseCard.tsx

import { Link } from 'react-router-dom';
import { Clock, Users, Star, BookOpen } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '../ui/card';
import { Badge } from '../ui/badge';

interface CourseCardProps {
  course: {
    id: string;
    title: string;
    slug: string;
    description: string;
    thumbnail?: string;
    category: string;
    level: string;
    price: number;
    instructor: {
      firstName: string;
      lastName: string;
      avatar?: string;
    };
    averageRating?: number;
    totalEnrollments?: number;
    totalModules?: number;
    totalDuration?: number;
  };
}

export default function CourseCard({ course }: CourseCardProps) {
  const formatDuration = (seconds: number = 0) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  return (
    <Link to={`/courses/${course.slug || course.id}`}>
      <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
        <CardHeader className="p-0">
          <div className="relative h-48 bg-gray-200 rounded-t-lg overflow-hidden">
            {course.thumbnail ? (
              <img
                src={course.thumbnail}
                alt={course.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
                <BookOpen className="h-16 w-16 text-white" />
              </div>
            )}
            <div className="absolute top-2 right-2">
              <Badge variant="secondary">{course.level}</Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4">
          <div className="mb-2">
            <Badge variant="outline" className="text-xs">
              {course.category}
            </Badge>
          </div>

          <h3 className="font-semibold text-lg mb-2 line-clamp-2">{course.title}</h3>
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">{course.description}</p>

          <div className="flex items-center gap-2 mb-3">
            {course.instructor.avatar ? (
              <img
                src={course.instructor.avatar}
                alt={`${course.instructor.firstName} ${course.instructor.lastName}`}
                className="w-6 h-6 rounded-full"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-gray-300" />
            )}
            <span className="text-sm text-gray-600">
              {course.instructor.firstName} {course.instructor.lastName}
            </span>
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-500">
            {course.averageRating !== undefined && (
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span>{course.averageRating.toFixed(1)}</span>
              </div>
            )}
            {course.totalEnrollments !== undefined && (
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{course.totalEnrollments}</span>
              </div>
            )}
            {course.totalDuration !== undefined && (
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{formatDuration(course.totalDuration)}</span>
              </div>
            )}
          </div>
        </CardContent>

        <CardFooter className="p-4 pt-0">
          <div className="flex items-center justify-between w-full">
            <div className="text-2xl font-bold text-blue-600">
              {course.price === 0 ? 'Free' : `$${course.price}`}
            </div>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
