"use client";

import { Activity, AlertTriangle, CheckCircle2, ChevronRight, Clock, Plus, ImageIcon, Trash2 } from "lucide-react";
import { Case } from "@/app/app/page";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface CaseDashboardProps {
    cases: Case[];
    onStartNew: () => void;
    onViewCase: (caseId: string) => void;
    onDeleteCase?: (caseId: string) => void;
}

export function CaseDashboard({ cases, onStartNew, onViewCase, onDeleteCase }: CaseDashboardProps) {
    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">My Animals & Cases</h2>
                    <p className="text-sm text-gray-500 mt-1">Select a case to view its medical timeline or add follow-up media.</p>
                </div>
                <button
                    onClick={onStartNew}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-md hover:shadow-lg w-full sm:w-auto justify-center"
                >
                    <Plus className="w-5 h-5" />
                    Start New Case
                </button>
            </div>

            {cases.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm text-blue-500">
                        <Activity className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-700 mb-2">No active cases found</h3>
                    <p className="text-gray-500 text-center max-w-sm mb-6">Upload an image or video to get your first veterinary diagnosis.</p>
                    <button
                        onClick={onStartNew}
                        className="flex items-center gap-2 bg-white border border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-blue-700 px-6 py-2.5 rounded-lg font-semibold transition-all"
                    >
                        Create First Case
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {cases.map((c) => {
                        const latestRecord = c.records[c.records.length - 1];
                        let displayTitle = latestRecord?.diagnosis ? (latestRecord.diagnosis.split('\n').find(line => line.length > 20) || "Diagnosis record") : "Unknown case";
                        try {
                            const parsed = JSON.parse(latestRecord.diagnosis);
                            displayTitle = parsed.diseaseIdentification || displayTitle;
                        } catch { }

                        return (
                            <div
                                key={c.caseId}
                                className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden group flex flex-col h-full"
                                onClick={() => onViewCase(c.caseId)}
                            >
                                <div className="p-5 flex-grow">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            {latestRecord?.thumbnailBase64 ? (
                                                /* eslint-disable-next-line @next/next/no-img-element */
                                                <img src={latestRecord.thumbnailBase64} alt="Thumb" className="w-12 h-12 rounded-xl object-cover border border-gray-100 shadow-sm" />
                                            ) : (
                                                <div className="w-12 h-12 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center">
                                                    <ImageIcon className="w-6 h-6 text-gray-400" />
                                                </div>
                                            )}
                                            <div>
                                                <h3 className="font-bold text-gray-900 line-clamp-1">{c.animalName !== "Unknown" ? `"${c.animalName}"` : "Unnamed Animal"}</h3>
                                                <span className="text-[10px] uppercase tracking-wider font-extrabold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full inline-block mt-1">
                                                    {c.subjectType}
                                                </span>
                                            </div>
                                        </div>

                                        {onDeleteCase && (
                                            <div onClick={(e) => e.stopPropagation()}>
                                                <Dialog>
                                                    <DialogTrigger asChild>
                                                        <button
                                                            className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                                            title="Delete entire case file"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </DialogTrigger>
                                                    <DialogContent>
                                                        <DialogHeader>
                                                            <DialogTitle>Delete Case File?</DialogTitle>
                                                            <DialogDescription>
                                                                Are you sure you want to permanently delete {c.animalName !== "Unknown" ? `"${c.animalName}"'s` : "this animal's"} entire medical record? This action cannot be undone.
                                                            </DialogDescription>
                                                        </DialogHeader>
                                                        <div className="flex justify-end gap-3 mt-4">
                                                            {/* Dialog close will be handled externally or via standard Esc/Click outside, but for simplicity we just render standard buttons. Using primitive dialog close may require extra imports, so a simple button trigger context or just providing the delete action is enough */}
                                                            <button
                                                                className="px-4 py-2 bg-red-600 text-white rounded-md font-semibold hover:bg-red-700 w-full"
                                                                onClick={() => onDeleteCase(c.caseId)}
                                                            >
                                                                Yes, Delete All Records
                                                            </button>
                                                        </div>
                                                    </DialogContent>
                                                </Dialog>
                                            </div>
                                        )}
                                    </div>

                                    <div className="mb-4">
                                        <p className="text-sm font-semibold text-gray-700 line-clamp-2">{displayTitle}</p>
                                        <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-2">
                                            <Clock className="w-3.5 h-3.5" />
                                            Last updated: {new Date(c.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                        </div>
                                    </div>
                                </div>

                                <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between group-hover:bg-blue-50 transition-colors">
                                    <div className="flex items-center gap-2">
                                        {c.latestStatus === "improving" ? (
                                            <span className="flex items-center text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-1 rounded-md">
                                                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Improving
                                            </span>
                                        ) : c.latestStatus === "worsening" ? (
                                            <span className="flex items-center text-xs font-bold text-rose-700 bg-rose-100 px-2 py-1 rounded-md">
                                                <AlertTriangle className="w-3.5 h-3.5 mr-1" /> Worsening
                                            </span>
                                        ) : (
                                            <span className="flex items-center text-xs font-semibold text-gray-600">
                                                {c.records.length} interactions
                                            </span>
                                        )}
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
