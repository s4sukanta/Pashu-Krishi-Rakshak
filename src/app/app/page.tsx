"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Camera,
  Video,
  History,
  Settings,
  ArrowLeft,
  Upload,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Phone,
  Heart,
  Stethoscope,
  Pill,
  Home as HomeIcon,
  ChevronDown,
  X,
  Volume2,
  VolumeX,
  RefreshCw,
  Trash2,
  Info,
  Languages,
  LogOut,
  User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { AccessibleCaseDashboard } from "@/components/AccessibleCaseDashboard";
import { AccessibleCaseTimeline } from "@/components/AccessibleCaseTimeline";
import { useAuth } from "@/components/AuthProvider";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// Language translations
const translations = {
  english: {
    appName: "Pashu Krishi Rakshak",
    tagline: "AI Animal Doctor",
    takePhoto: "Take Photo",
    recordVideo: "Record Video",
    viewHistory: "View History",
    settings: "Settings",
    uploadMedia: "Upload Photo/Video",
    symptoms: "Describe Symptoms",
    symptomsPlaceholder: "What problems do you see? (e.g., not eating, fever, wound)",
    animalName: "Animal Name/Tag",
    animalNamePlaceholder: "e.g., Lakshmi, Tag #23",
    language: "Language",
    analyze: "Get Diagnosis",
    analyzing: "Analyzing...",
    back: "Back",
    result: "Diagnosis Result",
    disease: "Problem Found",
    confidence: "Confidence",
    medicines: "Medicines",
    careSteps: "Home Care Steps",
    warning: "See a Doctor",
    emergency: "EMERGENCY - Call Vet Now",
    nearestPharmacy: "Nearest Medicine Shop",
    newDiagnosis: "New Diagnosis",
    followUp: "Check Progress",
    noHistory: "No previous records",
    startFirst: "Take a photo to start",
    cases: "My Animals",
    viewCase: "View Details",
    deleteCase: "Delete",
    improving: "Getting Better",
    worsening: "Getting Worse",
    stable: "No Change",
    visit: "Visit",
    myCases: "My Animals",
    selectLanguage: "Select Language",
    logout: "Logout",
    logoutConfirm: "Are you sure you want to logout?",
    loggedInAs: "Logged in as",
    confirmLogout: "Confirm Logout",
    cancel: "Cancel",
    account: "Account",
    logoutWarning: "You will need to login again to access your data.",
  },
  hindi: {
    appName: "पशु कृषि रक्षक",
    tagline: "AI पशु चिकित्सक",
    takePhoto: "फोटो लें",
    recordVideo: "वीडियो बनाएं",
    viewHistory: "पुराने रिकॉर्ड",
    settings: "सेटिंग्स",
    uploadMedia: "फोटो/वीडियो अपलोड करें",
    symptoms: "लक्षण बताएं",
    symptomsPlaceholder: "क्या समस्या है? (जैसे, खाना नहीं खा रहा, बुखार, घाव)",
    animalName: "जानवर का नाम/टैग",
    animalNamePlaceholder: "जैसे, लक्ष्मी, टैग #23",
    language: "भाषा",
    analyze: "जाँच करें",
    analyzing: "जाँच हो रही है...",
    back: "वापस",
    result: "जाँच का परिणाम",
    disease: "समस्या मिली",
    confidence: "विश्वास",
    medicines: "दवाइयाँ",
    careSteps: "घर पर देखभाल",
    warning: "डॉक्टर को दिखाएं",
    emergency: "आपातकालीन - अभी डॉक्टर को बुलाएं",
    nearestPharmacy: "नज़दीकी दवा की दुकान",
    newDiagnosis: "नई जाँच",
    followUp: "प्रगति जाँचें",
    noHistory: "कोई पुराना रिकॉर्ड नहीं",
    startFirst: "शुरू करने के लिए फोटो लें",
    cases: "मेरे जानवर",
    viewCase: "विवरण देखें",
    deleteCase: "हटाएं",
    improving: "ठीक हो रहा है",
    worsening: "बिगड़ रहा है",
    stable: "कोई बदलाव नहीं",
    visit: "मुलाकात",
    myCases: "मेरे जानवर",
    selectLanguage: "भाषा चुनें",
    logout: "लॉग आउट",
    logoutConfirm: "क्या आप लॉग आउट करना चाहते हैं?",
    loggedInAs: "लॉग इन है",
    confirmLogout: "लॉग आउट की पुष्टि करें",
    cancel: "रद्द करें",
    account: "खाता",
    logoutWarning: "आपको अपने डेटा तक पहुंचने के लिए फिर से लॉगिन करना होगा।",
  },
  bengali: {
    appName: "পশু কৃষি রক্ষক",
    tagline: "AI পশু চিকিৎসক",
    takePhoto: "ছবি তুলুন",
    recordVideo: "ভিডিও করুন",
    viewHistory: "পুরানো রেকর্ড",
    settings: "সেটিংস",
    uploadMedia: "ছবি/ভিডিও আপলোড করুন",
    symptoms: "লক্ষণ বলুন",
    symptomsPlaceholder: "কি সমস্যা? (যেমন, খাচ্ছে না, জ্বর, ক্ষত)",
    animalName: "পশুর নাম/ট্যাগ",
    animalNamePlaceholder: "যেমন, লক্ষ্মী, ট্যাগ #২৩",
    language: "ভাষা",
    analyze: "পরীক্ষা করুন",
    analyzing: "পরীক্ষা হচ্ছে...",
    back: "ফিরে যান",
    result: "পরীক্ষার ফলাফল",
    disease: "সমস্যা পাওয়া গেছে",
    confidence: "বিশ্বাস",
    medicines: "ওষুধ",
    careSteps: "বাড়িতে যত্ন",
    warning: "ডাক্তার দেখান",
    emergency: "জরুরি - এখনই ডাক্তার ডাকুন",
    nearestPharmacy: "নিকটতম ওষুধের দোকান",
    newDiagnosis: "নতুন পরীক্ষা",
    followUp: "অগ্রগতি দেখুন",
    noHistory: "কোনো পুরানো রেকর্ড নেই",
    startFirst: "শুরু করতে ছবি তুলুন",
    cases: "আমার পশু",
    viewCase: "বিস্তারিত দেখুন",
    deleteCase: "মুছুন",
    improving: "ভালো হচ্ছে",
    worsening: "খারাপ হচ্ছে",
    stable: "কোনো পরিবর্তন নেই",
    visit: "দেখা",
    myCases: "আমার পশু",
    selectLanguage: "ভাষা নির্বাচন করুন",
    logout: "লগ আউট",
    logoutConfirm: "আপনি কি লগ আউট করতে চান?",
    loggedInAs: "লগ ইন আছেন",
    confirmLogout: "লগ আউট নিশ্চিত করুন",
    cancel: "বাতিল করুন",
    account: "অ্যাকাউন্ট",
    logoutWarning: "আপনার ডেটা অ্যাক্সেস করতে আপনাকে আবার লগইন করতে হবে।",
  },
};

