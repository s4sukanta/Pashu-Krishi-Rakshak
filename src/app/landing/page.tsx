"use client";

import { useRouter } from "next/navigation";
import { Camera, Heart, Languages, Stethoscope, CheckCircle2, Globe, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background">
      {/* Hero Section */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between max-w-6xl">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
              <Stethoscope className="w-7 h-7 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Pashu Krishi Rakshak</h1>
              <p className="text-sm text-muted-foreground">पशु कृषि रक्षक • পশু কৃষি রক্ষক</p>
            </div>
          </div>
          <Button onClick={() => router.push("/login")} size="lg">
            Sign In
          </Button>
        </div>
      </header>

      {/* Hero Content */}
      <section className="container mx-auto px-4 py-16 max-w-6xl">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            AI-Powered Veterinary Care
            <br />
            <span className="text-primary">For Rural India</span>
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Instant diagnosis for your livestock and crops using advanced AI technology.
            Available in Hindi, English, and Bengali.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={() => router.push("/login")} size="lg" className="h-14 text-lg px-8">
              <Stethoscope className="w-5 h-5 mr-2" />
              Get Started Free
            </Button>
            <Button onClick={() => router.push("/login")} variant="outline" size="lg" className="h-14 text-lg px-8">
              Sign In
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <Card className="border-2 border-border hover:border-primary transition-colors">
            <CardContent className="pt-6">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Camera className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Instant Diagnosis</h3>
              <p className="text-muted-foreground">
                Upload a photo of your animal or crop and get immediate AI-powered diagnosis with treatment recommendations.
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-border hover:border-primary transition-colors">
            <CardContent className="pt-6">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Languages className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Multilingual Support</h3>
              <p className="text-muted-foreground">
                Get diagnosis and prescriptions in Hindi (हिंदी), English, or Bengali (বাংলা) - whatever you're comfortable with.
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-border hover:border-primary transition-colors">
            <CardContent className="pt-6">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Heart className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Track Progress</h3>
              <p className="text-muted-foreground">
                Keep records of all your animals, track their health over time, and monitor treatment effectiveness.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Benefits Section */}
        <div className="bg-card border-2 border-border rounded-2xl p-8 mb-16">
          <h3 className="text-2xl font-bold text-center mb-8">Why Farmers Trust Us</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex items-start gap-4">
              <CheckCircle2 className="w-6 h-6 text-primary shrink-0 mt-1" />
              <div>
                <h4 className="font-semibold mb-1">Expert AI Technology</h4>
                <p className="text-muted-foreground">Powered by AWS Bedrock's Amazon Nova Pro model for accurate diagnoses</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <CheckCircle2 className="w-6 h-6 text-primary shrink-0 mt-1" />
              <div>
                <h4 className="font-semibold mb-1">24/7 Availability</h4>
                <p className="text-muted-foreground">Get help anytime, anywhere - no need to wait for vet appointments</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <CheckCircle2 className="w-6 h-6 text-primary shrink-0 mt-1" />
              <div>
                <h4 className="font-semibold mb-1">Affordable Care</h4>
                <p className="text-muted-foreground">Free to use - save money on unnecessary vet visits</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <CheckCircle2 className="w-6 h-6 text-primary shrink-0 mt-1" />
              <div>
                <h4 className="font-semibold mb-1">Secure & Private</h4>
                <p className="text-muted-foreground">Your data is encrypted and protected with AWS security</p>
              </div>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="text-center mb-16">
          <h3 className="text-2xl font-bold mb-8">How It Works</h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h4 className="font-semibold mb-2">Take a Photo</h4>
              <p className="text-muted-foreground">Capture a clear image of your animal or crop showing the problem area</p>
            </div>
            <div>
              <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h4 className="font-semibold mb-2">Get AI Diagnosis</h4>
              <p className="text-muted-foreground">Our AI analyzes the image and provides instant diagnosis with confidence score</p>
            </div>
            <div>
              <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h4 className="font-semibold mb-2">Follow Treatment</h4>
              <p className="text-muted-foreground">Receive detailed prescription with medicine names, dosages, and care instructions</p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-primary text-primary-foreground rounded-2xl p-8 md:p-12 text-center">
          <h3 className="text-3xl font-bold mb-4">Ready to Get Started?</h3>
          <p className="text-lg mb-6 opacity-90">
            Join thousands of farmers who trust Pashu Krishi Rakshak for their livestock and crop health needs.
          </p>
          <Button 
            onClick={() => router.push("/login")} 
            size="lg" 
            variant="secondary"
            className="h-14 text-lg px-8"
          >
            Create Free Account
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/50 py-8">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Stethoscope className="w-6 h-6 text-primary" />
                <span className="font-semibold">Pashu Krishi Rakshak</span>
              </div>
              <p className="text-sm text-muted-foreground">
                AI-powered veterinary care for rural India. Empowering farmers with instant diagnosis and treatment.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Features</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Instant AI Diagnosis</li>
                <li>Multilingual Support</li>
                <li>Health Tracking</li>
                <li>Treatment History</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Available 24/7
                </li>
                <li className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Secure & Private
                </li>
                <li>Animal Helpline: 1800-180-1551</li>
              </ul>
            </div>
          </div>
          <div className="text-center text-sm text-muted-foreground border-t pt-8">
            <p>© 2024 Pashu Krishi Rakshak. Powered by AWS Bedrock.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
