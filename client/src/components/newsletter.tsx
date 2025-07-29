import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const { toast } = useToast();

  const subscribeMutation = useMutation({
    mutationFn: async (email: string) => {
      return apiRequest("POST", "/api/newsletter/subscribe", { email });
    },
    onSuccess: () => {
      toast({
        title: "Successfully subscribed!",
        description: "You'll receive updates about the best indie shows in SF.",
      });
      setEmail("");
    },
    onError: (error) => {
      toast({
        title: "Subscription failed",
        description: "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      subscribeMutation.mutate(email);
    }
  };

  return (
    <section className="gradient-newsletter py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h3 className="text-3xl font-bold mb-4 text-white">Never Miss a Show</h3>
        <p className="text-lg text-muted-text mb-8">
          Get personalized recommendations and early access to tickets for your favorite indie artists.
        </p>
        
        <form onSubmit={handleSubmit} className="max-w-md mx-auto">
          <div className="flex gap-3">
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-card-bg border-gray-600 text-white flex-1"
              required
            />
            <Button
              type="submit"
              disabled={subscribeMutation.isPending}
              className="bg-spotify-green hover:bg-green-600 text-black font-semibold whitespace-nowrap"
            >
              {subscribeMutation.isPending ? "Subscribing..." : "Subscribe"}
            </Button>
          </div>
          <p className="text-xs text-muted-text mt-4">
            Join thousands of music lovers discovering the best indie shows in SF
          </p>
        </form>
      </div>
    </section>
  );
}
