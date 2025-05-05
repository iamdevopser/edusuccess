import { useEffect, useState } from 'react';
import { useLocation, useParams, Link } from 'wouter';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ShieldAlert, Info, CreditCard } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import MainNav from '@/components/ui/main-nav';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PayPalButton from '@/components/ui/paypal-button';
import { motion, AnimatePresence } from 'framer-motion';
import { LoadingTransition } from '@/components/ui/loading-transition';

// Make sure to call loadStripe outside of a component's render to avoid recreating the Stripe object on every render
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

// Checkout form component that displays the payment element
const CheckoutForm = ({ courseId }: { courseId: number }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js hasn't yet loaded.
      return;
    }

    setIsLoading(true);

    const { error } = await stripe.confirmPayment({
      // `Elements` instance that was used to create the Payment Element
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/enrollment-success`,
      },
    });

    if (error) {
      // This point will only be reached if there is an immediate error when
      // confirming the payment. Show error to your customer.
      setIsLoading(false);
      toast({
        title: "Payment Failed",
        description: error.message || "An error occurred during payment processing.",
        variant: "destructive",
      });
    } else {
      // Your customer will be redirected to your return_url.
      // For some payment methods like iDEAL, your customer will be redirected to an intermediate
      // site first to authorize the payment, then redirected to the return_url.
      setIsLoading(false);
      toast({
        title: "Processing Payment",
        description: "You are being redirected to complete the payment.",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <Button 
        type="submit" 
        disabled={!stripe || isLoading} 
        className="w-full"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing
          </>
        ) : (
          "Complete Purchase"
        )}
      </Button>
    </form>
  );
};

// Main checkout page component
export default function Checkout() {
  const params = useParams();
  const [clientSecret, setClientSecret] = useState("");
  const [course, setCourse] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  // Get the course ID from the URL parameters
  const courseId = params.courseId ? parseInt(params.courseId) : null;

  useEffect(() => {
    // Redirect if no course ID is provided
    if (!courseId) {
      toast({
        title: "Error",
        description: "No course selected for purchase.",
        variant: "destructive",
      });
      setLocation("/courses");
      return;
    }

    // Fetch course details
    const fetchCourse = async () => {
      try {
        const response = await apiRequest("GET", `/api/courses/${courseId}`);
        if (!response.ok) {
          throw new Error("Failed to load course details");
        }
        const data = await response.json();
        setCourse(data);
      } catch (error) {
        console.error("Error fetching course:", error);
        setError("Failed to load course details. Please try again.");
        toast({
          title: "Error",
          description: "Failed to load course details. Please try again.",
          variant: "destructive",
        });
      }
    };

    // Create a PaymentIntent as soon as the page loads
    const createPaymentIntent = async () => {
      try {
        setIsLoading(true);
        const response = await apiRequest("POST", "/api/create-payment-intent", { courseId });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error?.message || "Failed to initialize payment");
        }
        
        const data = await response.json();
        setClientSecret(data.clientSecret);
      } catch (error: any) {
        console.error("Error creating payment intent:", error);
        setError(error.message || "Failed to initialize payment. Please try again.");
        toast({
          title: "Payment Error",
          description: error.message || "Failed to initialize payment. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourse();
    createPaymentIntent();
  }, [courseId, toast, setLocation]);

  const appearance: {
    theme: 'stripe' | 'flat' | 'night';
    variables: {
      colorPrimary: string;
    };
  } = {
    theme: 'stripe',
    variables: {
      colorPrimary: '#6366F1',
    },
  };

  // Options for the Stripe Elements instance
  const options = {
    clientSecret,
    appearance,
  };

  if (error) {
    return (
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="flex justify-center items-center min-h-screen"
      >
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-500">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center">{error}</p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button onClick={() => setLocation("/courses")}>
              Return to Courses
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <MainNav />
      
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="container py-12 max-w-4xl mx-auto flex-grow"
      >
        <h1 className="text-3xl font-bold mb-8 text-center">Complete Your Purchase</h1>
        
        <LoadingTransition 
          isLoading={isLoading} 
          loadingText="Preparing your checkout..."
          className="relative min-h-[500px]"
        >
          {course && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="grid md:grid-cols-5 gap-8 mb-8"
            >
              <div className="md:col-span-3">
                <Card>
                  <CardHeader>
                    <CardTitle>Payment Details</CardTitle>
                    <CardDescription>
                      Complete your payment to get immediate access to this course
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {!user && (
                      <motion.div 
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.3 }}
                        className="bg-amber-50 border border-amber-200 rounded-md p-4 mb-6"
                      >
                        <div className="flex items-start">
                          <Info className="w-5 h-5 text-amber-500 mt-0.5 mr-2" />
                          <div>
                            <p className="text-amber-800 font-medium mb-1">Purchasing as a guest</p>
                            <p className="text-amber-700 text-sm">
                              You're not signed in. You can still complete this purchase, but to access your course later, 
                              you'll need to <Link href="/auth" className="text-primary underline">create an account</Link> and claim this purchase.
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                    
                    <Tabs defaultValue="card" className="w-full">
                      <TabsList className="grid w-full grid-cols-2 mb-6">
                        <TabsTrigger value="card" className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4" />
                          <span>Credit Card</span>
                        </TabsTrigger>
                        <TabsTrigger value="paypal" className="flex items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17.28 8.32c.34 1.52-.54 3.25-2.15 4.34-1.62 1.1-2.84 1.5-5.5 1.5h-1.8l-1.14 6.5c-.04.18-.21.34-.41.34H3.26c-.22 0-.38-.2-.36-.42l.01-.05L5.64 3.5c.1-.48.54-.83 1.04-.83h7.76c1.96 0 2.5 1.14 2.84 2.65z" />
                            <path d="M20.66 3.55c.74 1.55.37 3.29-.96 4.86-1.42 1.68-3.33 2.59-6.15 2.59h-1.97L10.5 17.5c-.04.18-.21.34-.41.34H7.01c-.22 0-.38-.2-.36-.42l.01-.05L9.41 3.84c.1-.48.54-.84 1.04-.84h7.27c1.92 0 2.5 1 2.94 2.55z" />
                          </svg>
                          <span>PayPal</span>
                        </TabsTrigger>
                      </TabsList>
                      
                      <AnimatePresence mode="wait">
                        <TabsContent value="card" className="mt-0">
                          {clientSecret && (
                            <motion.div
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -5 }}
                              transition={{ duration: 0.3 }}
                            >
                              <Elements stripe={stripePromise} options={options}>
                                <CheckoutForm courseId={courseId!} />
                              </Elements>
                            </motion.div>
                          )}
                        </TabsContent>
                        
                        <TabsContent value="paypal" className="mt-0">
                          {course && (
                            <motion.div
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -5 }}
                              transition={{ duration: 0.3 }}
                              className="space-y-6"
                            >
                              <PayPalButton 
                                amount={typeof course.price === 'number' 
                                  ? course.price.toString()
                                  : parseFloat(course.price?.toString() || '0').toString()}
                                currency="USD"
                                intent="CAPTURE"
                                onSuccess={() => {
                                  toast({
                                    title: "Payment Successful",
                                    description: "Your PayPal payment was processed successfully.",
                                  });
                                  setLocation("/enrollment-success");
                                }}
                                onError={(error) => {
                                  toast({
                                    title: "Payment Failed",
                                    description: "There was an error processing your PayPal payment.",
                                    variant: "destructive",
                                  });
                                  console.error("PayPal error:", error);
                                }}
                              />
                            </motion.div>
                          )}
                        </TabsContent>
                      </AnimatePresence>
                    </Tabs>
                  </CardContent>
                </Card>
              </div>
              
              <div className="md:col-span-2">
                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle>Order Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-4">
                        {course.imageUrl && (
                          <div className="w-24 h-20 rounded overflow-hidden">
                            <img 
                              src={course.imageUrl} 
                              alt={course.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div>
                          <h3 className="font-semibold">{course.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            by {course.instructor?.fullName || 'Unknown Instructor'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="border-t pt-4 mt-4">
                        <div className="flex justify-between text-sm">
                          <span>Original Price:</span>
                          <span>${typeof course.price === 'number' 
                            ? course.price.toFixed(2) 
                            : parseFloat(course.price?.toString() || '0').toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-lg mt-2">
                          <span>Total:</span>
                          <span>${typeof course.price === 'number' 
                            ? course.price.toFixed(2) 
                            : parseFloat(course.price?.toString() || '0').toFixed(2)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            </motion.div>
          )}
        </LoadingTransition>
      </motion.div>
    </div>
  );
}