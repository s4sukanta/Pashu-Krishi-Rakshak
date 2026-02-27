"use client";

import { useState } from "react";
import { UploadCloud, Loader2, Sparkles, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [language, setLanguage] = useState<string>("english");
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      setResult(null); // Clear previous result
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Please select an image first.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("image", file);
    formData.append("language", language);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong.");
      }

      setResult(data.result);
    } catch (err: any) {
      setError(err.message || "Failed to analyze the image.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50/50 flex flex-col items-center justify-center p-4 sm:p-8">
      <div className="max-w-4xl w-full mx-auto space-y-8">

        {/* Header Section */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center p-3 bg-blue-100 rounded-full mb-4">
            <Sparkles className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900">
            Image Analysis with AWS Bedrock
          </h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            Upload an image and let Amazon Nova Pro analyze it. Powered by Next.js, shadcn/ui, and AWS.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Upload Form Card */}
          <Card className="shadow-lg border-0 ring-1 ring-gray-200">
            <CardHeader>
              <CardTitle>Input</CardTitle>
              <CardDescription>Upload a photo of the animal to get an instant diagnosis and treatment plan.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">

                {/* File Upload Area */}
                <div className="space-y-3">
                  <Label htmlFor="image">Upload Image</Label>
                  <div className="relative border-2 border-dashed border-gray-300 rounded-xl p-8 hover:bg-gray-50 transition-colors duration-200 flex flex-col items-center justify-center text-center cursor-pointer overflow-hidden group">
                    <input
                      id="image"
                      type="file"
                      accept="image/jpeg, image/png, image/webp"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      onChange={handleFileChange}
                    />

                    {previewUrl ? (
                      <div className="absolute inset-0 w-full h-full p-2 z-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={previewUrl}
                          alt="Preview"
                          className="w-full h-full object-contain rounded-lg shadow-sm"
                        />
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center z-0">
                        <UploadCloud className="w-10 h-10 text-gray-400 mb-3 group-hover:text-blue-500 transition-colors" />
                        <span className="text-sm font-medium text-gray-700">Click to upload or drag and drop</span>
                        <span className="text-xs text-gray-500 mt-1">SVG, PNG, JPG or WEBP (max. 5MB)</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Language Selection */}
                <div className="space-y-3">
                  <Label htmlFor="language">Output Language</Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger id="language" className="w-full">
                      <SelectValue placeholder="Select a language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="english">English</SelectItem>
                      <SelectItem value="hindi">Hindi (हिंदी)</SelectItem>
                      <SelectItem value="bengali">Bengali (বাংলা)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 text-md font-medium"
                  disabled={!file || loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Analyzing Image...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-5 w-5" />
                      Get Veterinary Diagnosis
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Results Card */}
          <Card className="shadow-lg border-0 ring-1 ring-gray-200 bg-white flex flex-col h-full">
            <CardHeader>
              <CardTitle>Analysis Result</CardTitle>
              <CardDescription>The AI's response will appear here.</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col">

              {error && (
                <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200">
                  <p className="font-semibold">Error</p>
                  <p>{error}</p>
                </div>
              )}

              {loading && !result && !error && (
                <div className="flex-grow flex flex-col items-center justify-center text-gray-400 space-y-4 min-h-[200px]">
                  <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
                  <p className="text-sm font-medium animate-pulse">Processing through AWS Bedrock...</p>
                </div>
              )}

              {!loading && !result && !error && (
                <div className="flex-grow flex flex-col items-center justify-center text-gray-400 space-y-3 min-h-[200px]">
                  <ImageIcon className="w-12 h-12 opacity-20" />
                  <p className="text-sm">Upload an image to get started</p>
                </div>
              )}

              {result && !loading && (
                <div className="p-5 bg-gray-50 rounded-lg border border-gray-100 flex-grow text-gray-800 text-sm leading-relaxed overflow-y-auto max-h-[400px] prose prose-sm max-w-none prose-blue">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {result}
                  </ReactMarkdown>
                </div>
              )}

            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
