import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";

import MainNav from "@/components/ui/main-nav";
import Footer from "@/components/ui/footer";
import CourseCard from "@/components/ui/course-card";
import EducationFeature from "@/components/ui/education-feature";
import TestimonialCard from "@/components/ui/testimonial-card";
import HeroSection from "@/components/ui/hero-section";
import { Button } from "@/components/ui/button";

export default function Home() {
  const { data: coursesData, isLoading } = useQuery({
    queryKey: ['/api/courses?featured=true&limit=3'],
  });

  const featuredCourses = coursesData?.courses || [];

  const testimonials = [
    {
      content: "EduSuccess helped me improve my math grade from a C to an A-! The engaging videos and practice problems made concepts so much clearer than my textbook ever did.",
      author: "John Doe",
      role: "8th Grade Student",
      avatar: "https://api.dicebear.com/6.x/avataaars/svg?seed=John"
    },
    {
      content: "The Science courses were exactly what I needed to prepare for high school. The interactive experiments and visual explanations helped me understand complex topics easily.",
      author: "Sarah Johnson",
      role: "6th Grade Student",
      avatar: "https://api.dicebear.com/6.x/avataaars/svg?seed=Sarah"
    },
    {
      content: "History used to be boring until I found EduSuccess. The storytelling approach and timeline visualizations made everything connect in a way I'd never experienced before!",
      author: "Michael Chen",
      role: "10th Grade Student",
      avatar: "https://api.dicebear.com/6.x/avataaars/svg?seed=Michael"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <MainNav />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <HeroSection />

        {/* Course Filter Section */}
        <section className="py-8 bg-background">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-text-primary mb-4 md:mb-0">Featured Courses</h2>
            </div>
            
            {isLoading ? (
              <div className="course-grid">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg overflow-hidden shadow-sm border border-border-color p-5 h-96 animate-pulse">
                    <div className="h-48 w-full bg-gray-200 rounded mb-4"></div>
                    <div className="h-4 w-1/3 bg-gray-200 rounded mb-4"></div>
                    <div className="h-6 w-3/4 bg-gray-200 rounded mb-3"></div>
                    <div className="h-4 w-full bg-gray-200 rounded mb-4"></div>
                    <div className="h-4 w-full bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="course-grid">
                {featuredCourses.map((course: any) => (
                  <CourseCard 
                    key={course.id}
                    id={course.id}
                    title={course.title}
                    description={course.description}
                    imageUrl={course.imageUrl}
                    language={course.language?.name || "Language"}
                    level={course.level.charAt(0).toUpperCase() + course.level.slice(1)}
                    rating={course.ratings?.average || 0}
                    reviewCount={course.ratings?.count || 0}
                    duration={course.duration}
                    instructor={{
                      name: course.instructor?.fullName || "Instructor",
                      avatar: course.instructor?.avatar || `https://api.dicebear.com/6.x/avataaars/svg?seed=${course.id}`
                    }}
                    price={parseFloat(course.price)}
                    isBestseller={course.bestSeller}
                    isNew={course.isNew}
                  />
                ))}
              </div>
            )}
            
            <div className="mt-12 text-center">
              <Button variant="outline" asChild className="inline-flex items-center justify-center border-primary text-primary hover:bg-primary hover:text-white">
                <Link href="/courses">
                  View All Courses
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Education Features Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center mb-12">
              <h2 className="text-3xl font-bold text-text-primary mb-4">Why Choose EduSuccess?</h2>
              <p className="text-lg text-text-secondary">Our innovative approach to K-12 education combines expert instruction with engaging, interactive technology.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <EducationFeature
                icon="video"
                title="Engaging Video Lessons"
                description="Learn from expert educators through high-quality, age-appropriate video content"
              />
              <EducationFeature
                icon="interactive"
                title="Interactive Learning"
                description="Build knowledge through hands-on activities and interactive exercises"
              />
              <EducationFeature
                icon="chart"
                title="Progress Tracking"
                description="Monitor learning progress with detailed tracking and assessments"
              />
              <EducationFeature
                icon="expert"
                title="Certified Educators"
                description="Learn from certified teachers with expertise in K-12 education"
              />
            </div>
          </div>
        </section>

        {/* Course Detail Preview */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold text-text-primary mb-4">Comprehensive Course Structure</h2>
                <p className="text-lg text-text-secondary mb-6">Our courses are designed by education experts to provide a structured path to academic success.</p>
                
                <div className="space-y-4 mb-8">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-6 h-6 bg-primary-light rounded-full flex items-center justify-center text-white font-medium">1</div>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-semibold text-text-primary">Fundamentals</h3>
                      <p className="text-text-secondary">Master the core concepts and essential building blocks</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-6 h-6 bg-primary-light rounded-full flex items-center justify-center text-white font-medium">2</div>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-semibold text-text-primary">Practical Application</h3>
                      <p className="text-text-secondary">Apply your knowledge with real-world examples and interactive exercises</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-6 h-6 bg-primary-light rounded-full flex items-center justify-center text-white font-medium">3</div>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-semibold text-text-primary">Critical Thinking</h3>
                      <p className="text-text-secondary">Develop problem-solving abilities and analyze complex concepts</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-6 h-6 bg-primary-light rounded-full flex items-center justify-center text-white font-medium">4</div>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-semibold text-text-primary">Mastery</h3>
                      <p className="text-text-secondary">Achieve comprehensive understanding and demonstrate expertise in the subject</p>
                    </div>
                  </div>
                </div>
                
                <Button asChild>
                  <Link href="/courses">Explore Course Curriculum</Link>
                </Button>
              </div>
              
              <div className="relative">
                <div className="bg-white rounded-xl overflow-hidden shadow-lg border border-border-color">
                  <div className="relative">
                    <img 
                      src="https://images.unsplash.com/photo-1613896640137-bb5a118c1c3c?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" 
                      alt="Course Preview" 
                      className="w-full h-64 object-cover"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                      <button className="w-16 h-16 bg-white bg-opacity-90 rounded-full flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-text-primary mb-2">Algebra 1: Complete Course</h3>
                    <p className="text-text-secondary mb-4">Master algebra fundamentals with engaging lessons, interactive exercises, and step-by-step problem solving.</p>
                    
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-text-secondary">42 video lessons</span>
                      </div>
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-text-secondary">Downloadable materials</span>
                      </div>
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-text-secondary">Certification upon completion</span>
                      </div>
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-text-secondary">24/7 tutor support</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-3xl font-bold text-primary">$129.99</span>
                        <span className="text-text-secondary line-through ml-2">$199.99</span>
                      </div>
                      <span className="badge-primary">35% OFF</span>
                    </div>
                  </div>
                </div>
                
                <div className="absolute -bottom-6 -right-6 bg-primary-light text-white p-4 rounded-lg shadow-lg hidden md:block">
                  <div className="flex items-center">
                    <div className="mr-3">
                      <div className="text-2xl font-bold">4.8</div>
                      <div className="flex">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </div>
                    </div>
                    <div>
                      <div className="font-medium">Highly Rated</div>
                      <div className="text-sm">256 reviews</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center mb-12">
              <h2 className="text-3xl font-bold text-text-primary mb-4">What Our Students Say</h2>
              <p className="text-lg text-text-secondary">Hear from K-12 students who have improved their grades and understanding with our courses.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <TestimonialCard 
                  key={index}
                  content={testimonial.content}
                  author={testimonial.author}
                  role={testimonial.role}
                  avatar={testimonial.avatar}
                />
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-primary-dark text-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-4">Start Your Educational Journey Today</h2>
              <p className="text-lg opacity-90 mb-8">Join thousands of successful students and achieve your academic goals with our proven methodology.</p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Button variant="secondary" size="lg" asChild>
                  <Link href="/auth?mode=register">
                    Get Started
                  </Link>
                </Button>
                <Button variant="outline" size="lg" className="bg-transparent border border-white text-white hover:bg-white hover:bg-opacity-10" asChild>
                  <Link href="/courses">
                    View All Courses
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
