"use client";

import { 
  Activity, 
  AlertCircle, 
  AlertTriangle, 
  CheckCircle2, 
  ChevronDown,
  Pill,
  Heart,
  Trash2,
  Stethoscope,
  Volume2
} from "lucide-react";
import { Case, DiagnosisRecord } from "@/app/page";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface AccessibleCaseTimelineProps {
  caseData: Case;
  language: string;
  translations: {
    disease: string;
    confidence: string;
    medicines: string;
    careSteps: string;
    warning: string;
    emergency: string;
    deleteCase: string;
    improving: string;
    worsening: string;
    stable: string;
    visit: string;
  };
  onDeleteRecord?: (timestamp: string) => void;
}

export function AccessibleCaseTimeline({ 
  caseData, 
  language,
  translations: t,
  onDeleteRecord 
}: AccessibleCaseTimelineProps) {
  const [expandedRecord, setExpandedRecord] = useState<string | null>(
    caseData.records[caseData.records.length - 1]?.id || null
  );

  const toggleExpand = (id: string) => {
    setExpandedRecord(expandedRecord === id ? null : id);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const options: Intl.DateTimeFormatOptions = { 
      day: 'numeric', 
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return date.toLocaleDateString(
      language === 'hindi' ? 'hi-IN' : language === 'bengali' ? 'bn-IN' : 'en-IN',
      options
    );
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language === 'hindi' ? 'hi-IN' : language === 'bengali' ? 'bn-IN' : 'en-IN';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  const reversedRecords = [...caseData.records].reverse();

  return (
    <div className="space-y-4">
      {/* Timeline */}
      <div className="relative">
        {/* Timeline Line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />

        {reversedRecords.map((record, renderIndex) => {
          let isJson = false;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let parsedResult: any = null;
          let displayTitle = language === 'hindi' ? 'जाँच रिकॉर्ड' : language === 'bengali' ? 'পরীক্ষার রেকর্ড' : 'Diagnosis Record';

          try {
            parsedResult = JSON.parse(record.diagnosis);
            isJson = true;
            displayTitle = parsedResult.diseaseIdentification || displayTitle;
          } catch {
            displayTitle = record.diagnosis.split('\n').find(line => line.length > 20) || displayTitle;
          }

          const isExpanded = expandedRecord === record.id;
          const isLatest = renderIndex === 0;
          const actualVisitNumber = caseData.records.length - renderIndex;

          return (
            <div key={record.id} className="relative pl-14 pb-6">
              {/* Timeline Dot */}
              <div 
                className={`absolute left-4 w-5 h-5 rounded-full border-4 border-background ${
                  isLatest ? 'bg-primary' : 'bg-muted-foreground'
                }`}
              />

              {/* Card */}
              <div 
                className={`bg-card rounded-2xl border-2 overflow-hidden transition-all ${
                  isExpanded ? 'border-primary shadow-md' : 'border-border shadow-sm'
                }`}
              >
                {/* Header - Always Visible */}
                <button
                  className="w-full p-4 flex items-start gap-3 text-left active:bg-muted/50 transition-colors"
                  onClick={() => toggleExpand(record.id)}
                >
                  {/* Thumbnail */}
                  {record.thumbnailBase64 ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img 
                      src={record.thumbnailBase64} 
                      alt="" 
                      className="w-14 h-14 rounded-xl object-cover border border-border shrink-0" 
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-muted border border-border flex items-center justify-center shrink-0">
                      <Stethoscope className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    {/* Visit Badge */}
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                        {t.visit} {actualVisitNumber}
                      </span>
                      {isLatest && (
                        <span className="text-xs font-bold text-success bg-success/10 px-2 py-0.5 rounded-full">
                          {language === 'hindi' ? 'नवीनतम' : language === 'bengali' ? 'সাম্প্রতিক' : 'Latest'}
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="font-bold text-foreground leading-tight">{displayTitle}</h3>

                    {/* Date */}
                    <p className="text-sm text-muted-foreground mt-1">{formatDate(record.timestamp)}</p>

                    {/* Status Badge */}
                    {isJson && parsedResult?.followUpAssessment?.status && parsedResult.followUpAssessment.status !== "not_applicable" && (
                      <div className="mt-2">
                        {parsedResult.followUpAssessment.status === "improving" ? (
                          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-success bg-success/10 px-2 py-1 rounded-full">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {t.improving}
                          </div>
                        ) : parsedResult.followUpAssessment.status === "worsening" ? (
                          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-destructive bg-destructive/10 px-2 py-1 rounded-full">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            {t.worsening}
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded-full">
                            <Activity className="w-3.5 h-3.5" />
                            {t.stable}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <ChevronDown 
                    className={`w-6 h-6 text-muted-foreground transition-transform shrink-0 ${
                      isExpanded ? 'rotate-180' : ''
                    }`} 
                  />
                </button>

                {/* Expanded Content */}
                {isExpanded && isJson && parsedResult && (
                  <div className="border-t border-border p-4 space-y-4">
                    {/* Speak Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => speakText(`${t.disease}: ${parsedResult.diseaseIdentification}. ${parsedResult.diseaseDetails?.description || ''}`)}
                    >
                      <Volume2 className="w-4 h-4 mr-2" />
                      {language === 'hindi' ? 'सुनें' : language === 'bengali' ? 'শুনুন' : 'Listen'}
                    </Button>

                    {/* Confidence/Warning Banner */}
                    {parsedResult.recommendHumanVet || parsedResult.confidenceScore < 60 ? (
                      <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-xl flex items-start gap-3">
                        <AlertCircle className="w-6 h-6 text-destructive shrink-0" />
                        <div>
                          <p className="font-bold text-destructive">{t.warning}</p>
                          <p className="text-sm text-destructive/80">
                            {language === 'hindi' ? 'डॉक्टर से सलाह लें' : language === 'bengali' ? 'ডাক্তারের পরামর্শ নিন' : 'Consult a veterinarian'}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-success/10 border border-success/30 rounded-xl flex items-start gap-3">
                        <CheckCircle2 className="w-6 h-6 text-success shrink-0" />
                        <div>
                          <p className="font-bold text-success">{t.confidence}: {parsedResult.confidenceScore}%</p>
                        </div>
                      </div>
                    )}

                    {/* Disease Description */}
                    <div className="bg-muted/50 p-4 rounded-xl">
                      <p className="text-sm text-muted-foreground mb-1">{t.disease}</p>
                      <p className="font-semibold text-foreground">{parsedResult.diseaseIdentification}</p>
                      {parsedResult.diseaseDetails?.description && (
                        <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                          {parsedResult.diseaseDetails.description}
                        </p>
                      )}
                    </div>

                    {/* Medicines */}
                    {parsedResult.prescription?.medicines?.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-primary font-semibold">
                          <Pill className="w-5 h-5" />
                          {t.medicines}
                        </div>
                        <div className="space-y-2">
                          {parsedResult.prescription.medicines.map((med: { name: string; dosage: string; instructions: string }, idx: number) => (
                            <div key={idx} className="bg-primary/5 border border-primary/20 p-3 rounded-xl">
                              <p className="font-bold text-foreground">{med.name}</p>
                              <p className="text-sm text-primary font-medium">{med.dosage}</p>
                              {med.instructions && (
                                <p className="text-xs text-muted-foreground mt-1">{med.instructions}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Care Steps */}
                    {parsedResult.prescription?.careSteps?.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-accent font-semibold">
                          <Heart className="w-5 h-5" />
                          {t.careSteps}
                        </div>
                        <div className="space-y-2">
                          {parsedResult.prescription.careSteps.map((step: string, idx: number) => (
                            <div key={idx} className="flex items-start gap-3 bg-accent/10 border border-accent/20 p-3 rounded-xl">
                              <div className="w-6 h-6 bg-accent text-accent-foreground rounded-full flex items-center justify-center text-sm font-bold shrink-0">
                                {idx + 1}
                              </div>
                              <p className="text-sm text-foreground leading-relaxed">{step}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Delete Button */}
                    {onDeleteRecord && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" className="w-full text-muted-foreground hover:text-destructive">
                            <Trash2 className="w-4 h-4 mr-2" />
                            {language === 'hindi' ? 'यह रिकॉर्ड हटाएं' : language === 'bengali' ? 'এই রেকর্ড মুছুন' : 'Delete this record'}
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-sm mx-4">
                          <DialogHeader>
                            <DialogTitle className="text-xl">
                              {language === 'hindi' ? 'रिकॉर्ड हटाएं?' : language === 'bengali' ? 'রেকর্ড মুছবেন?' : 'Delete Record?'}
                            </DialogTitle>
                            <DialogDescription className="text-base">
                              {language === 'hindi' 
                                ? `क्या आप Visit ${actualVisitNumber} का रिकॉर्ड हटाना चाहते हैं?` 
                                : language === 'bengali'
                                ? `আপনি কি Visit ${actualVisitNumber} এর রেকর্ড মুছতে চান?`
                                : `Are you sure you want to delete Visit ${actualVisitNumber}?`}
                            </DialogDescription>
                          </DialogHeader>
                          <Button
                            variant="destructive"
                            className="w-full h-14 text-lg font-semibold mt-4"
                            onClick={() => onDeleteRecord(record.timestamp)}
                          >
                            <Trash2 className="w-5 h-5 mr-2" />
                            {t.deleteCase}
                          </Button>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                )}

                {/* Expanded Content for Non-JSON */}
                {isExpanded && !isJson && (
                  <div className="border-t border-border p-4">
                    <div className="prose prose-sm max-w-none">
                      <p className="text-foreground whitespace-pre-wrap">{record.diagnosis}</p>
                    </div>

                    {/* Delete Button */}
                    {onDeleteRecord && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" className="w-full mt-4 text-muted-foreground hover:text-destructive">
                            <Trash2 className="w-4 h-4 mr-2" />
                            {language === 'hindi' ? 'यह रिकॉर्ड हटाएं' : language === 'bengali' ? 'এই রেকর্ড মুছুন' : 'Delete this record'}
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-sm mx-4">
                          <DialogHeader>
                            <DialogTitle className="text-xl">
                              {language === 'hindi' ? 'रिकॉर्ड हटाएं?' : language === 'bengali' ? 'রেকর্ড মুছবেন?' : 'Delete Record?'}
                            </DialogTitle>
                            <DialogDescription className="text-base">
                              {language === 'hindi' 
                                ? `क्या आप Visit ${actualVisitNumber} का रिकॉर्ड हटाना चाहते हैं?` 
                                : language === 'bengali'
                                ? `আপনি কি Visit ${actualVisitNumber} এর রেকর্ড মুছতে চান?`
                                : `Are you sure you want to delete Visit ${actualVisitNumber}?`}
                            </DialogDescription>
                          </DialogHeader>
                          <Button
                            variant="destructive"
                            className="w-full h-14 text-lg font-semibold mt-4"
                            onClick={() => onDeleteRecord(record.timestamp)}
                          >
                            <Trash2 className="w-5 h-5 mr-2" />
                            {t.deleteCase}
                          </Button>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
