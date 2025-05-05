import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Loader2, BookOpen, Users, Award, LineChart, Plus, Edit, Settings, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import MainNav from "@/components/ui/main-nav";
import Footer from "@/components/ui/footer";
import DashboardStats from "@/components/ui/dashboard-stats";
import EnrolledCourseCard from "@/components/ui/enrolled-course-card";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

// Instructor Dashboard Component
const InstructorDashboard = () => {
  const [activeTab, setActiveTab] = useState("my-courses");
  
  const { data: instructorCourses, isLoading: isLoadingCourses } = useQuery({
    queryKey: ['/api/instructor/courses'],
  });
  
  const { data: instructorStats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['/api/instructor/stats'],
  });
  
  // Content loading animation
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.4 } }
  };
  
  if (isLoadingCourses || isLoadingStats) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  const publishedCourses = instructorCourses?.filter((course: any) => course.publishedAt) || [];
  const draftCourses = instructorCourses?.filter((course: any) => !course.publishedAt) || [];
  
  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="flex flex-col gap-8"
    >
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Users className="h-5 w-5 text-primary mr-2" />
              <div className="text-3xl font-bold">{instructorStats?.totalStudents || 0}</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Courses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <BookOpen className="h-5 w-5 text-indigo-500 mr-2" />
              <div className="text-3xl font-bold">{publishedCourses.length}</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <LineChart className="h-5 w-5 text-emerald-500 mr-2" />
              <div className="text-3xl font-bold">${instructorStats?.totalRevenue || 0}</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Average Rating</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Award className="h-5 w-5 text-amber-500 mr-2" />
              <div className="text-3xl font-bold">{instructorStats?.averageRating || '0.0'}</div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
      
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Your Courses</h2>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create New Course
        </Button>
      </motion.div>
      
      <motion.div variants={itemVariants}>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="my-courses">All Courses ({instructorCourses?.length || 0})</TabsTrigger>
            <TabsTrigger value="published">Published ({publishedCourses.length})</TabsTrigger>
            <TabsTrigger value="drafts">Drafts ({draftCourses.length})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="my-courses" className="mt-6">
            {instructorCourses?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {instructorCourses.map((course: any) => (
                  <InstructorCourseCard key={course.id} course={course} />
                ))}
              </div>
            ) : (
              <EmptyCourseState />
            )}
          </TabsContent>
          
          <TabsContent value="published" className="mt-6">
            {publishedCourses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {publishedCourses.map((course: any) => (
                  <InstructorCourseCard key={course.id} course={course} />
                ))}
              </div>
            ) : (
              <EmptyCourseState message="You don't have any published courses yet" />
            )}
          </TabsContent>
          
          <TabsContent value="drafts" className="mt-6">
            {draftCourses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {draftCourses.map((course: any) => (
                  <InstructorCourseCard key={course.id} course={course} />
                ))}
              </div>
            ) : (
              <EmptyCourseState message="You don't have any draft courses" />
            )}
          </TabsContent>
        </Tabs>
      </motion.div>
      
      <motion.div variants={itemVariants}>
        <h2 className="text-2xl font-bold mb-6">Recent Activity</h2>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-6">
              {(instructorStats?.recentActivities || []).length > 0 ? (
                instructorStats?.recentActivities.map((activity: any, index: number) => (
                  <div key={index} className="flex items-start">
                    <div className="flex-shrink-0 mr-4">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Clock className="h-5 w-5 text-primary" />
                      </div>
                    </div>
                    <div>
                      <p className="font-medium">{activity.title}</p>
                      <p className="text-sm text-muted-foreground">{activity.time}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-4">No recent activity</p>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

// Student Dashboard Component 
const StudentDashboard = () => {
  const [activeTab, setActiveTab] = useState("my-courses");
  
  const { data: enrollments, isLoading: isLoadingEnrollments } = useQuery({
    queryKey: ['/api/enrollments'],
  });

  const inProgressCourses = enrollments?.filter((enrollment: any) => 
    enrollment.progress < 100
  ) || [];

  const completedCourses = enrollments?.filter((enrollment: any) => 
    enrollment.progress === 100
  ) || [];
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.4 } }
  };

  if (isLoadingEnrollments) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {enrollments?.length > 0 ? (
        <>
          <motion.div variants={itemVariants}>
            <DashboardStats 
              totalCourses={enrollments.length} 
              inProgress={inProgressCourses.length}
              completed={completedCourses.length}
            />
          </motion.div>
          
          <motion.div variants={itemVariants} className="mt-8">
            <Tabs 
              value={activeTab} 
              onValueChange={setActiveTab}
            >
              <TabsList className="mb-8">
                <TabsTrigger value="my-courses">My Courses ({enrollments.length})</TabsTrigger>
                <TabsTrigger value="in-progress">In Progress ({inProgressCourses.length})</TabsTrigger>
                <TabsTrigger value="completed">Completed ({completedCourses.length})</TabsTrigger>
              </TabsList>
              
              <AnimatePresence mode="wait">
                <TabsContent value="my-courses" className="space-y-6">
                  {enrollments.map((enrollment: any) => (
                    <motion.div 
                      key={enrollment.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <EnrolledCourseCard
                        courseId={enrollment.course.id}
                        title={enrollment.course.title}
                        imageUrl={enrollment.course.imageUrl}
                        language={enrollment.course.language?.name || "Language"}
                        level={enrollment.course.level.charAt(0).toUpperCase() + enrollment.course.level.slice(1)}
                        progress={enrollment.progress}
                        lastUpdated={new Date(enrollment.updatedAt || enrollment.enrolledAt)} 
                        instructor={{
                          name: enrollment.course.instructor?.fullName,
                          avatar: enrollment.course.instructor?.avatar || `https://api.dicebear.com/6.x/avataaars/svg?seed=${enrollment.course.instructorId}`
                        }}
                        totalLessons={enrollment.totalLessons}
                        completedLessons={enrollment.completedLessons}
                      />
                    </motion.div>
                  ))}
                </TabsContent>
                
                <TabsContent value="in-progress" className="space-y-6">
                  {inProgressCourses.length > 0 ? (
                    inProgressCourses.map((enrollment: any) => (
                      <motion.div 
                        key={enrollment.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <EnrolledCourseCard
                          courseId={enrollment.course.id}
                          title={enrollment.course.title}
                          imageUrl={enrollment.course.imageUrl}
                          language={enrollment.course.language?.name || "Language"}
                          level={enrollment.course.level.charAt(0).toUpperCase() + enrollment.course.level.slice(1)}
                          progress={enrollment.progress}
                          lastUpdated={new Date(enrollment.updatedAt || enrollment.enrolledAt)} 
                          instructor={{
                            name: enrollment.course.instructor?.fullName,
                            avatar: enrollment.course.instructor?.avatar || `https://api.dicebear.com/6.x/avataaars/svg?seed=${enrollment.course.instructorId}`
                          }}
                          totalLessons={enrollment.totalLessons}
                          completedLessons={enrollment.completedLessons}
                        />
                      </motion.div>
                    ))
                  ) : (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-10"
                    >
                      <h3 className="text-xl font-semibold text-text-primary mb-2">No courses in progress</h3>
                      <p className="text-text-secondary mb-6">
                        You haven't started any courses yet.
                      </p>
                      <Button asChild>
                        <Link href="/courses">
                          Browse Courses
                        </Link>
                      </Button>
                    </motion.div>
                  )}
                </TabsContent>
                
                <TabsContent value="completed" className="space-y-6">
                  {completedCourses.length > 0 ? (
                    completedCourses.map((enrollment: any) => (
                      <motion.div 
                        key={enrollment.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <EnrolledCourseCard
                          courseId={enrollment.course.id}
                          title={enrollment.course.title}
                          imageUrl={enrollment.course.imageUrl}
                          language={enrollment.course.language?.name || "Language"}
                          level={enrollment.course.level.charAt(0).toUpperCase() + enrollment.course.level.slice(1)}
                          progress={enrollment.progress}
                          lastUpdated={new Date(enrollment.updatedAt || enrollment.enrolledAt)} 
                          instructor={{
                            name: enrollment.course.instructor?.fullName,
                            avatar: enrollment.course.instructor?.avatar || `https://api.dicebear.com/6.x/avataaars/svg?seed=${enrollment.course.instructorId}`
                          }}
                          completed={true}
                          totalLessons={enrollment.totalLessons}
                          completedLessons={enrollment.completedLessons}
                        />
                      </motion.div>
                    ))
                  ) : (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-10"
                    >
                      <h3 className="text-xl font-semibold text-text-primary mb-2">No completed courses</h3>
                      <p className="text-text-secondary mb-6">
                        Keep learning to complete your enrolled courses.
                      </p>
                      <Button asChild>
                        <Link href="/courses">
                          Browse Courses
                        </Link>
                      </Button>
                    </motion.div>
                  )}
                </TabsContent>
              </AnimatePresence>
            </Tabs>
          </motion.div>
        </>
      ) : (
        <motion.div 
          variants={itemVariants}
          className="text-center py-20"
        >
          <h2 className="text-2xl font-bold text-text-primary mb-2">You're not enrolled in any courses yet</h2>
          <p className="text-text-secondary mb-8">
            Explore our course catalog and start your learning journey today!
          </p>
          <Button size="lg" asChild>
            <Link href="/courses">
              Browse Courses
            </Link>
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
};

// Helper component for instructor course card
const InstructorCourseCard = ({ course }: { course: any }) => {
  return (
    <Card className="overflow-hidden">
      {course.imageUrl && (
        <div className="h-48 overflow-hidden">
          <img 
            src={course.imageUrl} 
            alt={course.title}
            className="w-full h-full object-cover transition-transform hover:scale-105 duration-300"
          />
        </div>
      )}
      
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl">{course.title}</CardTitle>
          {course.publishedAt ? (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Published</Badge>
          ) : (
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Draft</Badge>
          )}
        </div>
        <CardDescription className="line-clamp-2">{course.description}</CardDescription>
      </CardHeader>
      
      <CardContent className="pb-2">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div>Price: ${typeof course.price === 'number' ? course.price.toFixed(2) : course.price}</div>
          <div>{course.totalEnrollments || 0} student{course.totalEnrollments !== 1 ? 's' : ''}</div>
        </div>
        
        {course.averageRating && (
          <div className="flex items-center mt-2">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <svg 
                  key={star}
                  className={`w-4 h-4 ${star <= Math.round(course.averageRating) ? 'text-yellow-400' : 'text-gray-300'}`}
                  fill="currentColor" 
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="ml-1 text-sm text-muted-foreground">({course.reviewCount || 0})</span>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/courses/${course.id}`}>
            View
          </Link>
        </Button>
        <Button variant="default" size="sm">
          <Edit className="h-4 w-4 mr-2" />
          Edit
        </Button>
      </CardFooter>
    </Card>
  );
};

// Helper component for empty course state
const EmptyCourseState = ({ message = "You haven't created any courses yet" }: { message?: string }) => {
  return (
    <div className="text-center py-10 border border-dashed rounded-lg border-gray-300">
      <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
      <h3 className="text-xl font-semibold text-text-primary mb-2">{message}</h3>
      <p className="text-text-secondary mb-6">
        Start creating courses to share your knowledge with the world
      </p>
      <Button>
        <Plus className="h-4 w-4 mr-2" />
        Create New Course
      </Button>
    </div>
  );
};

// Main Dashboard component that conditionally renders based on user role
export default function Dashboard() {
  const [, navigate] = useLocation();
  const { user, isLoading: isLoadingAuth } = useAuth();

  // Redirect to auth page if not logged in
  if (!isLoadingAuth && !user) {
    navigate("/auth?mode=login");
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <MainNav />
      
      <main className="flex-grow bg-background py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-text-primary mb-2">
                {user?.role === "instructor" ? "Instructor Dashboard" : "My Dashboard"}
              </h1>
              <p className="text-text-secondary">
                {user?.role === "instructor" 
                  ? "Manage your courses and view student progress"
                  : "Track your progress and continue your learning journey"}
              </p>
            </div>
            
            <div className="mt-4 md:mt-0">
              {user?.role === "instructor" ? (
                <Button asChild>
                  <Link href="/courses/create">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Course
                  </Link>
                </Button>
              ) : (
                <Button asChild>
                  <Link href="/courses">
                    Browse More Courses
                  </Link>
                </Button>
              )}
            </div>
          </div>
          
          {isLoadingAuth ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            user?.role === "instructor" ? <InstructorDashboard /> : <StudentDashboard />
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
