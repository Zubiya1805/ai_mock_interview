"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";

interface InterviewSetupProps {
    userName: string;
    userId?: string;
    onStartInterview: (setupData: InterviewSetupData) => void;
}

interface InterviewSetupData {
    interviewType: string;
    role: string;
    experienceLevel: string;
    companyName?: string;
    techStack?: string;
    duration: string; // Keep this as duration but use it for question count
    resumeFile?: File;
}

const InterviewSetup = ({ userName, userId, onStartInterview }: InterviewSetupProps) => {
    const [interviewType, setInterviewType] = useState("");
    const [role, setRole] = useState("");
    const [experienceLevel, setExperienceLevel] = useState("");
    const [companyName, setCompanyName] = useState("");
    const [techStack, setTechStack] = useState("");
    const [duration, setDuration] = useState("5"); // This will actually represent question count
    const [resumeFile, setResumeFile] = useState<File | null>(null);
    const [showTechStack, setShowTechStack] = useState(false);

    const handleInterviewTypeChange = (type: string) => {
        setInterviewType(type);

        // Show tech stack options only for technical interviews
        if (type === "Technical" || type === "Mixed") {
            setShowTechStack(true);
        } else {
            setShowTechStack(false);
            setTechStack(""); // Clear tech stack if not technical
        }
    };

    const handleResumeUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setResumeFile(file);
        }
    };

    const handleStartInterview = () => {
        if (!interviewType || !role || !experienceLevel || !duration) {
            alert("Please fill in all required fields");
            return;
        }

        if (showTechStack && !techStack) {
            alert("Please specify the tech stack for technical interview");
            return;
        }

        const setupData: InterviewSetupData = {
            interviewType,
            role,
            experienceLevel,
            companyName: companyName || undefined,
            techStack: showTechStack ? techStack : undefined,
            duration, // This will be the question count
            resumeFile: resumeFile || undefined,
        };

        onStartInterview(setupData);
    };

    const isFormValid = interviewType && role && experienceLevel && duration && (!showTechStack || techStack);

    return (
        <div className="max-w-md mx-auto bg-dark-200 rounded-2xl p-8 space-y-6">
            <div className="flex items-center gap-2 justify-center mb-6">
                <Image src="/logo.svg" alt="PrepWise Logo" width={38} height={32} />
                <h2 className="text-primary-100">PrepWise</h2>
            </div>

            <div className="text-center mb-8">
                <h1 className="text-2xl font-semibold text-white mb-2">Starting Your Interview</h1>
                <p className="text-light-100">Customize your mock interview to suit your needs.</p>
            </div>

            <div className="space-y-6">
                {/* Interview Type */}
                <div className="space-y-3">
                    <Label className="text-light-100 font-normal">What type of interview would you like to practice?</Label>
                    <div className="relative">
                        <select
                            value={interviewType}
                            onChange={(e) => handleInterviewTypeChange(e.target.value)}
                            className="w-full bg-dark-300 rounded-full min-h-12 px-5 text-light-100 border border-input focus:border-primary-200 focus:outline-none appearance-none cursor-pointer"
                        >
                            <option value="">Select interview type</option>
                            <option value="Technical">Technical</option>
                            <option value="Behavioral">Behavioral</option>
                            <option value="Mixed">Mixed (Technical + Behavioral)</option>
                        </select>
                        <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                            <svg className="w-4 h-4 text-light-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Role */}
                <div className="space-y-3">
                    <Label className="text-light-100 font-normal">What role are you focusing on?</Label>
                    <Input
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        placeholder="e.g., Frontend Developer, Product Manager"
                        className="bg-dark-300 rounded-full min-h-12 px-5 placeholder:text-light-400 border border-input focus:border-primary-200"
                    />
                </div>

                {/* Experience Level */}
                <div className="space-y-3">
                    <Label className="text-light-100 font-normal">What is your experience level?</Label>
                    <div className="relative">
                        <select
                            value={experienceLevel}
                            onChange={(e) => setExperienceLevel(e.target.value)}
                            className="w-full bg-dark-300 rounded-full min-h-12 px-5 text-light-100 border border-input focus:border-primary-200 focus:outline-none appearance-none cursor-pointer"
                        >
                            <option value="">Select experience level</option>
                            <option value="Entry Level">Entry Level</option>
                            <option value="Middle">Middle</option>
                            <option value="Senior">Senior</option>
                        </select>
                        <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                            <svg className="w-4 h-4 text-light-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Company Name */}
                <div className="space-y-3">
                    <Label className="text-light-100 font-normal">
                        Company Name <span className="text-light-400 text-sm">(Optional)</span>
                    </Label>
                    <Input
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="e.g., Google, Microsoft, Meta"
                        className="bg-dark-300 rounded-full min-h-12 px-5 placeholder:text-light-400 border border-input focus:border-primary-200"
                    />
                </div>

                {/* Tech Stack - Only show for Technical/Mixed interviews */}
                {showTechStack && (
                    <div className="space-y-3">
                        <Label className="text-light-100 font-normal">Which tech stack would you like to focus on?</Label>
                        <Input
                            value={techStack}
                            onChange={(e) => setTechStack(e.target.value)}
                            placeholder="e.g., React, Node.js, Python, MongoDB"
                            className="bg-dark-300 rounded-full min-h-12 px-5 placeholder:text-light-400 border border-input focus:border-primary-200"
                        />
                    </div>
                )}

                {/* Number of Questions (using duration field) */}
                <div className="space-y-3">
                    <Label className="text-light-100 font-normal">How many questions do you want me to generate?</Label>
                    <Input
                        type="number"
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        placeholder="e.g., 5"
                        min="1"
                        max="20"
                        className="bg-dark-300 rounded-full min-h-12 px-5 placeholder:text-light-400 border border-input focus:border-primary-200"
                    />
                </div>

                {/* Resume Upload */}
                <div className="space-y-3">
                    <Label className="text-light-100 font-normal">Resume (Optional)</Label>
                    <div className="relative">
                        <input
                            type="file"
                            accept=".pdf,.doc,.docx"
                            onChange={handleResumeUpload}
                            className="hidden"
                            id="resume-upload"
                        />
                        <label
                            htmlFor="resume-upload"
                            className="btn-upload flex min-h-14 w-full items-center justify-center gap-2 rounded-full cursor-pointer hover:bg-dark-300/80 transition-colors"
                        >
                            <svg className="w-5 h-5 text-primary-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            <span className="text-primary-200">
                {resumeFile ? resumeFile.name : "Upload an image"}
              </span>
                        </label>
                    </div>
                </div>

                {/* Start Interview Button */}
                <Button
                    onClick={handleStartInterview}
                    disabled={!isFormValid}
                    className="w-full bg-primary-200 text-dark-100 hover:bg-primary-200/80 rounded-full min-h-12 font-bold px-5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Start Interview
                </Button>
            </div>
        </div>
    );
};

export default InterviewSetup;