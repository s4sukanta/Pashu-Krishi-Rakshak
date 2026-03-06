"use client";

import { useRef, useState, useEffect } from "react";
import { ArrowLeft, UploadCloud, Loader2, Sparkles, Image as ImageIcon, Camera, Trash2, Video, RefreshCw, Clock, History, Calendar, ChevronRight, Activity, HardDrive, Database, Copy, Save, CheckCircle2, AlertTriangle, AlertCircle, ChevronDown, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { CaseDashboard } from "@/components/CaseDashboard";
import { CaseTimeline } from "@/components/CaseTimeline";

function generateUUID() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export interface DiagnosisRecord {
  id: string;
  caseId?: string;
  timestamp: string;
  diagnosis: string;
  language: string;
  animalName?: string;
  thumbnailBase64?: string;
}

export interface Case {
  caseId: string;
  animalName: string;
  updatedAt: string;
  records: DiagnosisRecord[];
  subjectType: string;
  latestStatus: string;
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [parsedResult, setParsedResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [symptoms, setSymptoms] = useState<string>("");
  const [previousDiagnosis, setPreviousDiagnosis] = useState<DiagnosisRecord | null>(null);
  const [history, setHistory] = useState<DiagnosisRecord[]>([]);
  const [usageLogs, setUsageLogs] = useState<UsageLog[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [userId, setUserId] = useState<string>("");
  const [inputUserId, setInputUserId] = useState<string>("");

  // Case/Timeline UI States
  const [cases, setCases] = useState<Case[]>([]);
  const [activeCaseId, setActiveCaseId] = useState<string | null>(null);
  const [isCreatingNewCase, setIsCreatingNewCase] = useState<boolean>(false);

  // NEW History UI States
  const [animalName, setAnimalName] = useState<string>("");
  const [historyFilter, setHistoryFilter] = useState<string>("all");

  // NEW Expandable Details UI States
  const [isDetailsOpen, setIsDetailsOpen] = useState<boolean>(false);
  const [wikiImageUrl, setWikiImageUrl] = useState<string | null>(null);
  const [isFetchingWiki, setIsFetchingWiki] = useState<boolean>(false);

  // NEW Location States
  const [nearestPharmacy, setNearestPharmacy] = useState<{ name: string; distanceKm: string } | null>(null);
  const [isFetchingPharmacy, setIsFetchingPharmacy] = useState<boolean>(false);

  useEffect(() => {
    const fetchWikiImage = async (diseaseName: string) => {
      // Avoid fetching for unclear media or explicit unknowns
      if (!diseaseName || diseaseName.includes("Media Unclear") || diseaseName.toLowerCase() === "unknown") {
        setWikiImageUrl(null);
        return;
      }
      setIsFetchingWiki(true);
      setWikiImageUrl(null);
      try {
        const queryTerm = encodeURIComponent(diseaseName);
        const url = `https://en.wikipedia.org/w/api.php?action=query&prop=pageimages&format=json&piprop=original&titles=${queryTerm}&origin=*`;
        const res = await fetch(url);
        const data = await res.json();
        const pages = data.query?.pages;
        if (pages) {
          const pageId = Object.keys(pages)[0];
          if (pageId && pageId !== "-1" && pages[pageId].original?.source) {
            setWikiImageUrl(pages[pageId].original.source);
          }
        }
      } catch (err) {
        console.error("Failed to fetch Wikipedia image", err);
      } finally {
        setIsFetchingWiki(false);
      }
    };

    if (parsedResult?.diseaseIdentification) {
      fetchWikiImage(parsedResult.diseaseIdentification);
      setIsDetailsOpen(false); // Reset toggle state on new diagnosis
    }
  }, [parsedResult?.diseaseIdentification]);

  useEffect(() => {
    if (parsedResult?.prescription?.medicines?.length > 0) {
      if ("geolocation" in navigator) {
        setIsFetchingPharmacy(true);
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            try {
              const res = await fetch('/api/location', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude,
                }),
              });
              const data = await res.json();
              if (res.ok && data.name) {
                setNearestPharmacy({ name: data.name, distanceKm: data.distanceKm });
              } else {
                setNearestPharmacy(null);
              }
            } catch (err) {
              console.error("Failed to fetch nearest pharmacy location", err);
              setNearestPharmacy(null);
            } finally {
              setIsFetchingPharmacy(false);
            }
          },
          (error) => {
            // Mobile browsers over local IP (HTTP instead of HTTPS) will block Geolocation
            // We just catch it silently and remove the loading spinner
            console.warn("Geolocation blocked or unavailable in this context (likely missing HTTPS).", error?.message || "");
            setIsFetchingPharmacy(false);
          },
          { timeout: 10000, maximumAge: 60000, enableHighAccuracy: false }
        );
      } else {
        setIsFetchingPharmacy(false);
      }
    } else {
      setNearestPharmacy(null);
    }
  }, [parsedResult]);

  const groupCases = (historyRecords: DiagnosisRecord[]) => {
    const caseMap = new Map<string, Case>();

    // Sort chronologically (oldest first) to build the timeline correctly
    const sortedHistory = [...historyRecords].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    sortedHistory.forEach(record => {
      const cId = record.caseId || record.id;
      let subjectType = "other";
      let status = "not_applicable";
      try {
        const parsed = JSON.parse(record.diagnosis);
        if (parsed.subjectType) subjectType = parsed.subjectType;
        if (parsed.followUpAssessment?.status) status = parsed.followUpAssessment.status;
      } catch { }

      if (!caseMap.has(cId)) {
        caseMap.set(cId, {
          caseId: cId,
          animalName: record.animalName || "Unknown",
          updatedAt: record.timestamp,
          records: [record],
          subjectType,
          latestStatus: status
        });
      } else {
        const existing = caseMap.get(cId)!;
        existing.records.push(record);
        existing.updatedAt = record.timestamp;
        if (status !== 'not_applicable') existing.latestStatus = status;
        if (record.animalName) existing.animalName = record.animalName;
      }
    });

    setCases(Array.from(caseMap.values()).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));
  };

  const fetchRemoteData = async (uid: string) => {
    try {
      const res = await fetch(`/api/history?userId=${uid}`);
      if (res.ok) {
        const data = await res.json();
        setHistory(data.history || []);
        groupCases(data.history || []);
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
      currentUserId = generateUUID();
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

  const saveToHistory = async (newResult: string, lang: string, existingCaseId?: string, animalNameStr?: string, thumbnailBase64Str?: string) => {
    let updatedHistory = [...history];
    const newRecord: DiagnosisRecord = {
      id: generateUUID(),
      caseId: existingCaseId || generateUUID(),
      timestamp: new Date().toISOString(),
      diagnosis: newResult,
      language: lang,
      animalName: animalNameStr || undefined,
      thumbnailBase64: thumbnailBase64Str || undefined
    };
    updatedHistory = [newRecord, ...updatedHistory];

    setHistory(updatedHistory);
    groupCases(updatedHistory);
    // Note: The actual DDB saving happens server-side in /api/analyze now
  };

  const handleDeleteCase = async (caseIdToDelete: string) => {
    // Optimistic UI Update
    const newHistory = history.filter(r => (r.caseId || r.id) !== caseIdToDelete);
    setHistory(newHistory);
    groupCases(newHistory);

    // if deleting active case, go back to dash
    if (activeCaseId === caseIdToDelete) {
      setActiveCaseId(null);
      setIsCreatingNewCase(false);
    }

    try {
      await fetch('/api/history', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, caseId: caseIdToDelete })
      });
    } catch (e) {
      console.error("Failed to delete case", e);
    }
  };

  const handleDeleteRecord = async (timestampToDelete: string) => {
    // Optimistic UI Update
    const newHistory = history.filter(r => r.timestamp !== timestampToDelete);
    setHistory(newHistory);
    groupCases(newHistory);

    // if deleting the last record of an active case, close it
    if (activeCaseId) {
      const remaining = newHistory.filter(r => (r.caseId || r.id) === activeCaseId);
      if (remaining.length === 0) {
        setActiveCaseId(null);
        setIsCreatingNewCase(false);
      }
    }

    try {
      await fetch('/api/history', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, timestamp: timestampToDelete })
      });
    } catch (e) {
      console.error("Failed to delete record", e);
    }
  };

  // Utility for generating a small inline thumbnail
  const generateThumbnail = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const isVideo = file.type.startsWith('video/');
      const mediaElement = isVideo ? document.createElement('video') : document.createElement('img');
      const url = URL.createObjectURL(file);

      const onLoaded = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve("");

        // Calculate aspect ratio for 64x64 max bounding box
        const size = 64;
        const width = isVideo ? (mediaElement as HTMLVideoElement).videoWidth : (mediaElement as HTMLImageElement).width;
        const height = isVideo ? (mediaElement as HTMLVideoElement).videoHeight : (mediaElement as HTMLImageElement).height;

        const scale = Math.min(size / width, size / height);
        canvas.width = size;
        canvas.height = size;

        // Fill white background just in case
        ctx.fillStyle = '#f3f4f6';
        ctx.fillRect(0, 0, size, size);

        const drawW = width * scale;
        const drawH = height * scale;
        const drawX = (size - drawW) / 2;
        const drawY = (size - drawH) / 2;

        ctx.drawImage(mediaElement, drawX, drawY, drawW, drawH);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
        URL.revokeObjectURL(url);
      };

      if (isVideo) {
        const video = mediaElement as HTMLVideoElement;
        video.src = url;
        video.muted = true;
        video.playsInline = true;
        video.currentTime = 1.0; // grab 1 second in
        video.addEventListener('seeked', onLoaded, { once: true });
        video.addEventListener('error', () => resolve(""), { once: true });
      } else {
        const img = mediaElement as HTMLImageElement;
        img.src = url;
        img.onload = onLoaded;
        img.onerror = () => resolve("");
      }
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      setResult(null); // Clear previous result
      setParsedResult(null);
      setError(null);

      // Async generate thumbnail
      const thumb = await generateThumbnail(selectedFile);
      // We will store this locally on the window or component state briefly to append it later
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any)._tempThumbnailBase64 = thumb;
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
    setParsedResult(null);

    const formData = new FormData();
    formData.append("language", language);
    formData.append("userId", userId);

    if (symptoms.trim()) {
      formData.append("symptoms", symptoms.trim());
    }

    // If activeCaseId is set, this is a follow-up on an existing case
    if (activeCaseId) {
      formData.append("caseId", activeCaseId);
      const activeCase = cases.find(c => c.caseId === activeCaseId);
      if (activeCase) {
        // Build timeline text for LLM context
        const timelineText = activeCase.records.map((r, i) => `[Visit ${i + 1} on ${r.timestamp}]:\n${r.diagnosis}`).join('\n\n---\n\n');
        formData.append("previousDiagnosis", timelineText);
      }
    }

    if (animalName.trim()) {
      formData.append("animalName", animalName.trim());
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tempThumb = (window as any)._tempThumbnailBase64;
    if (tempThumb) {
      formData.append("thumbnailBase64", tempThumb);
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
      try {
        setParsedResult(JSON.parse(data.result));
      } catch {
        setParsedResult(null);
      }

      // Update local state optimistic UI
      saveToHistory(data.result, language, activeCaseId ? activeCaseId : data.caseId, animalName.trim(), tempThumb);

      const newLog: UsageLog = {
        id: generateUUID(),
        timestamp: new Date().toISOString(),
        modelUsed: data.modelUsed || "amazon.nova-pro-v1:0",
        inputMediaSizeBytes: file.size,
      };
      setUsageLogs([newLog, ...usageLogs]);

      // If we created a new case or followed up, Ensure we stay on/jump to the timeline
      if (data.caseId) {
        setActiveCaseId(data.caseId);
      } else if (activeCaseId) {
        // fallback to ensure we stick around
        setActiveCaseId(activeCaseId);
      }
      setIsCreatingNewCase(false);

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to analyze the image.");
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

            {/* History Sheet Removed - Now using CaseDashboard on main screen */}
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

        {/* Dynamic Main Content */}
        {(() => {
          const showResultCard = !activeCaseId || loading || result || error;
          const uploadFormContent = (
            <div className={`grid grid-cols-1 ${showResultCard ? 'md:grid-cols-2' : 'max-w-xl mx-auto'} gap-8 w-full animate-in fade-in slide-in-from-top-4 duration-500 relative z-10`}>
              {/* Upload Form Card */}
              <div className="space-y-4 w-full">
                <Card className="shadow-lg border-0 ring-1 ring-gray-200">
                  <CardHeader>
                    <CardTitle>{activeCaseId ? "What is the animal's current status?" : "New Diagnosis"}</CardTitle>
                    <CardDescription>
                      {activeCaseId
                        ? "Upload a new photo/video to check progress."
                        : "Upload a photo or video to get an instant diagnosis and treatment plan."}
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
                                setParsedResult(null);
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

                      {/* Animal Nickname Input */}
                      {!activeCaseId && (
                        <div className="space-y-3">
                          <Label htmlFor="animalName">Animal ID / Nickname (Optional)</Label>
                          <Input
                            id="animalName"
                            placeholder="e.g., Buddy, Tag #432, Fido"
                            value={animalName}
                            onChange={(e) => setAnimalName(e.target.value)}
                          />
                        </div>
                      )}

                      {/* Language Selection */}
                      {!activeCaseId && (
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
                      )}

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
                            {activeCaseId ? "Evaluate Progress" : "Get Veterinary Diagnosis"}
                          </>
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>

              {/* Results Card */}
              {showResultCard && (
                <Card className="shadow-lg border-0 ring-1 ring-gray-200 bg-white flex flex-col h-full">
                  <CardHeader>
                    <CardTitle>Analysis Result</CardTitle>
                    <CardDescription>The AI&apos;s response will appear here.</CardDescription>
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

                    {parsedResult && !loading && (
                      <div className="space-y-4 overflow-y-auto max-h-[600px] pb-6 pr-2 scrollbar-none">

                        {/* Confidence Banner */}
                        {parsedResult.confidenceScore >= 60 && !parsedResult.recommendHumanVet ? (
                          <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
                            <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                            <div>
                              <p className="font-bold text-green-900">AI Assessment Confident ({parsedResult.confidenceScore}%)</p>
                              <p className="text-sm text-green-700">See the recommended home treatment plan below.</p>
                            </div>
                          </div>
                        ) : parsedResult.confidenceScore >= 30 ? (
                          <div className="p-3 bg-yellow-50 border border-yellow-300 rounded-lg flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 shrink-0" />
                            <div>
                              <p className="font-bold text-yellow-900">AI Uncertainty Warning ({parsedResult.confidenceScore}%)</p>
                              <p className="text-sm text-yellow-800">The AI is uncertain. We highly recommend consulting a human veterinarian before proceeding with treatment.</p>
                            </div>
                          </div>
                        ) : (
                          <div className="p-3 bg-red-50 border border-red-300 rounded-lg flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
                            <div>
                              <p className="font-bold text-red-900">CRITICAL: Severe Uncertainty ({parsedResult.confidenceScore}%)</p>
                              <p className="text-sm text-red-800">Diagnosis is highly uncertain due to unclear media. Do not rely heavily on this prescription.</p>
                            </div>
                          </div>
                        )}

                        {/* Follow-Up Assessment Banner */}
                        {parsedResult.followUpAssessment && parsedResult.followUpAssessment.status !== "not_applicable" && (
                          <div className={`p-4 rounded-lg flex items-start gap-3 border ${parsedResult.followUpAssessment.status === "improving" ? "bg-emerald-50 border-emerald-200" :
                            parsedResult.followUpAssessment.status === "worsening" ? "bg-rose-50 border-rose-200" :
                              "bg-blue-50 border-blue-200" // unchanged or stable
                            }`}>
                            {parsedResult.followUpAssessment.status === "improving" ? (
                              <Activity className="w-6 h-6 text-emerald-600 shrink-0" />
                            ) : parsedResult.followUpAssessment.status === "worsening" ? (
                              <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0" />
                            ) : (
                              <Sparkles className="w-6 h-6 text-blue-600 shrink-0" />
                            )}
                            <div>
                              <p className={`font-bold capitalize ${parsedResult.followUpAssessment.status === "improving" ? "text-emerald-900" :
                                parsedResult.followUpAssessment.status === "worsening" ? "text-rose-900" :
                                  "text-blue-900"
                                }`}>
                                Condition is {parsedResult.followUpAssessment.status}
                              </p>
                              <p className={`text-sm mt-1 leading-snug ${parsedResult.followUpAssessment.status === "improving" ? "text-emerald-800" :
                                parsedResult.followUpAssessment.status === "worsening" ? "text-rose-800" :
                                  "text-blue-800"
                                }`}>
                                {parsedResult.followUpAssessment.notes}
                              </p>
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-3 border border-gray-100 rounded-lg bg-gray-50/50">
                            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">Identified Subject</p>
                            <p className="text-sm font-semibold text-gray-900 capitalize">{parsedResult.subjectType}</p>
                          </div>
                          <div className="p-3 border border-gray-100 rounded-lg bg-gray-50/50">
                            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">Diagnosis</p>
                            <p className="text-sm font-semibold text-gray-900">{parsedResult.diseaseIdentification}</p>
                          </div>
                        </div>

                        {/* Expandable Disease Details */}
                        {parsedResult.diseaseDetails && parsedResult.diseaseDetails.description && (
                          <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm shrink-0">
                            <button
                              type="button"
                              onClick={() => setIsDetailsOpen(!isDetailsOpen)}
                              className="w-full p-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors focus:outline-none"
                            >
                              <span className="font-semibold text-gray-800 text-sm">Know More about {parsedResult.diseaseIdentification}</span>
                              <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform duration-300 ${isDetailsOpen ? "rotate-180" : ""}`} />
                            </button>

                            <div className={`grid transition-all duration-300 ease-in-out ${isDetailsOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                              <div className="overflow-hidden">
                                <div className="p-4 space-y-4 border-t border-gray-100 bg-white">

                                  {isFetchingWiki ? (
                                    <div className="flex animate-pulse space-x-3 items-center justify-center p-6 bg-gray-50 rounded-lg border border-gray-100">
                                      <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                                      <span className="text-sm font-medium text-gray-500">Searching Wikipedia for images...</span>
                                    </div>
                                  ) : wikiImageUrl ? (
                                    <div className="w-full flex justify-center mb-2 px-4 py-2 bg-gray-50 rounded-lg border border-gray-100">
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img src={wikiImageUrl} alt={parsedResult.diseaseIdentification} className="max-h-56 w-auto rounded-md shadow-sm border border-gray-200 object-contain" />
                                    </div>
                                  ) : (
                                    <div className="w-full flex flex-col items-center justify-center p-6 bg-gray-50 rounded-lg border border-gray-100 mb-2">
                                      <ImageIcon className="w-8 h-8 text-gray-300 mb-2 opacity-50" />
                                      <p className="text-xs text-center text-gray-500 mb-3">No verified public image found on Wikipedia.</p>
                                      <a
                                        href={`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(parsedResult.diseaseIdentification)}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-xs text-blue-600 hover:underline font-semibold bg-blue-50 px-3 py-1.5 rounded-full"
                                      >
                                        View Images on Google
                                      </a>
                                    </div>
                                  )}

                                  <div>
                                    <h4 className="font-bold text-gray-800 text-sm mb-1.5 flex items-center gap-2">
                                      Description
                                    </h4>
                                    <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-3 rounded-lg border border-gray-100">{parsedResult.diseaseDetails.description}</p>
                                  </div>

                                  {parsedResult.diseaseDetails.typicalSymptoms && parsedResult.diseaseDetails.typicalSymptoms.length > 0 && (
                                    <div>
                                      <h4 className="font-bold text-gray-800 text-sm mb-1.5">Typical Symptoms</h4>
                                      <ul className="list-disc pl-5 space-y-1 bg-yellow-50/50 p-3 rounded-lg border border-yellow-100/50">
                                        {parsedResult.diseaseDetails.typicalSymptoms.map((sym: string, idx: number) => (
                                          <li key={idx} className="text-sm text-gray-600">{sym}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Medicines */}
                        {parsedResult.prescription?.medicines?.length > 0 && (
                          <div className="mt-2 text-sm">
                            <h4 className="font-bold text-gray-800 mb-2 border-b border-gray-100 pb-2">Prescribed Medicines</h4>
                            <div className="space-y-3">
                              {parsedResult.prescription.medicines.map((med: { name: string; dosage: string; frequency: string; duration: string; unitPriceEstimate?: string; totalCostEstimate?: string; purchaseQuery?: string }, idx: number) => (
                                <div key={idx} className="p-4 border border-blue-100 bg-blue-50/30 rounded-lg flex flex-col gap-2 relative">
                                  <div className="flex justify-between items-start">
                                    <p className="font-semibold text-blue-900 text-base">{med.name}</p>
                                    {med.totalCostEstimate && (
                                      <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-0.5 rounded shadow-sm">
                                        {med.totalCostEstimate}
                                      </span>
                                    )}
                                  </div>

                                  <p className="text-xs text-gray-600">
                                    <span className="font-medium text-gray-700">Dosage:</span> {med.dosage} &nbsp;|&nbsp;
                                    <span className="font-medium text-gray-700"> Freq:</span> {med.frequency} &nbsp;|&nbsp;
                                    <span className="font-medium text-gray-700"> Duration:</span> {med.duration}
                                  </p>

                                  {med.unitPriceEstimate && (
                                    <p className="text-xs text-green-700 font-medium bg-green-50 w-fit px-2 py-1 rounded inline-block mt-0.5">
                                      Unit Price: {med.unitPriceEstimate}
                                    </p>
                                  )}

                                  {med.purchaseQuery && (
                                    <div className="mt-1">
                                      <a
                                        href={`https://www.google.com/search?tbm=shop&q=${encodeURIComponent(med.purchaseQuery)}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors px-3 py-1.5 rounded-full shadow-sm"
                                      >
                                        Buy Online
                                      </a>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>

                            {/* Local Pharmacy and Online Buying */}
                            <div className="mt-4 flex flex-col sm:flex-row gap-2">
                              {isFetchingPharmacy ? (
                                <div className="flex-1 flex items-center justify-center p-3 text-xs bg-gray-50 border border-gray-100 rounded-lg text-gray-500 animate-pulse">
                                  <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                                  Looking for nearest veterinary pharmacy...
                                </div>
                              ) : nearestPharmacy ? (
                                <div className="flex-1 flex flex-col justify-center p-3 text-xs bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-900 shadow-sm">
                                  <div className="flex items-center gap-1 font-bold mb-1">
                                    <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                                    Nearest Pharmacy Found
                                  </div>
                                  <span className="font-semibold text-emerald-800 leading-tight block">{nearestPharmacy.name}</span>
                                  {nearestPharmacy.distanceKm && (
                                    <span className="text-emerald-700 mt-1 block font-medium">{nearestPharmacy.distanceKm} km away</span>
                                  )}
                                </div>
                              ) : null}
                            </div>
                          </div>
                        )}

                        {/* Care Steps */}
                        {parsedResult.prescription?.careSteps?.length > 0 && (
                          <div className="mt-4 text-sm pb-4">
                            <h4 className="font-bold text-gray-800 mb-3 border-b border-gray-100 pb-2">Immediate Care Steps</h4>
                            <ul className="pl-0 space-y-2">
                              {parsedResult.prescription.careSteps.map((step: string, idx: number) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <span className="bg-gray-100 text-gray-500 text-[10px] font-bold px-1.5 py-0.5 rounded mt-0.5 shrink-0">{idx + 1}</span>
                                  <span className="text-gray-700">{step}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div className="mt-auto pt-4 border-t border-gray-100">
                          <Button
                            variant="outline"
                            className="w-full border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800"
                            onClick={() => {
                              setIsCreatingNewCase(true);
                              setFile(null);
                              setPreviewUrl(null);
                              setSymptoms("");
                              setError(null);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                          >
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Provide Follow-Up Media for this Diagnosis
                          </Button>
                        </div>
                      </div>
                    )}

                    {result && !parsedResult && !loading && (
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
                            setIsCreatingNewCase(true);
                            setFile(null);
                            setPreviewUrl(null);
                            setSymptoms("");
                            setError(null);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                        >
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Provide Follow-Up Media for this Diagnosis
                        </Button>
                      </div>
                    )}

                  </CardContent>
                </Card>
              )}
            </div>
          );

          if (!activeCaseId && !isCreatingNewCase) {
            return (
              <CaseDashboard
                cases={cases}
                onStartNew={() => setIsCreatingNewCase(true)}
                onViewCase={(id) => setActiveCaseId(id)}
                onDeleteCase={handleDeleteCase}
              />
            );
          } else if (activeCaseId) {
            return (
              <CaseTimeline
                caseData={cases.find(c => c.caseId === activeCaseId)!}
                onBack={() => { setActiveCaseId(null); setIsCreatingNewCase(false); }}
                onFollowUp={!isCreatingNewCase ? () => {
                  setIsCreatingNewCase(true);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                } : undefined}
                uploadForm={isCreatingNewCase ? uploadFormContent : undefined}
                onDeleteRecord={handleDeleteRecord}
              />
            );
          } else {
            return (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 w-full max-w-full">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setIsCreatingNewCase(false);
                    setFile(null);
                    setPreviewUrl(null);
                    setResult(null);
                    setParsedResult(null);
                  }}
                  className="mb-2 text-gray-600 hover:bg-gray-100/50"
                >
                  <div className="flex items-center">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Dashboard
                  </div>
                </Button>
                {uploadFormContent}
              </div>
            );
          }
        })()}
      </div>
    </main>
  );
}
