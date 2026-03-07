"use client";

import { Activity, AlertCircle, AlertTriangle, ArrowLeft, CheckCircle2, ChevronDown, RefreshCw, MapPin, ImageIcon, Trash2 } from "lucide-react";
import { Case, DiagnosisRecord } from "@/app/app/page";
import { useState } from "react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface CaseTimelineProps {
    caseData: Case;
    onBack: () => void;
    onFollowUp?: () => void;
    uploadForm?: React.ReactNode;
    onDeleteRecord?: (timestamp: string) => void;
}

export function CaseTimeline({ caseData, onBack, onFollowUp, uploadForm, onDeleteRecord }: CaseTimelineProps) {
    const [expandedRecord, setExpandedRecord] = useState<string | null>(caseData.records[caseData.records.length - 1]?.id || null);

    const toggleExpand = (id: string) => {
        setExpandedRecord(expandedRecord === id ? null : id);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 sticky top-4 z-10">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors shrink-0"
                    >
                        <ArrowLeft className="w-6 h-6 text-gray-600" />
                    </button>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">
                            {caseData.animalName !== "Unknown" ? `Case File: "${caseData.animalName}"` : "Unnamed Animal Case"}
                        </h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] uppercase tracking-wider font-extrabold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full inline-block">
                                {caseData.subjectType}
                            </span>
                            <span className="text-xs font-semibold text-gray-500">
                                {caseData.records.length} total visits
                            </span>
                        </div>
                    </div>
                </div>

                {onFollowUp && !uploadForm && (
                    <button
                        onClick={onFollowUp}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-md hover:shadow-lg w-full sm:w-auto justify-center"
                    >
                        <RefreshCw className="w-5 h-5" />
                        Upload Follow Up
                    </button>
                )}
            </div>

            {/* Timeline */}
            <div className="relative border-l-2 border-blue-100 ml-4 md:ml-8 pl-6 md:pl-10 space-y-10 py-4">

                {/* Inline Upload Form Slot */}
                {uploadForm && (
                    <div className="relative">
                        {/* Timeline Dot */}
                        <div className="absolute -left-[37px] md:-left-[51px] w-6 h-6 rounded-full border-4 border-white shadow-sm bg-blue-600"></div>

                        <div className="bg-white rounded-2xl border-2 border-blue-200 shadow-lg ring-4 ring-blue-50 transition-all overflow-hidden p-1">
                            {uploadForm}
                        </div>
                    </div>
                )}

                {[...caseData.records].reverse().map((record, renderIndex) => {
                    let isJson = false;
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    let parsedResult: any = null;
                    let displayTitle = "Historical Record";

                    try {
                        parsedResult = JSON.parse(record.diagnosis);
                        isJson = true;
                        displayTitle = parsedResult.diseaseIdentification || displayTitle;
                    } catch {
                        displayTitle = record.diagnosis.split('\n').find(line => line.length > 20) || "Diagnosis record";
                    }

                    const isExpanded = expandedRecord === record.id;
                    const isLatest = renderIndex === 0 && !uploadForm;
                    const actualVisitNumber = caseData.records.length - renderIndex;

                    return (
                        <div key={record.id} className="relative">
                            {/* Timeline Dot */}
                            <div className={`absolute w-5 h-5 rounded-full border-4 border-white shadow-sm ${isLatest ? 'bg-blue-600 w-6 h-6 -left-[37px] md:-left-[51px]' : 'bg-gray-300 -left-[35px] md:-left-[49px]'}`}></div>

                            <div className={`bg-white rounded-2xl border ${isExpanded ? 'border-blue-300 shadow-md ring-2 ring-blue-50' : 'border-gray-200 shadow-sm hover:shadow-md'} transition-all overflow-hidden`}>

                                {/* Card Header Summary */}
                                <div
                                    className="p-4 sm:p-5 flex flex-col sm:flex-row gap-4 sm:items-start justify-between cursor-pointer select-none bg-gray-50 hover:bg-white transition-colors"
                                    onClick={() => toggleExpand(record.id)}
                                >
                                    <div className="flex items-start gap-4">
                                        {record.thumbnailBase64 ? (
                                            /* eslint-disable-next-line @next/next/no-img-element */
                                            <img src={record.thumbnailBase64} alt="Thumb" className="w-16 h-16 rounded-xl object-cover border border-gray-200 shadow-sm shrink-0" />
                                        ) : (
                                            <div className="w-16 h-16 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0">
                                                <ImageIcon className="w-6 h-6 text-gray-400" />
                                            </div>
                                        )}
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs font-bold text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full uppercase tracking-widest shrink-0">
                                                    Visit {actualVisitNumber}
                                                </span>
                                                <span className="text-sm font-semibold text-gray-600">
                                                    {new Date(record.timestamp).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <h3 className="font-bold text-lg text-gray-900 leading-tight">
                                                {displayTitle}
                                            </h3>

                                            {isJson && parsedResult?.followUpAssessment && parsedResult.followUpAssessment.status !== "not_applicable" && (
                                                <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded bg-gray-100 w-fit">
                                                    {parsedResult.followUpAssessment.status === "improving" ? (
                                                        <><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /><span className="text-emerald-800">Improving</span></>
                                                    ) : parsedResult.followUpAssessment.status === "worsening" ? (
                                                        <><AlertTriangle className="w-3.5 h-3.5 text-rose-600" /><span className="text-rose-800">Worsening</span></>
                                                    ) : (
                                                        <><Activity className="w-3.5 h-3.5 text-blue-600" /><span className="text-blue-800">Stable / Unchanged</span></>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex justify-end self-end sm:self-center mt-2 sm:mt-0 px-2 sm:px-0 gap-2 items-center">
                                        {onDeleteRecord && (
                                            <div onClick={(e) => { e.stopPropagation(); }}>
                                                <Dialog>
                                                    <DialogTrigger asChild>
                                                        <button
                                                            className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors mr-1"
                                                            title="Delete this visit"
                                                        >
                                                            <Trash2 className="w-5 h-5" />
                                                        </button>
                                                    </DialogTrigger>
                                                    <DialogContent>
                                                        <DialogHeader>
                                                            <DialogTitle>Delete Visit Record?</DialogTitle>
                                                            <DialogDescription>
                                                                Are you sure you want to permanently delete Visit {actualVisitNumber}? This will remove this specific diagnosis and its media. This cannot be undone.
                                                            </DialogDescription>
                                                        </DialogHeader>
                                                        <div className="flex justify-end gap-3 mt-4">
                                                            <button
                                                                className="px-4 py-2 bg-red-600 text-white rounded-md font-semibold hover:bg-red-700 w-full cursor-pointer"
                                                                onClick={() => onDeleteRecord(record.timestamp)}
                                                            >
                                                                Yes, Delete Visit
                                                            </button>
                                                        </div>
                                                    </DialogContent>
                                                </Dialog>
                                            </div>
                                        )}
                                        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`} />
                                    </div>
                                </div>

                                {/* Card Expanded Details */}
                                {isExpanded && (
                                    <div className="border-t border-gray-100 bg-white p-5 space-y-6">

                                        {!isJson ? (
                                            <div className="prose prose-sm max-w-none prose-blue">
                                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                    {record.diagnosis}
                                                </ReactMarkdown>
                                            </div>
                                        ) : (
                                            <div className="space-y-6">

                                                {/* Detailed Assessment Status */}
                                                {parsedResult.followUpAssessment && parsedResult.followUpAssessment.status !== "not_applicable" && (
                                                    <div className={`p-4 rounded-xl border flex items-start gap-3 ${parsedResult.followUpAssessment.status === "improving" ? "bg-emerald-50 border-emerald-200" :
                                                        parsedResult.followUpAssessment.status === "worsening" ? "bg-rose-50 border-rose-200" :
                                                            "bg-blue-50 border-blue-200"
                                                        }`}>
                                                        {parsedResult.followUpAssessment.status === "improving" ? (
                                                            <Activity className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                                                        ) : parsedResult.followUpAssessment.status === "worsening" ? (
                                                            <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
                                                        ) : (
                                                            <Activity className="w-6 h-6 text-blue-600 shrink-0 mt-0.5" />
                                                        )}
                                                        <div>
                                                            <p className={`font-bold capitalize ${parsedResult.followUpAssessment.status === "improving" ? "text-emerald-900" :
                                                                parsedResult.followUpAssessment.status === "worsening" ? "text-rose-900" :
                                                                    "text-blue-900"
                                                                }`}>
                                                                Assessment: {parsedResult.followUpAssessment.status}
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

                                                {/* Alert Banner for Severe */}
                                                {parsedResult.recommendHumanVet && (
                                                    <div className="p-4 bg-red-50 border border-red-300 rounded-xl flex items-start gap-3">
                                                        <AlertCircle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
                                                        <div>
                                                            <p className="font-bold text-red-900">VETERINARIAN CONSULT STRONGLY ADVISED</p>
                                                            <p className="text-sm text-red-800 mt-1">This condition requires immediate physical intervention or could not be confidently diagnosed visually.</p>
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                                                    {/* Left Column: Details & Care */}
                                                    <div className="space-y-6">
                                                        {/* Description */}
                                                        <div>
                                                            <h4 className="font-bold text-gray-900 border-b border-gray-100 pb-2 mb-3">Disease Details</h4>
                                                            <p className="text-sm text-gray-700 bg-gray-50 p-4 rounded-xl border border-gray-100 leading-relaxed shadow-inner">
                                                                {parsedResult.diseaseDetails?.description || "No description provided."}
                                                            </p>
                                                        </div>

                                                        {/* Care Steps */}
                                                        {parsedResult.prescription?.careSteps?.length > 0 && (
                                                            <div>
                                                                <h4 className="font-bold text-gray-900 border-b border-gray-100 pb-2 mb-3">Home Care Protocol</h4>
                                                                <ul className="space-y-3">
                                                                    {parsedResult.prescription.careSteps.map((step: string, idx: number) => (
                                                                        <li key={idx} className="flex flex-col sm:flex-row sm:items-start gap-3 bg-white p-3 border border-gray-100 rounded-xl shadow-sm">
                                                                            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center shrink-0 border border-blue-200 shadow-inner">
                                                                                {idx + 1}
                                                                            </div>
                                                                            <span className="text-sm text-gray-800 font-medium leading-relaxed">{step}</span>
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Right Column: Prescriptions */}
                                                    <div className="space-y-4">
                                                        <h4 className="font-bold text-gray-900 border-b border-gray-100 pb-2 mb-3">Prescription & Medications</h4>
                                                        {parsedResult.prescription?.medicines?.length > 0 ? (
                                                            <div className="space-y-4">
                                                                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                                                {parsedResult.prescription.medicines.map((med: any, idx: number) => (
                                                                    <div key={idx} className="p-4 border border-blue-200 bg-gradient-to-br from-blue-50 to-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
                                                                        <div className="flex justify-between items-start mb-3">
                                                                            <p className="font-bold text-xl text-blue-900 tracking-tight">{med.name}</p>
                                                                            {med.totalCostEstimate && (
                                                                                <span className="bg-white border border-blue-100 text-blue-800 text-xs font-extrabold px-2.5 py-1 rounded-md shadow-sm">
                                                                                    {med.totalCostEstimate}
                                                                                </span>
                                                                            )}
                                                                        </div>

                                                                        <div className="grid grid-cols-2 gap-2 mb-4 bg-white/60 p-2 rounded-lg border border-blue-100/50">
                                                                            <div className="flex flex-col gap-0.5">
                                                                                <span className="text-[10px] uppercase font-bold text-blue-400 tracking-wider">Dosage</span>
                                                                                <span className="text-sm font-semibold text-gray-700">{med.dosage}</span>
                                                                            </div>
                                                                            <div className="flex flex-col gap-0.5">
                                                                                <span className="text-[10px] uppercase font-bold text-blue-400 tracking-wider">Freq</span>
                                                                                <span className="text-sm font-semibold text-gray-700">{med.frequency}</span>
                                                                            </div>
                                                                            <div className="flex flex-col gap-0.5 col-span-2 mt-1">
                                                                                <span className="text-[10px] uppercase font-bold text-blue-400 tracking-wider">Duration</span>
                                                                                <span className="text-sm font-semibold text-gray-700">{med.duration}</span>
                                                                            </div>
                                                                        </div>

                                                                        <div className="flex justify-between items-center mt-2 border-t border-blue-100 pt-3">
                                                                            <div>
                                                                                {med.unitPriceEstimate && (
                                                                                    <p className="text-xs text-emerald-700 font-extrabold bg-emerald-50 px-2 py-1 rounded border border-emerald-100 inline-block">
                                                                                        {med.unitPriceEstimate}
                                                                                    </p>
                                                                                )}
                                                                            </div>
                                                                            {med.purchaseQuery && (
                                                                                <a
                                                                                    href={`https://www.google.com/search?tbm=shop&q=${encodeURIComponent(med.purchaseQuery)}`}
                                                                                    target="_blank"
                                                                                    rel="noreferrer"
                                                                                    className="text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors px-4 py-2 rounded-full shadow border border-blue-700"
                                                                                >
                                                                                    Buy Online
                                                                                </a>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 text-sm text-gray-500 italic text-center">
                                                                No medications prescribed. Follow home care protocol.
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                            </div>
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