type Language = keyof typeof translations;

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

type ScreenType = 'home' | 'capture' | 'history' | 'result' | 'timeline' | 'settings';

export default function PashuKrishiRakshak() {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('home');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [language, setLanguage] = useState<Language>("hindi");
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [parsedResult, setParsedResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [symptoms, setSymptoms] = useState<string>("");
  const [history, setHistory] = useState<DiagnosisRecord[]>([]);
  const [usageLogs, setUsageLogs] = useState<UsageLog[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [userId, setUserId] = useState<string>("");
  const [cases, setCases] = useState<Case[]>([]);
  const [activeCaseId, setActiveCaseId] = useState<string | null>(null);
  const [animalName, setAnimalName] = useState<string>("");
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [captureMode, setCaptureMode] = useState<'photo' | 'video' | 'upload'>('photo');
  const [showOptionalDetails, setShowOptionalDetails] = useState<boolean>(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState<boolean>(false);

  const { signOut, user } = useAuth();
  const router = useRouter();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  const t = translations[language];

  const groupCases = (historyRecords: DiagnosisRecord[]) => {
    const caseMap = new Map<string, Case>();
    const sortedHistory = [...historyRecords].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    sortedHistory.forEach(record => {
      const cId = record.caseId || record.id;
      let subjectType = "animal";
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

  const fetchRemoteData = async () => {
    try {
      const { fetchAuthSession } = await import('aws-amplify/auth');
      const session = await fetchAuthSession();
      const uid = session.userSub;
      const token = session.tokens?.accessToken?.toString() || '';

      if (!uid) return;
      setUserId(uid);

      const API_URL = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, "");
      
      // Check if API_URL is configured
      if (!API_URL) {
        console.warn("API_URL not configured, skipping remote data fetch");
        return;
      }

      const res = await fetch(`${API_URL}/history?userId=${uid}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setHistory(data.history || []);
        groupCases(data.history || []);
        setUsageLogs(data.usageLogs || []);
      } else {
        console.warn(`Failed to fetch history: ${res.status} ${res.statusText}`);
      }
    } catch (e) {
      console.error("Failed to fetch remote history", e);
    }
  };

  useEffect(() => {
    // Only fetch remote data if user is authenticated
    if (user) {
      fetchRemoteData();
    }

    // Load saved language preference
    const savedLang = localStorage.getItem("pashu_krishi_language") as Language;
    if (savedLang && translations[savedLang]) {
      setLanguage(savedLang);
    }
  }, [user]);

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
  };

  const handleDeleteCase = async (caseIdToDelete: string) => {
    const newHistory = history.filter(r => (r.caseId || r.id) !== caseIdToDelete);
    setHistory(newHistory);
    groupCases(newHistory);

    if (activeCaseId === caseIdToDelete) {
      setActiveCaseId(null);
      setCurrentScreen('history');
    }

    try {
      const { fetchAuthSession } = await import('aws-amplify/auth');
      const session = await fetchAuthSession();
      const token = session.tokens?.accessToken?.toString() || '';
      const API_URL = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, "");

      await fetch(`${API_URL}/history`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId, caseId: caseIdToDelete })
      });
    } catch (e) {
      console.error("Failed to delete case", e);
    }
  };

  const handleDeleteRecord = async (timestampToDelete: string) => {
    const newHistory = history.filter(r => r.timestamp !== timestampToDelete);
    setHistory(newHistory);
    groupCases(newHistory);

    if (activeCaseId) {
      const remaining = newHistory.filter(r => (r.caseId || r.id) === activeCaseId);
      if (remaining.length === 0) {
        setActiveCaseId(null);
        setCurrentScreen('history');
      }
    }

    try {
      const { fetchAuthSession } = await import('aws-amplify/auth');
      const session = await fetchAuthSession();
      const token = session.tokens?.accessToken?.toString() || '';
      const API_URL = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, "");

      await fetch(`${API_URL}/history`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId, timestamp: timestampToDelete })
      });
    } catch (e) {
      console.error("Failed to delete record", e);
    }
  };

  const generateThumbnail = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const isVideo = file.type.startsWith('video/');
      const mediaElement = isVideo ? document.createElement('video') : document.createElement('img');
      const url = URL.createObjectURL(file);

      const onLoaded = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve("");

        const size = 64;
        const width = isVideo ? (mediaElement as HTMLVideoElement).videoWidth : (mediaElement as HTMLImageElement).width;
        const height = isVideo ? (mediaElement as HTMLVideoElement).videoHeight : (mediaElement as HTMLImageElement).height;

        const scale = Math.min(size / width, size / height);
        canvas.width = size;
        canvas.height = size;

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
        video.currentTime = 1.0;
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
      setResult(null);
      setParsedResult(null);
      setError(null);
      setCurrentScreen('capture');

      const thumb = await generateThumbnail(selectedFile);
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

  const speakResult = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language === 'hindi' ? 'hi-IN' : language === 'bengali' ? 'bn-IN' : 'en-IN';
      utterance.rate = 0.9;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
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
    setParsedResult(null);

    const formData = new FormData();
    formData.append("language", language);
    formData.append("userId", userId);

    if (symptoms.trim()) {
      formData.append("symptoms", symptoms.trim());
    }

    if (activeCaseId) {
      formData.append("caseId", activeCaseId);
      const activeCase = cases.find(c => c.caseId === activeCaseId);
      if (activeCase) {
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
      const frames = await extractFrames(file, 4);
      if (frames.length > 0) {
        frames.forEach((blob, index) => {
          formData.append("media", blob, `frame_${index}.jpg`);
        });
      } else {
        formData.append("media", file);
      }
    } else {
      formData.append("media", file);
    }

    try {
      const { fetchAuthSession } = await import('aws-amplify/auth');
      const session = await fetchAuthSession();
      const token = session.tokens?.accessToken?.toString() || '';
      const API_URL = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, "");

      // Validate environment variables
      if (!API_URL || API_URL === '') {
        throw new Error("API URL is not configured. Please check Amplify Console environment variables.");
      }

      console.log('=== DIAGNOSTIC INFO ===');
      console.log('API URL:', API_URL);
      console.log('User ID:', userId);
      console.log('Token:', token ? 'Present' : 'Missing');
      console.log('File:', file ? `${file.name} (${file.size} bytes)` : 'No file');

      const response = await fetch(`${API_URL}/analyze`, {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });

      console.log('Response Status:', response.status);
      console.log('Response OK:', response.ok);

      const data = await response.json();

      if (!response.ok) {
        console.error('Error response:', data);
        throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      setResult(data.result);
      try {
        const parsed = JSON.parse(data.result);
        setParsedResult(parsed);

        // Auto-speak the diagnosis
        if (parsed.diseaseIdentification) {
          const speakText = `${t.disease}: ${parsed.diseaseIdentification}. ${parsed.diseaseDetails?.description || ''}`;
          setTimeout(() => speakResult(speakText), 500);
        }
      } catch {
        setParsedResult(null);
      }

      saveToHistory(data.result, language, activeCaseId ? activeCaseId : data.caseId, animalName.trim(), tempThumb);

      const newLog: UsageLog = {
        id: generateUUID(),
        timestamp: new Date().toISOString(),
        modelUsed: data.modelUsed || "amazon.nova-pro-v1:0",
        inputMediaSizeBytes: file.size,
      };
      setUsageLogs([newLog, ...usageLogs]);

      if (data.caseId) {
        setActiveCaseId(data.caseId);
      }

      setCurrentScreen('result');

    } catch (err: unknown) {
      console.error('=== ERROR DETAILS ===');
      console.error('Error:', err);
      if (err instanceof Error) {
        console.error('Message:', err.message);
        console.error('Stack:', err.stack);
      }
      
      // Provide specific error messages based on error type
      let errorMessage = "Failed to analyze the image.";
      if (err instanceof Error) {
        if (err.message.includes('API URL is not configured')) {
          errorMessage = err.message;
        } else if (err.message.includes('CORS') || err.message.includes('cors')) {
          errorMessage = "Network error: CORS policy blocked the request. Please contact support.";
        } else if (err.message.includes('401')) {
          errorMessage = "Authentication error: Please logout and login again.";
        } else if (err.message.includes('504') || err.message.includes('timeout')) {
          errorMessage = "Request timeout: The image is too large or server is busy. Please try again.";
        } else {
          errorMessage = err.message;
        }
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const resetCapture = () => {
    setFile(null);
    setPreviewUrl(null);
    setSymptoms("");
    setAnimalName("");
    setResult(null);
    setParsedResult(null);
    setError(null);
    setActiveCaseId(null);
    setShowOptionalDetails(false);
  };

  const handleLanguageChange = (newLang: Language) => {
    setLanguage(newLang);
    localStorage.setItem("pashu_krishi_language", newLang);
  };

  // Home Screen
  const renderHomeScreen = () => (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-primary text-primary-foreground p-4 safe-area-top">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary-foreground/20 rounded-full flex items-center justify-center">
              <Stethoscope className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-xl font-bold">{t.appName}</h1>
              <p className="text-sm opacity-90">{t.tagline}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-primary-foreground hover:bg-primary-foreground/20"
            onClick={() => setCurrentScreen('settings')}
          >
            <Settings className="w-6 h-6" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 max-w-lg mx-auto w-full">
        {/* Language Selector */}
        <div className="mb-6">
          <Select value={language} onValueChange={(v) => handleLanguageChange(v as Language)}>
            <SelectTrigger className="w-full h-14 text-lg bg-card border-2 border-border">
              <div className="flex items-center gap-3">
                <Languages className="w-6 h-6 text-primary" />
                <SelectValue placeholder={t.selectLanguage} />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hindi" className="text-lg py-3">हिंदी (Hindi)</SelectItem>
              <SelectItem value="english" className="text-lg py-3">English</SelectItem>
              <SelectItem value="bengali" className="text-lg py-3">বাংলা (Bengali)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Main Action Buttons */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Take Photo */}
          <button
            className="relative bg-card border-2 border-primary rounded-2xl p-6 flex flex-col items-center justify-center gap-3 shadow-sm hover:shadow-md transition-all active:scale-95 min-h-[140px]"
            onClick={() => setCaptureMode('photo')}
          >
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={handleFileChange}
            />
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Camera className="w-10 h-10 text-primary" />
            </div>
            <span className="text-lg font-semibold text-foreground text-center">{t.takePhoto}</span>
          </button>

          {/* Record Video */}
          <button
            className="relative bg-card border-2 border-accent rounded-2xl p-6 flex flex-col items-center justify-center gap-3 shadow-sm hover:shadow-md transition-all active:scale-95 min-h-[140px]"
            onClick={() => setCaptureMode('video')}
          >
            <input
              type="file"
              accept="video/*"
              capture="environment"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={handleFileChange}
            />
            <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center">
              <Video className="w-10 h-10 text-accent" />
            </div>
            <span className="text-lg font-semibold text-foreground text-center">{t.recordVideo}</span>
          </button>
        </div>

        {/* Upload from Gallery */}
        <button
          className="relative w-full bg-secondary border-2 border-dashed border-border rounded-2xl p-5 flex items-center justify-center gap-4 mb-6 hover:bg-secondary/80 transition-colors active:scale-98"
        >
          <input
            type="file"
            accept="image/*, video/*"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onChange={handleFileChange}
          />
          <Upload className="w-8 h-8 text-muted-foreground" />
          <span className="text-base font-medium text-muted-foreground">{t.uploadMedia}</span>
        </button>

        {/* View History Button */}
        <button
          className="w-full bg-card border-2 border-border rounded-2xl p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-all active:scale-98 mb-4"
          onClick={() => setCurrentScreen('history')}
        >
          <div className="w-14 h-14 bg-muted rounded-xl flex items-center justify-center">
            <History className="w-8 h-8 text-muted-foreground" />
          </div>
          <div className="flex-1 text-left">
            <span className="text-lg font-semibold text-foreground block">{t.viewHistory}</span>
            <span className="text-sm text-muted-foreground">
              {cases.length > 0 ? `${cases.length} ${t.cases}` : t.noHistory}
            </span>
          </div>
          <ChevronDown className="w-6 h-6 text-muted-foreground -rotate-90" />
        </button>

        {/* Quick Tips Card */}
        <Card className="border-2 border-border bg-card/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Info className="w-5 h-5 text-primary" />
              {language === 'hindi' ? 'उपयोग के टिप्स' : language === 'bengali' ? 'ব্যবহারের টিপস' : 'Quick Tips'}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>{language === 'hindi' ? '1. जानवर की साफ फोटो लें' : language === 'bengali' ? '1. পশুর পরিষ্কার ছবি তুলুন' : '1. Take a clear photo of the animal'}</p>
            <p>{language === 'hindi' ? '2. समस्या वाली जगह दिखाएं' : language === 'bengali' ? '2. সমস্যাযুক্ত স্থান দেখান' : '2. Show the affected area clearly'}</p>
            <p>{language === 'hindi' ? '3. अच्छी रोशनी में फोटो लें' : language === 'bengali' ? '3. ভালো আলোতে ছবি তুলুন' : '3. Take photo in good lighting'}</p>
          </CardContent>
        </Card>
      </main>

      {/* Bottom Navigation */}
      <nav className="bg-card border-t-2 border-border safe-area-bottom">
        <div className="flex justify-around items-center py-3 max-w-lg mx-auto">
          <button
            className="flex flex-col items-center gap-1 p-2 text-primary"
            onClick={() => setCurrentScreen('home')}
          >
            <HomeIcon className="w-7 h-7" />
            <span className="text-xs font-medium">{language === 'hindi' ? 'होम' : language === 'bengali' ? 'হোম' : 'Home'}</span>
          </button>
          <button
            className="flex flex-col items-center gap-1 p-2 text-muted-foreground"
            onClick={() => setCurrentScreen('history')}
          >
            <Heart className="w-7 h-7" />
            <span className="text-xs font-medium">{t.myCases}</span>
          </button>
          <button
            className="flex flex-col items-center gap-1 p-2 text-muted-foreground"
            onClick={() => setCurrentScreen('settings')}
          >
            <Settings className="w-7 h-7" />
            <span className="text-xs font-medium">{t.settings}</span>
          </button>
        </div>
      </nav>
    </div>
  );

  // Get the active case data for display
  const getActiveCaseData = () => {
    if (!activeCaseId) return null;
    return cases.find(c => c.caseId === activeCaseId);
  };

  // Capture/Upload Screen - Streamlined for quick media upload
  const renderCaptureScreen = () => {
    const activeCaseData = getActiveCaseData();

    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <header className="bg-primary text-primary-foreground p-4 safe-area-top">
          <div className="flex items-center gap-4 max-w-lg mx-auto">
            <Button
              variant="ghost"
              size="icon"
              className="text-primary-foreground hover:bg-primary-foreground/20"
              onClick={() => {
                resetCapture();
                setShowOptionalDetails(false);
                setCurrentScreen('home');
              }}
            >
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <h1 className="text-xl font-bold">
              {activeCaseId
                ? (language === 'hindi' ? 'प्रगति जाँचें' : language === 'bengali' ? 'অগ্রগতি দেখুন' : 'Check Progress')
                : t.newDiagnosis
              }
            </h1>
          </div>
        </header>

        <main className="flex-1 p-4 max-w-lg mx-auto w-full overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Animal Selection Card - Show which animal this is for */}
            {activeCaseId && activeCaseData ? (
              // Follow-up for existing animal - show linked animal card
              <div className="p-4 bg-primary/10 border-2 border-primary rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                    <RefreshCw className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-primary font-medium">
                      {language === 'hindi' ? 'फॉलो-अप जाँच' : language === 'bengali' ? 'ফলো-আপ পরীক্ষা' : 'Follow-up Diagnosis'}
                    </p>
                    <p className="text-lg font-bold text-foreground">
                      {activeCaseData.animalName !== "Unknown"
                        ? activeCaseData.animalName
                        : (language === 'hindi' ? 'अनाम जानवर' : language === 'bengali' ? 'নামহীন পশু' : 'Unnamed Animal')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {language === 'hindi'
                        ? `${activeCaseData.records.length} पिछली जाँच${activeCaseData.records.length > 1 ? 'ें' : ''}`
                        : language === 'bengali'
                          ? `${activeCaseData.records.length}টি পূর্ববর্তী পরীক্ষা`
                          : `${activeCaseData.records.length} previous visit${activeCaseData.records.length > 1 ? 's' : ''}`}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground"
                    onClick={() => {
                      setActiveCaseId(null);
                      setAnimalName("");
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : cases.length > 0 ? (
              // New diagnosis - show option to select existing animal or add new
              <div className="space-y-3">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <Heart className="w-5 h-5 text-primary" />
                  {language === 'hindi' ? 'यह जाँच किसके लिए है?' : language === 'bengali' ? 'এই পরীক্ষা কার জন্য?' : 'Who is this diagnosis for?'}
                </Label>

                {/* Existing Animals */}
                <div className="grid gap-2">
                  {cases.slice(0, 3).map((caseItem) => (
                    <button
                      key={caseItem.caseId}
                      type="button"
                      className={`w-full p-3 rounded-xl border-2 flex items-center gap-3 transition-all ${activeCaseId === caseItem.caseId
                        ? 'border-primary bg-primary/10'
                        : 'border-border bg-card hover:border-primary/50'
                        }`}
                      onClick={() => {
                        setActiveCaseId(caseItem.caseId);
                        setAnimalName(caseItem.animalName !== "Unknown" ? caseItem.animalName : "");
                      }}
                    >
                      {caseItem.records[0]?.thumbnailBase64 ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={caseItem.records[0].thumbnailBase64}
                          alt=""
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                          <Heart className="w-5 h-5 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 text-left">
                        <p className="font-semibold text-foreground">
                          {caseItem.animalName !== "Unknown"
                            ? caseItem.animalName
                            : (language === 'hindi' ? 'अनाम जानवर' : language === 'bengali' ? 'নামহীন পশু' : 'Unnamed Animal')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {caseItem.records.length} {language === 'hindi' ? 'जाँच' : language === 'bengali' ? 'পরীক্ষা' : 'visit(s)'}
                        </p>
                      </div>
                      {activeCaseId === caseItem.caseId && (
                        <CheckCircle2 className="w-5 h-5 text-primary" />
                      )}
                    </button>
                  ))}

                  {/* New Animal Option */}
                  <button
                    type="button"
                    className={`w-full p-3 rounded-xl border-2 border-dashed flex items-center gap-3 transition-all ${!activeCaseId
                      ? 'border-accent bg-accent/10'
                      : 'border-border bg-card hover:border-accent/50'
                      }`}
                    onClick={() => {
                      setActiveCaseId(null);
                      setAnimalName("");
                    }}
                  >
                    <div className="w-10 h-10 bg-accent/20 rounded-lg flex items-center justify-center">
                      <span className="text-xl font-bold text-accent">+</span>
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-semibold text-foreground">
                        {language === 'hindi' ? 'नया जानवर जोड़ें' : language === 'bengali' ? 'নতুন পশু যোগ করুন' : 'Add New Animal'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {language === 'hindi' ? 'पहली बार जाँच' : language === 'bengali' ? 'প্রথম পরীক্ষা' : 'First-time diagnosis'}
                      </p>
                    </div>
                    {!activeCaseId && (
                      <CheckCircle2 className="w-5 h-5 text-accent" />
                    )}
                  </button>
                </div>
              </div>
            ) : null}

            {/* Media Preview - Primary Focus */}
            {previewUrl && (
              <div className="relative rounded-2xl overflow-hidden bg-muted border-4 border-primary shadow-lg">
                {file?.type.startsWith('video/') ? (
                  <video
                    src={previewUrl}
                    controls
                    className="w-full max-h-72 object-contain"
                    ref={videoRef}
                  />
                ) : (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full max-h-72 object-contain"
                  />
                )}
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-3 right-3 h-10 px-3"
                  onClick={() => {
                    setFile(null);
                    setPreviewUrl(null);
                  }}
                >
                  <X className="w-5 h-5 mr-1" />
                  {language === 'hindi' ? 'हटाएं' : language === 'bengali' ? 'মুছুন' : 'Remove'}
                </Button>
                {/* Success indicator */}
                <div className="absolute bottom-3 left-3 bg-success text-success-foreground px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  {language === 'hindi' ? 'फोटो/वीडियो तैयार' : language === 'bengali' ? 'ছবি/ভিডিও প্রস্তুত' : 'Media ready'}
                </div>
              </div>
            )}

            {/* Primary Action - Analyze Button (Most Prominent) */}
            <Button
              type="submit"
              className="w-full h-20 text-2xl font-bold rounded-2xl shadow-lg"
              disabled={!file || loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-8 h-8 mr-4 animate-spin" />
                  {t.analyzing}
                </>
              ) : activeCaseId ? (
                <>
                  <RefreshCw className="w-8 h-8 mr-4" />
                  {t.followUp}
                </>
              ) : (
                <>
                  <Stethoscope className="w-8 h-8 mr-4" />
                  {t.analyze}
                </>
              )}
            </Button>

            {/* Helper text */}
            <p className="text-center text-muted-foreground text-sm">
              {activeCaseId
                ? (language === 'hindi'
                  ? 'AI पिछली जाँच के साथ तुलना करेगा'
                  : language === 'bengali'
                    ? 'AI পূর্ববর্তী পরীক্ষার সাথে তুলনা করবে'
                    : 'AI will compare with previous diagnosis')
                : (language === 'hindi'
                  ? 'ऊपर बटन दबाएं - AI आपके जानवर की जांच करेगा'
                  : language === 'bengali'
                    ? 'উপরের বোতাম টিপুন - AI আপনার পশুর পরীক্ষা করবে'
                    : 'Press above to let AI examine your animal')
              }
            </p>

            {/* Error Display */}
            {error && (
              <div className="p-4 bg-destructive/10 border-2 border-destructive/30 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-destructive shrink-0 mt-0.5" />
                <p className="text-sm text-destructive font-medium">{error}</p>
              </div>
            )}

            {/* Optional Details Toggle */}
            <button
              type="button"
              className="w-full flex items-center justify-between p-4 bg-secondary/50 rounded-xl border border-border"
              onClick={() => setShowOptionalDetails(!showOptionalDetails)}
            >
              <div className="flex items-center gap-3">
                <Info className="w-5 h-5 text-muted-foreground" />
                <span className="text-base text-muted-foreground font-medium">
                  {language === 'hindi'
                    ? 'अधिक जानकारी जोड़ें (वैकल्पिक)'
                    : language === 'bengali'
                      ? 'আরও তথ্য যোগ করুন (ঐচ্ছিক)'
                      : 'Add more details (Optional)'}
                </span>
              </div>
              <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${showOptionalDetails ? 'rotate-180' : ''}`} />
            </button>

            {/* Optional Fields - Collapsible */}
            {showOptionalDetails && (
              <div className="space-y-4 p-4 bg-secondary/30 rounded-xl border border-border animate-in slide-in-from-top-2">
                {/* Animal Name - Only show for new animals */}
                {!activeCaseId && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      {t.animalName}
                      <span className="text-xs bg-muted px-2 py-0.5 rounded">
                        {language === 'hindi' ? 'वैकल्पिक' : language === 'bengali' ? 'ঐচ্ছিক' : 'Optional'}
                      </span>
                    </Label>
                    <input
                      type="text"
                      placeholder={t.animalNamePlaceholder}
                      value={animalName}
                      onChange={(e) => setAnimalName(e.target.value)}
                      className="w-full h-12 px-4 text-base rounded-xl border-2 border-border bg-card focus:border-primary focus:outline-none transition-colors"
                    />
                    <p className="text-xs text-muted-foreground">
                      {language === 'hindi'
                        ? 'नाम देने से बाद में खोजना आसान होगा'
                        : language === 'bengali'
                          ? 'নাম দিলে পরে খুঁজে পাওয়া সহজ হবে'
                          : 'Naming helps you find this animal later'}
                    </p>
                  </div>
                )}

                {/* Symptoms - Optional */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    {t.symptoms}
                    <span className="text-xs bg-muted px-2 py-0.5 rounded">
                      {language === 'hindi' ? 'वैकल्पिक' : language === 'bengali' ? 'ঐচ্ছিক' : 'Optional'}
                    </span>
                  </Label>
                  <Textarea
                    placeholder={t.symptomsPlaceholder}
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    className="min-h-[80px] text-base rounded-xl border-2 border-border bg-card focus:border-primary resize-none"
                  />
                  <p className="text-xs text-muted-foreground">
                    {language === 'hindi'
                      ? 'लक्षण बताने से बेहतर परिणाम मिलेंगे, लेकिन जरूरी नहीं है'
                      : language === 'bengali'
                        ? 'লক্ষণ জানালে ভালো ফলাফল পাবেন, কিন্তু বাধ্যতামূলক নয়'
                        : 'Adding symptoms helps get better results, but is not required'}
                  </p>
                </div>
              </div>
            )}

            {/* Retake/Change Photo Option */}
            <div className="flex gap-3">
              <button
                type="button"
                className="flex-1 relative bg-card border-2 border-border rounded-xl p-4 flex items-center justify-center gap-2 hover:border-primary transition-colors"
              >
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={handleFileChange}
                />
                <Camera className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium">
                  {language === 'hindi' ? 'नई फोटो' : language === 'bengali' ? 'নতুন ছবি' : 'New Photo'}
                </span>
              </button>
              <button
                type="button"
                className="flex-1 relative bg-card border-2 border-border rounded-xl p-4 flex items-center justify-center gap-2 hover:border-accent transition-colors"
              >
                <input
                  type="file"
                  accept="video/*"
                  capture="environment"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={handleFileChange}
                />
                <Video className="w-5 h-5 text-accent" />
                <span className="text-sm font-medium">
                  {language === 'hindi' ? 'नया वीडियो' : language === 'bengali' ? 'নতুন ভিডিও' : 'New Video'}
                </span>
              </button>
            </div>
          </form>
        </main>
      </div>
    );
  };

  // Result Screen
  const renderResultScreen = () => (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-primary text-primary-foreground p-4 safe-area-top">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="text-primary-foreground hover:bg-primary-foreground/20"
              onClick={() => {
                stopSpeaking();
                resetCapture();
                setCurrentScreen('home');
              }}
            >
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <h1 className="text-xl font-bold">{t.result}</h1>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-primary-foreground hover:bg-primary-foreground/20"
            onClick={() => isSpeaking ? stopSpeaking() : parsedResult && speakResult(`${t.disease}: ${parsedResult.diseaseIdentification}. ${parsedResult.diseaseDetails?.description || ''}`)}
          >
            {isSpeaking ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
          </Button>
        </div>
      </header>

      <main className="flex-1 p-4 max-w-lg mx-auto w-full overflow-y-auto pb-24">
        {parsedResult ? (
          <div className="space-y-4">
            {/* Confidence Banner */}
            {parsedResult.confidenceScore >= 60 && !parsedResult.recommendHumanVet ? (
              <div className="p-4 bg-success/10 border-2 border-success/30 rounded-xl flex items-start gap-4">
                <CheckCircle2 className="w-10 h-10 text-success shrink-0" />
                <div>
                  <p className="font-bold text-lg text-success">{t.confidence}: {parsedResult.confidenceScore}%</p>
                  <p className="text-sm text-success/80">{language === 'hindi' ? 'घर पर इलाज कर सकते हैं' : language === 'bengali' ? 'বাড়িতে চিকিৎসা করা যায়' : 'Can be treated at home'}</p>
                </div>
              </div>
            ) : parsedResult.confidenceScore >= 30 ? (
              <div className="p-4 bg-warning/10 border-2 border-warning/30 rounded-xl flex items-start gap-4">
                <AlertTriangle className="w-10 h-10 text-warning shrink-0" />
                <div>
                  <p className="font-bold text-lg text-warning">{t.warning}</p>
                  <p className="text-sm text-warning/80">{language === 'hindi' ? 'डॉक्टर से मिलें' : language === 'bengali' ? 'ডাক্তার দেখান' : 'Please consult a vet'}</p>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-destructive/10 border-2 border-destructive/30 rounded-xl flex items-start gap-4">
                <AlertCircle className="w-10 h-10 text-destructive shrink-0" />
                <div>
                  <p className="font-bold text-lg text-destructive">{t.emergency}</p>
                  <p className="text-sm text-destructive/80">{language === 'hindi' ? 'तुरंत डॉक्टर को बुलाएं' : language === 'bengali' ? 'এখনই ডাক্তার ডাকুন' : 'Call vet immediately'}</p>
                </div>
              </div>
            )}

            {/* Disease Name */}
            <Card className="border-2 border-border">
              <CardHeader className="pb-2">
                <CardDescription className="text-base">{t.disease}</CardDescription>
                <CardTitle className="text-2xl text-primary">{parsedResult.diseaseIdentification}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">{parsedResult.diseaseDetails?.description}</p>
              </CardContent>
            </Card>

            {/* Medicines */}
            {parsedResult.prescription?.medicines?.length > 0 && (
              <Card className="border-2 border-primary/30 bg-primary/5">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Pill className="w-6 h-6 text-primary" />
                    {t.medicines}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {parsedResult.prescription.medicines.map((med: { name: string; dosage: string; instructions: string }, idx: number) => (
                    <div key={idx} className="bg-card p-4 rounded-xl border border-border">
                      <p className="font-bold text-foreground text-lg">{med.name}</p>
                      <p className="text-primary font-semibold">{med.dosage}</p>
                      <p className="text-sm text-muted-foreground mt-1">{med.instructions}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Care Steps */}
            {parsedResult.prescription?.careSteps?.length > 0 && (
              <Card className="border-2 border-accent/30 bg-accent/5">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Heart className="w-6 h-6 text-accent" />
                    {t.careSteps}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {parsedResult.prescription.careSteps.map((step: string, idx: number) => (
                    <div key={idx} className="flex items-start gap-4 bg-card p-4 rounded-xl border border-border">
                      <div className="w-8 h-8 bg-accent text-accent-foreground rounded-full flex items-center justify-center font-bold shrink-0">
                        {idx + 1}
                      </div>
                      <p className="text-foreground leading-relaxed">{step}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Emergency Contact */}
            {parsedResult.recommendHumanVet && (
              <a
                href="tel:1800-180-1551"
                className="flex items-center justify-center gap-3 w-full h-16 bg-destructive text-destructive-foreground rounded-xl font-bold text-lg"
              >
                <Phone className="w-6 h-6" />
                {language === 'hindi' ? 'पशु हेल्पलाइन: 1800-180-1551' : language === 'bengali' ? 'পশু হেল্পলাইন: 1800-180-1551' : 'Animal Helpline: 1800-180-1551'}
              </a>
            )}
          </div>
        ) : result ? (
          <div className="prose prose-sm max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {result}
            </ReactMarkdown>
          </div>
        ) : null}
      </main>

      {/* Bottom Action */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t-2 border-border safe-area-bottom">
        <div className="max-w-lg mx-auto flex gap-3">
          <Button
            variant="outline"
            className="flex-1 h-14 text-base font-semibold"
            onClick={() => {
              stopSpeaking();
              resetCapture();
              setCurrentScreen('home');
            }}
          >
            <HomeIcon className="w-5 h-5 mr-2" />
            {language === 'hindi' ? 'होम' : language === 'bengali' ? 'হোম' : 'Home'}
          </Button>
          <Button
            className="flex-1 h-14 text-base font-semibold"
            onClick={() => {
              stopSpeaking();
              setFile(null);
              setPreviewUrl(null);
              setSymptoms("");
              setResult(null);
              setParsedResult(null);
              setCurrentScreen('capture');
            }}
          >
            <RefreshCw className="w-5 h-5 mr-2" />
            {t.newDiagnosis}
          </Button>
        </div>
      </div>
    </div>
  );

  // History Screen
  const renderHistoryScreen = () => (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-primary text-primary-foreground p-4 safe-area-top">
        <div className="flex items-center gap-4 max-w-lg mx-auto">
          <Button
            variant="ghost"
            size="icon"
            className="text-primary-foreground hover:bg-primary-foreground/20"
            onClick={() => setCurrentScreen('home')}
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-xl font-bold">{t.myCases}</h1>
        </div>
      </header>

      <main className="flex-1 p-4 max-w-lg mx-auto w-full overflow-y-auto">
        <AccessibleCaseDashboard
          cases={cases}
          language={language}
          translations={t}
          onStartNew={() => {
            resetCapture();
            setCurrentScreen('home');
          }}
          onViewCase={(caseId) => {
            setActiveCaseId(caseId);
            setCurrentScreen('timeline');
          }}
          onDeleteCase={handleDeleteCase}
        />
      </main>
    </div>
  );

  // Timeline Screen
  const renderTimelineScreen = () => {
    const activeCase = cases.find(c => c.caseId === activeCaseId);
    if (!activeCase) return null;

    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="bg-primary text-primary-foreground p-4 safe-area-top">
          <div className="flex items-center gap-4 max-w-lg mx-auto">
            <Button
              variant="ghost"
              size="icon"
              className="text-primary-foreground hover:bg-primary-foreground/20"
              onClick={() => {
                setActiveCaseId(null);
                setCurrentScreen('history');
              }}
            >
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <div className="flex-1">
              <h1 className="text-xl font-bold">{activeCase.animalName !== "Unknown" ? activeCase.animalName : language === 'hindi' ? 'अनाम जानवर' : language === 'bengali' ? 'নামহীন পশু' : 'Unnamed Animal'}</h1>
              <p className="text-sm opacity-90">{activeCase.records.length} {t.visit}</p>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 max-w-lg mx-auto w-full overflow-y-auto pb-24">
          <AccessibleCaseTimeline
            caseData={activeCase}
            language={language}
            translations={t}
            onDeleteRecord={handleDeleteRecord}
          />
        </main>

        {/* Bottom Action */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t-2 border-border safe-area-bottom">
          <div className="max-w-lg mx-auto">
            <Button
              className="w-full h-14 text-base font-semibold"
              onClick={() => {
                resetCapture();
                setAnimalName(activeCase.animalName !== "Unknown" ? activeCase.animalName : "");
                setCurrentScreen('capture');
              }}
            >
              <Camera className="w-5 h-5 mr-2" />
              {t.followUp}
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // Settings Screen
  const renderSettingsScreen = () => (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-primary text-primary-foreground p-4 safe-area-top">
        <div className="flex items-center gap-4 max-w-lg mx-auto">
          <Button
            variant="ghost"
            size="icon"
            className="text-primary-foreground hover:bg-primary-foreground/20"
            onClick={() => setCurrentScreen('home')}
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-xl font-bold">{t.settings}</h1>
        </div>
      </header>

      <main className="flex-1 p-4 max-w-lg mx-auto w-full">
        <div className="space-y-4">
          {/* Language Selection */}
          <Card className="border-2 border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Languages className="w-5 h-5 text-primary" />
                {t.language}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={language} onValueChange={(v) => handleLanguageChange(v as Language)}>
                <SelectTrigger className="w-full h-14 text-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hindi" className="text-lg py-3">हिंदी (Hindi)</SelectItem>
                  <SelectItem value="english" className="text-lg py-3">English</SelectItem>
                  <SelectItem value="bengali" className="text-lg py-3">বাংলা (Bengali)</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Usage Stats */}
          <Card className="border-2 border-border">
            <CardHeader>
              <CardTitle className="text-base">{language === 'hindi' ? 'उपयोग आँकड़े' : language === 'bengali' ? 'ব্যবহারের পরিসংখ্যান' : 'Usage Stats'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-primary/10 p-4 rounded-xl text-center">
                  <p className="text-3xl font-bold text-primary">{usageLogs.length}</p>
                  <p className="text-sm text-muted-foreground">{language === 'hindi' ? 'कुल जाँच' : language === 'bengali' ? 'মোট পরীক্ষা' : 'Total Scans'}</p>
                </div>
                <div className="bg-accent/20 p-4 rounded-xl text-center">
                  <p className="text-3xl font-bold text-accent">{cases.length}</p>
                  <p className="text-sm text-muted-foreground">{language === 'hindi' ? 'जानवर' : language === 'bengali' ? 'পশু' : 'Animals'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Help Contact */}
          <a
            href="tel:1800-180-1551"
            className="flex items-center gap-4 p-5 bg-card border-2 border-border rounded-xl"
          >
            <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center">
              <Phone className="w-6 h-6 text-destructive" />
            </div>
            <div>
              <p className="font-bold text-foreground">{language === 'hindi' ? 'पशु हेल्पलाइन' : language === 'bengali' ? 'পশু হেল্পলাইন' : 'Animal Helpline'}</p>
              <p className="text-primary font-semibold">1800-180-1551</p>
            </div>
          </a>

          {/* Account Info */}
          <Card className="border-2 border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="w-5 h-5 text-primary" />
                {t.account}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">{t.loggedInAs}</p>
                    <p className="text-sm font-semibold text-foreground truncate">
                      {user?.signInDetails?.loginId || user?.username || userId}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Logout Button */}
          <Button
            variant="destructive"
            className="w-full h-16 text-lg font-bold"
            onClick={() => setShowLogoutDialog(true)}
          >
            <LogOut className="w-6 h-6 mr-3" />
            {t.logout}
          </Button>
        </div>
      </main>
    </div>
  );

  const handleLogout = () => {
    if (signOut) {
      signOut();
      // Clear local state
      setHistory([]);
      setCases([]);
      setUsageLogs([]);
      setActiveCaseId(null);
      setFile(null);
      setPreviewUrl(null);
      setResult(null);
      setParsedResult(null);
      setShowLogoutDialog(false);
    }
  };

  // Render current screen
  return (
    <>
      {/* Logout Confirmation Dialog */}
      <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl">
              <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center">
                <LogOut className="w-6 h-6 text-destructive" />
              </div>
              {t.confirmLogout}
            </DialogTitle>
            <DialogDescription className="text-base pt-4">
              {t.logoutConfirm}
              <br />
              <span className="text-muted-foreground text-sm mt-2 block">
                {t.logoutWarning}
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              className="w-full sm:w-auto h-12 text-base"
              onClick={() => setShowLogoutDialog(false)}
            >
              {t.cancel}
            </Button>
            <Button
              variant="destructive"
              className="w-full sm:w-auto h-12 text-base font-semibold"
              onClick={handleLogout}
            >
              <LogOut className="w-5 h-5 mr-2" />
              {t.logout}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Render Screen */}
      {!user ? (
        // Show loading while checking authentication
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      ) : (
        (() => {
          switch (currentScreen) {
            case 'capture':
              return renderCaptureScreen();
            case 'result':
              return renderResultScreen();
            case 'history':
              return renderHistoryScreen();
            case 'timeline':
              return renderTimelineScreen();
            case 'settings':
              return renderSettingsScreen();
            default:
              return renderHomeScreen();
          }
        })()
      )}
    </>
  );
}
