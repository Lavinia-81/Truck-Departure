"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth, useUser } from "@/firebase";
import { sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink } from "firebase/auth";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Loader2, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
});

type LoginFormValues = z.infer<typeof formSchema>;

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isLinkSent, setIsLinkSent] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    // Redirect if user is already logged in
    if (user && !isUserLoading) {
      router.push("/");
      return;
    }

    // Handle sign-in from magic link
    if (isSignInWithEmailLink(auth, window.location.href)) {
      let email = window.localStorage.getItem('emailForSignIn');
      if (!email) {
        // User opened the link on a different device. To prevent session fixation
        // attacks, ask the user to provide the email again.
        email = window.prompt('Please provide your email for confirmation');
      }
      if (email) {
        signInWithEmailLink(auth, email, window.location.href)
          .then(() => {
            window.localStorage.removeItem('emailForSignIn');
            router.push("/");
          })
          .catch((error) => {
            console.error("Magic link sign-in error:", error);
            toast({
              variant: "destructive",
              title: "Sign-in Failed",
              description: "The sign-in link is invalid or has expired. Please try again.",
            });
            setIsVerifying(false);
          });
      } else {
        setIsVerifying(false);
         toast({
            variant: "destructive",
            title: "Sign-in Failed",
            description: "Email is required to complete sign-in.",
        });
      }
    } else {
        setIsVerifying(false);
    }
  }, [auth, router, toast, user, isUserLoading]);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(data: LoginFormValues) {
    setIsLoading(true);
    const actionCodeSettings = {
      url: window.location.origin,
      handleCodeInApp: true,
    };

    try {
      await sendSignInLinkToEmail(auth, data.email, actionCodeSettings);
      window.localStorage.setItem('emailForSignIn', data.email);
      setIsLinkSent(true);
      toast({
        title: "Check your email",
        description: `A sign-in link has been sent to ${data.email}.`,
      });
    } catch (error) {
      console.error("Error sending sign-in link:", error);
      toast({
        variant: "destructive",
        title: "Something went wrong",
        description: "Could not send sign-in link. Please try again later.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  if (isVerifying || isUserLoading) {
      return (
          <div className="flex min-h-screen flex-col items-center justify-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="mt-4 text-muted-foreground">Verifying authentication...</p>
          </div>
      )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{isLinkSent ? "Check Your Inbox" : "Sign In"}</CardTitle>
          <CardDescription>
            {isLinkSent
              ? "We've sent a magic link to your email address. Click the link to sign in."
              : "Enter your email below to receive a sign-in link."}
          </CardDescription>
        </CardHeader>
        {!isLinkSent && (
            <CardContent>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                        <Input type="email" placeholder="you@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <Button type="submit" disabled={isLoading} className="w-full">
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
                    Send Magic Link
                </Button>
                </form>
            </Form>
            </CardContent>
        )}
      </Card>
    </div>
  );
}
