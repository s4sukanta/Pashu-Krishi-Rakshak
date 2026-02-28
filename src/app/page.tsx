"use client";

import { useRef, useState, useEffect } from "react";
import { UploadCloud, Loader2, Sparkles, Image as ImageIcon, Camera, Trash2, Video, RefreshCw, Clock, History, Calendar, ChevronRight, Activity, HardDrive, Database, Copy, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export interface DiagnosisRecord {
  id: string;
  timestamp: string;
  diagnosis: string;
  language: string;
}

export interface UsageLog {
  id: string;
  timestamp: string;
  modelUsed: string;
  inputMediaSizeBytes: number;
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [language, setLanguage] = useState<string>("english");
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [symptoms, setSymptoms] = useState<string>("");
  const [previousDiagnosis, setPreviousDiagnosis] = useState<DiagnosisRecord | null>(null);
  const [history, setHistory] = useState<DiagnosisRecord[]>([]);
  const [usageLogs, setUsageLogs] = useState<UsageLog[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [userId, setUserId] = useState<string>("");
  const [inputUserId, setInputUserId] = useState<string>("");

  const fetchRemoteData = async (uid: string) => {
    try {
      const res = await fetch(`/api/history?userId=${uid}`);
      if (res.ok) {
        const data = await res.json();
        setHistory(data.history || []);
        setUsageLogs(data.usageLogs || []);
      }
    } catch (e) {
      console.error("Failed to fetch remote history", e);
    }
  };

  // Load user Id and fetch History & Logs on mount
  useEffect(() => {
    let currentUserId = localStorage.getItem("pashu_krishi_user_id");
    if (!currentUserId) {
      currentUserId = crypto.randomUUID();
      localStorage.setItem("pashu_krishi_user_id", currentUserId);
    }
    setUserId(currentUserId);
    setInputUserId(currentUserId);
    fetchRemoteData(currentUserId);
  }, []);

  const handleSaveUserId = () => {
    if (inputUserId.trim() && inputUserId !== userId) {
      setUserId(inputUserId.trim());
      localStorage.setItem("pashu_krishi_user_id", inputUserId.trim());
      // Re-fetch data for the new user ID
      fetchRemoteData(inputUserId.trim());
    }
  };

  const saveToHistory = async (newResult: string, lang: string, existingRecordId?: string) => {
    let updatedHistory = [...history];

    if (existingRecordId) {
      updatedHistory = updatedHistory.map(record => {
        if (record.id === existingRecordId) {
          return {
            ...record,
            timestamp: new Date().toISOString(),
            diagnosis: record.diagnosis + "\n\n*** FOLLOW UP RECORD: ***\n\n" + newResult
          };
        }
        return record;
      });
    } else {
      const newRecord: DiagnosisRecord = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        diagnosis: newResult,
        language: lang
      };
      updatedHistory = [newRecord, ...updatedHistory];
    }

    setHistory(updatedHistory);
    // Note: The actual DDB saving happens server-side in /api/analyze now
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      setResult(null); // Clear previous result
      setError(null);
      setError(null);
    }
  };

  const extractFrames = async (videoFile: File, numFrames: number = 4): Promise<Blob[]> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      const url = URL.createObjectURL(videoFile);
      video.src = url;
      video.muted = true;
      video.playsInline = true;

      video.addEventListener('loadedmetadata', async () => {
        const duration = video.duration || 5;
        const blobs: Blob[] = [];

        const captureFrameAtTime = (time: number): Promise<Blob | null> => {
          return new Promise((resolveFrame) => {
            const onSeeked = () => {
              const canvas = document.createElement('canvas');
              // Scale down slightly if video is huge to save Bedrock payload size and processing time
              const scale = Math.min(1, 1280 / Math.max(video.videoWidth, 1));
              canvas.width = (video.videoWidth || 640) * scale;
              canvas.height = (video.videoHeight || 480) * scale;
              const ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                canvas.toBlob((blob) => resolveFrame(blob), "image/jpeg", 0.90);
              } else {
                resolveFrame(null);
              }
              video.removeEventListener('seeked', onSeeked);
            };
            video.addEventListener('seeked', onSeeked);
            video.currentTime = time;
          });
        };

        for (let i = 1; i <= numFrames; i++) {
          const time = (duration / (numFrames + 1)) * i;
          const frameBlob = await captureFrameAtTime(time);
          if (frameBlob) blobs.push(frameBlob);
        }
        URL.revokeObjectURL(url);
        resolve(blobs);
      });
      video.addEventListener('error', () => resolve([]));
    });
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
    formData.append("language", language);
    formData.append("userId", userId);

    if (symptoms.trim()) {
      formData.append("symptoms", symptoms.trim());
    }
    if (previousDiagnosis) {
      formData.append("previousDiagnosis", previousDiagnosis.diagnosis);
    }

    if (file.type.startsWith('video/')) {
      // Automatically extract 4 high-quality frames spread evenly throughout the video
      const frames = await extractFrames(file, 4);
      if (frames.length > 0) {
        frames.forEach((blob, index) => {
          formData.append("media", blob, `frame_${index}.jpg`);
        });
      } else {
        // Fallback: send raw video if extraction failed
        formData.append("media", file);
      }
    } else {
      formData.append("media", file);
    }

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
      // Update local state optimistic UI
      saveToHistory(data.result, language, previousDiagnosis?.id);

      const newLog: UsageLog = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        modelUsed: data.modelUsed || "amazon.nova-pro-v1:0",
        inputMediaSizeBytes: file.size,
      };
      setUsageLogs([newLog, ...usageLogs]);

      // If we were following up, clear the active follow-up state since the new result is generated
      if (previousDiagnosis) {
        setPreviousDiagnosis(null);
      }

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
        <div className="text-center space-y-4 relative">

          <div className="absolute right-0 top-0 flex items-center gap-2">

            {/* Device Sync Key Sheet */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="shadow-sm border-gray-200">
                  <Database className="w-4 h-4 text-purple-600" />
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-md">
                <SheetHeader className="mb-6">
                  <SheetTitle className="flex items-center gap-2">
                    <Database className="w-5 h-5 text-purple-600" />
                    Device Sync Key
                  </SheetTitle>
                  <SheetDescription>
                    Your history is saved to AWS under a unique Device Sync Key. You can use this key on other devices to access your animal records.
                  </SheetDescription>
                </SheetHeader>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="current-key">Your Current Key</Label>
                    <div className="flex gap-2">
                      <Input
                        id="current-key"
                        value={inputUserId}
                        onChange={(e) => setInputUserId(e.target.value)}
                        className="font-mono text-sm bg-purple-50"
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        size="icon"
                        onClick={() => navigator.clipboard.writeText(userId)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl text-sm text-gray-600">
                    <p className="mb-3">To sync your history from another device, paste its Device Sync Key here and click Save.</p>
                    <Button
                      className="w-full"
                      onClick={handleSaveUserId}
                      disabled={inputUserId === userId || !inputUserId.trim()}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Apply Sync Key
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            {/* Usage Logs Sheet */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="shadow-sm border-gray-200">
                  <Activity className="w-4 h-4 text-emerald-600" />
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-md overflow-y-auto">
                <SheetHeader className="mb-6">
                  <SheetTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-emerald-600" />
                    Usage & Telemetry Logs
                  </SheetTitle>
                  <SheetDescription>
                    Device-local tracking of model invocations and data volume.
                  </SheetDescription>
                </SheetHeader>

                {usageLogs.length === 0 ? (
                  <div className="text-center text-gray-400 py-10">
                    <Activity className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>No usage data recorded yet.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Aggregated Stats */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl text-center">
                        <div className="text-2xl font-black text-emerald-700">{usageLogs.length}</div>
                        <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mt-1">Total Calls</div>
                      </div>
                      <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl text-center">
                        <div className="text-2xl font-black text-blue-700">
                          {(usageLogs.reduce((acc, log) => acc + log.inputMediaSizeBytes, 0) / 1024 / 1024).toFixed(2)}
                        </div>
                        <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider mt-1">Total MB Used</div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-sm font-bold text-gray-900 border-b pb-2">Itemized Invocations</h4>
                      {usageLogs.map((log) => (
                        <div key={log.id} className="p-3 border border-gray-100 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center text-[11px] text-gray-400 font-medium">
                              <Calendar className="w-3 h-3 mr-1" />
                              {new Date(log.timestamp).toLocaleString()}
                            </div>
                            <div className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
                              <Sparkles className="w-3 h-3 text-purple-500" />
                              {log.modelUsed}
                            </div>
                          </div>
                          <div className="flex items-center text-xs font-mono font-medium text-gray-600 bg-gray-50 px-2 py-1 rounded">
                            <HardDrive className="w-3 h-3 mr-1 text-gray-400" />
                            {(log.inputMediaSizeBytes / 1024).toFixed(1)} KB
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </SheetContent>
            </Sheet>

            {/* History Sheet */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="shadow-sm border-gray-200">
                  <History className="w-4 h-4 mr-2 text-gray-600" />
                  View History
                  {history.length > 0 && (
                    <span className="ml-2 bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">
                      {history.length}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-md overflow-y-auto">
                <SheetHeader className="mb-6">
                  <SheetTitle>Diagnosis History</SheetTitle>
                  <SheetDescription>
                    Your past inquiries are saved locally on this device.
                  </SheetDescription>
                </SheetHeader>

                {history.length === 0 ? (
                  <div className="text-center text-gray-400 py-10">
                    <History className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>No past diagnoses found.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {history.map((record) => (
                      <div key={record.id} className="p-4 border border-gray-100 rounded-xl bg-gray-50 hover:bg-white hover:shadow-md transition-all group">
                        <div className="flex items-center text-xs text-gray-500 mb-2">
                          <Calendar className="w-3 h-3 mr-1" />
                          {new Date(record.timestamp).toLocaleDateString()} at {new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          <span className="ml-auto uppercase text-[10px] font-bold tracking-wider text-gray-400 bg-gray-200 px-2 py-0.5 rounded-md">
                            {record.language}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-gray-800 line-clamp-3 mb-3">
                          {record.diagnosis.split('\n').find(line => line.length > 20) || "Diagnosis record"}
                        </p>
                        <SheetTrigger asChild>
                          <Button
                            variant="secondary"
                            size="sm"
                            className="w-full group-hover:bg-blue-50 group-hover:text-blue-700"
                            onClick={() => {
                              setPreviousDiagnosis(record);
                              setResult(null);
                              setFile(null);
                              setPreviewUrl(null);
                              setSymptoms("");
                              setError(null);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                          >
                            Follow Up on this Case
                            <ChevronRight className="w-4 h-4 ml-1 opacity-50" />
                          </Button>
                        </SheetTrigger>
                      </div>
                    ))}
                  </div>
                )}
              </SheetContent>
            </Sheet>
          </div>

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
          <div className="space-y-4">
            {previousDiagnosis && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3 shadow-sm">
                <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-blue-900">Follow-Up Mode Active</h3>
                  <p className="text-xs text-blue-700 mt-1">
                    Upload new photos or videos of the animal. The AI will compare the current state with its previous diagnosis to determine if the condition is improving or worsening.
                  </p>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="mt-3 w-full sm:w-auto shadow-sm"
                    onClick={() => setPreviousDiagnosis(null)}
                  >
                    Cancel Follow-Up
                  </Button>
                </div>
              </div>
            )}

            <Card className="shadow-lg border-0 ring-1 ring-gray-200">
              <CardHeader>
                <CardTitle>{previousDiagnosis ? "Follow-Up Media" : "Input"}</CardTitle>
                <CardDescription>
                  {previousDiagnosis
                    ? "Upload a new photo/video of the same animal to check its progress."
                    : "Upload a photo or video of the animal to get an instant diagnosis and treatment plan."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">

                  {/* File Upload Area */}
                  <div className="space-y-3">
                    <Label>Provide Media</Label>

                    {!previewUrl ? (
                      <div className="space-y-4">
                        {/* Mobile Only: Native Camera Intputs */}
                        <div className="grid grid-cols-2 gap-4 sm:hidden">
                          {/* Take Photo Button */}
                          <div className="relative border-2 border-blue-200 bg-blue-50/50 rounded-xl p-4 hover:bg-blue-100 transition-colors flex flex-col items-center justify-center text-center cursor-pointer h-32 group shadow-sm">
                            <input
                              type="file"
                              accept="image/*"
                              capture="environment"
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                              onChange={handleFileChange}
                            />
                            <Camera className="w-8 h-8 text-blue-600 mb-2 group-hover:scale-110 transition-transform duration-200" />
                            <span className="text-sm font-semibold text-blue-900">Take Photo</span>
                          </div>

                          {/* Record Video Button */}
                          <div className="relative border-2 border-blue-200 bg-blue-50/50 rounded-xl p-4 hover:bg-blue-100 transition-colors flex flex-col items-center justify-center text-center cursor-pointer h-32 group shadow-sm">
                            <input
                              type="file"
                              accept="video/*"
                              capture="environment"
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                              onChange={handleFileChange}
                            />
                            <Video className="w-8 h-8 text-blue-600 mb-2 group-hover:scale-110 transition-transform duration-200" />
                            <span className="text-sm font-semibold text-blue-900">Record Video</span>
                          </div>
                        </div>

                        {/* File Upload Button (Primary on desktop) */}
                        <div className="relative border-2 border-dashed border-gray-300 rounded-xl p-4 hover:bg-gray-50 transition-colors flex flex-col items-center justify-center text-center cursor-pointer h-28 sm:h-48 group">
                          <input
                            type="file"
                            accept="image/jpeg, image/png, image/webp, video/mp4, video/webm, video/quicktime"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            onChange={handleFileChange}
                          />
                          <UploadCloud className="w-8 h-8 text-gray-400 mb-2 group-hover:text-gray-600 transition-colors" />
                          <span className="text-sm font-medium text-gray-700">Upload from Gallery</span>
                        </div>
                      </div>
                    ) : (
                      <div className="relative border-2 border-gray-200 rounded-xl p-2 bg-black/5 overflow-hidden h-64 flex items-center justify-center group">
                        <div className="absolute inset-0 w-full h-full z-0 flex items-center justify-center p-2">
                          {file?.type.startsWith('video/') ? (
                            <video
                              src={previewUrl}
                              controls
                              className="max-w-full max-h-full object-contain rounded-lg shadow-sm"
                            />
                          ) : (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={previewUrl}
                              alt="Preview"
                              className="max-w-full max-h-full object-contain rounded-lg shadow-sm"
                            />
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            setFile(null);
                            setPreviewUrl(null);
                            setResult(null);
                          }}
                          className="absolute top-3 right-3 shadow-md z-20 opacity-90 hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Remove Media
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Optional Symptoms Input */}
                  <div className="space-y-3">
                    <Label htmlFor="symptoms">Symptoms or Context (Optional)</Label>
                    <Textarea
                      id="symptoms"
                      placeholder="e.g., The animal has been refusing to eat for 2 days and is lethargic..."
                      className="resize-none h-24"
                      value={symptoms}
                      onChange={(e) => setSymptoms(e.target.value)}
                    />
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
                        Analyzing Media...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-5 w-5" />
                        {previousDiagnosis ? "Evaluate Progress" : "Get Veterinary Diagnosis"}
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

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
                  <p className="text-sm">Upload an image or video to get started</p>
                </div>
              )}

              {result && !loading && (
                <div className="flex flex-col h-full">
                  <div className="p-5 bg-gray-50 rounded-lg border border-gray-100 flex-grow text-gray-800 text-sm leading-relaxed overflow-y-auto max-h-[400px] prose prose-sm max-w-none prose-blue mb-4">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {result}
                    </ReactMarkdown>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800"
                    onClick={() => {
                      // Retrieve the most recent history record we just saved
                      const latestRecord = history[0];
                      if (latestRecord) {
                        setPreviousDiagnosis(latestRecord);
                        setResult(null);
                        setFile(null);
                        setPreviewUrl(null);
                        setSymptoms("");
                        setError(null);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }
                    }}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Provide Follow-Up Media for this Diagnosis
                  </Button>
                </div>
              )}

            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
