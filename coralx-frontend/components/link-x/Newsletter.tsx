import { useState } from "react";
import { cn } from "@/lib/utils";
import { CheckIcon, MailIcon } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

const Newsletter = () => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      setEmail("");
      
      toast({
        title: "Success!",
        description: "You've been subscribed to our newsletter.",
        duration: 5000,
      });
      
      // Reset success state after some time
      setTimeout(() => setIsSuccess(false), 3000);
    }, 1500);
  };

  return (
    <section 
      id="contact" 
      className="section-padding bg-gradient-to-b from-secondary/50 to-transparent"
    >
      <div className="container max-w-6xl mx-auto">
        <div className="relative overflow-hidden rounded-3xl bg-primary shadow-xl">
          {/* Background decoration */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -right-40 -top-40 w-80 h-80 rounded-full bg-white/10 blur-md" />
            <div className="absolute -left-20 -bottom-20 w-60 h-60 rounded-full bg-white/10 blur-md" />
          </div>
          
          <div className="relative p-8 md:p-16 text-center">
            <div className="max-w-3xl mx-auto">
              <h2 className="heading-md md:heading-lg text-white mb-6">
                Stay Ahead with Our Latest Insights
              </h2>
              <p className="text-white/80 text-lg mb-8 max-w-2xl mx-auto">
                Subscribe to our newsletter and receive expert analysis, industry trends, and exclusive content delivered directly to your inbox.
              </p>
              
              <form 
                onSubmit={handleSubmit} 
                className="max-w-lg mx-auto"
              >
                <div className="relative">
                  <div className="flex items-center rounded-full bg-white/10 p-1.5 backdrop-blur-sm hover:bg-white/20 transition-colors">
                    <div className="flex-shrink-0 pl-4">
                      <MailIcon className="h-5 w-5 text-white" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email address"
                      className="w-full bg-transparent px-4 py-3 text-white placeholder-white/60 outline-none"
                      required
                    />
                    <button
                      type="submit"
                      disabled={isSubmitting || isSuccess}
                      className={cn(
                        "px-6 py-3 rounded-full font-medium transition-all duration-300 text-primary flex items-center gap-2",
                        isSubmitting ? "bg-white/80" : isSuccess ? "bg-green-400" : "bg-white hover:scale-[1.03] active:scale-[0.97]"
                      )}
                    >
                      {isSubmitting ? (
                        <span>Subscribing...</span>
                      ) : isSuccess ? (
                        <>
                          <CheckIcon className="h-4 w-4" />
                          <span>Subscribed</span>
                        </>
                      ) : (
                        <span>Subscribe</span>
                      )}
                    </button>
                  </div>
                </div>
                <p className="text-white/60 text-sm mt-3">
                  We respect your privacy. Unsubscribe at any time.
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Newsletter;
