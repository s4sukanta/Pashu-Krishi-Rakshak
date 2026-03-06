"use client";

import { 
  Heart, 
  Plus, 
  ChevronRight, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Trash2,
  Stethoscope
} from "lucide-react";
import { Case } from "@/app/page";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface AccessibleCaseDashboardProps {
  cases: Case[];
  language: string;
  translations: {
    noHistory: string;
    startFirst: string;
    newDiagnosis: string;
    viewCase: string;
    deleteCase: string;
    improving: string;
    worsening: string;
    stable: string;
    visit: string;
    myCases: string;
  };
  onStartNew: () => void;
  onViewCase: (caseId: string) => void;
  onDeleteCase?: (caseId: string) => void;
}

export function AccessibleCaseDashboard({ 
  cases, 
  language,
  translations: t,
  onStartNew, 
  onViewCase, 
  onDeleteCase 
}: AccessibleCaseDashboardProps) {
  
  const getStatusText = (status: string) => {
    switch (status) {
      case 'improving':
        return t.improving;
      case 'worsening':
        return t.worsening;
      default:
        return t.stable;
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const options: Intl.DateTimeFormatOptions = { 
      day: 'numeric', 
      month: 'short',
      year: 'numeric'
    };
    return date.toLocaleDateString(
      language === 'hindi' ? 'hi-IN' : language === 'bengali' ? 'bn-IN' : 'en-IN',
      options
    );
  };

  if (cases.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
          <Heart className="w-12 h-12 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-bold text-foreground mb-2 text-center">{t.noHistory}</h3>
        <p className="text-muted-foreground text-center mb-8 text-lg">{t.startFirst}</p>
        <Button
          onClick={onStartNew}
          className="h-14 px-8 text-lg font-semibold rounded-xl"
        >
          <Plus className="w-6 h-6 mr-2" />
          {t.newDiagnosis}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* New Case Button */}
      <Button
        onClick={onStartNew}
        className="w-full h-16 text-lg font-bold rounded-xl mb-6"
      >
        <Plus className="w-6 h-6 mr-3" />
        {t.newDiagnosis}
      </Button>

      {/* Case List */}
      <div className="space-y-3">
        {cases.map((c) => {
          const latestRecord = c.records[c.records.length - 1];
          let displayTitle = language === 'hindi' ? 'जाँच रिकॉर्ड' : language === 'bengali' ? 'পরীক্ষার রেকর্ড' : 'Diagnosis Record';
          
          try {
            const parsed = JSON.parse(latestRecord?.diagnosis || '{}');
            displayTitle = parsed.diseaseIdentification || displayTitle;
          } catch { }

          return (
            <div
              key={c.caseId}
              className="bg-card rounded-2xl border-2 border-border overflow-hidden shadow-sm hover:shadow-md transition-all"
            >
              {/* Main Card Content - Clickable */}
              <button
                className="w-full p-4 flex items-center gap-4 text-left active:bg-muted/50 transition-colors"
                onClick={() => onViewCase(c.caseId)}
              >
                {/* Thumbnail */}
                {latestRecord?.thumbnailBase64 ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img 
                    src={latestRecord.thumbnailBase64} 
                    alt="" 
                    className="w-16 h-16 rounded-xl object-cover border-2 border-border shrink-0" 
                  />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-muted border-2 border-border flex items-center justify-center shrink-0">
                    <Stethoscope className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg text-foreground truncate">
                    {c.animalName !== "Unknown" ? c.animalName : language === 'hindi' ? 'अनाम जानवर' : language === 'bengali' ? 'নামহীন পশু' : 'Unnamed Animal'}
                  </h3>
                  <p className="text-sm text-muted-foreground truncate">{displayTitle}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{formatDate(c.updatedAt)}</span>
                  </div>
                </div>

                <ChevronRight className="w-6 h-6 text-muted-foreground shrink-0" />
              </button>

              {/* Status Bar */}
              <div className="px-4 py-3 bg-muted/50 border-t border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {c.latestStatus === "improving" ? (
                    <div className="flex items-center gap-2 text-success">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="text-sm font-semibold">{t.improving}</span>
                    </div>
                  ) : c.latestStatus === "worsening" ? (
                    <div className="flex items-center gap-2 text-destructive">
                      <AlertTriangle className="w-5 h-5" />
                      <span className="text-sm font-semibold">{t.worsening}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      {c.records.length} {t.visit}
                    </span>
                  )}
                </div>

                {/* Delete Button */}
                {onDeleteCase && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <button
                        className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </DialogTrigger>
                    <DialogContent className="max-w-sm mx-4">
                      <DialogHeader>
                        <DialogTitle className="text-xl">
                          {language === 'hindi' ? 'रिकॉर्ड हटाएं?' : language === 'bengali' ? 'রেকর্ড মুছবেন?' : 'Delete Record?'}
                        </DialogTitle>
                        <DialogDescription className="text-base">
                          {language === 'hindi' 
                            ? `क्या आप "${c.animalName !== "Unknown" ? c.animalName : 'इस जानवर'}" का पूरा रिकॉर्ड हटाना चाहते हैं?` 
                            : language === 'bengali'
                            ? `আপনি কি "${c.animalName !== "Unknown" ? c.animalName : 'এই পশুর'}" সম্পূর্ণ রেকর্ড মুছতে চান?`
                            : `Are you sure you want to delete all records for "${c.animalName !== "Unknown" ? c.animalName : 'this animal'}"?`}
                        </DialogDescription>
                      </DialogHeader>
                      <Button
                        variant="destructive"
                        className="w-full h-14 text-lg font-semibold mt-4"
                        onClick={() => onDeleteCase(c.caseId)}
                      >
                        <Trash2 className="w-5 h-5 mr-2" />
                        {t.deleteCase}
                      </Button>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
