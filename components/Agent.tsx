"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";
import { vapi } from "@/lib/vapi.sdk";
import { interviewer } from "@/constants";
import { createFeedback } from "@/lib/actions/general.action";
import InterviewSetup from "./InterviewSetup";

enum CallStatus {
    INACTIVE = "INACTIVE",
    CONNECTING = "CONNECTING",
    ACTIVE = "ACTIVE",
    FINISHED = "FINISHED",
}

interface SavedMessage {
    role: "user" | "system" | "assistant";
    content: string;
}

interface InterviewSetupData {
    interviewType: string;
    role: string;
    experienceLevel: string;
    companyName?: string;
    techStack?: string;
    duration: string;
    resumeFile?: File;
}

const Agent = ({
                   userName,
                   userId,
                   interviewId,
                   feedbackId,
                   type,
                   questions,
                   profileImage
               }: AgentProps) => {
    const router = useRouter();
    const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);
    const [messages, setMessages] = useState<SavedMessage[]>([]);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [lastMessage, setLastMessage] = useState<string>("");
    const [showSetup, setShowSetup] = useState(type === "generate");
    const [setupData, setSetupData] = useState<InterviewSetupData | null>(null);

    useEffect(() => {
        const onCallStart = () => {
            setCallStatus(CallStatus.ACTIVE);
        };

        const onCallEnd = () => {
            setCallStatus(CallStatus.FINISHED);
        };

        const onMessage = (message: Message) => {
            if (message.type === "transcript" && message.transcriptType === "final") {
                const newMessage = { role: message.role, content: message.transcript };
                setMessages((prev) => [...prev, newMessage]);
            }
        };

        const onSpeechStart = () => {
            console.log("speech start");
            setIsSpeaking(true);
        };

        const onSpeechEnd = () => {
            console.log("speech end");
            setIsSpeaking(false);
        };

        const onError = (error: Error) => {
            console.log("Error:", error);
        };

        vapi.on("call-start", onCallStart);
        vapi.on("call-end", onCallEnd);
        vapi.on("message", onMessage);
        vapi.on("speech-start", onSpeechStart);
        vapi.on("speech-end", onSpeechEnd);
        vapi.on("error", onError);

        return () => {
            vapi.off("call-start", onCallStart);
            vapi.off("call-end", onCallEnd);
            vapi.off("message", onMessage);
            vapi.off("speech-start", onSpeechStart);
            vapi.off("speech-end", onSpeechEnd);
            vapi.off("error", onError);
        };
    }, []);

    useEffect(() => {
        if (messages.length > 0) {
            setLastMessage(messages[messages.length - 1].content);
        }

        const handleGenerateFeedback = async (messages: SavedMessage[]) => {
            console.log("handleGenerateFeedback");

            const { success, feedbackId: id } = await createFeedback({
                interviewId: interviewId!,
                userId: userId!,
                transcript: messages,
                feedbackId,
            });

            if (success && id) {
                router.push(`/interview/${interviewId}/feedback`);
            } else {
                console.log("Error saving feedback");
                router.push("/");
            }
        };

        if (callStatus === CallStatus.FINISHED) {
            if (type === "generate") {
                // Interview completed, redirect to home to see it in "Your Interviews"
                router.push("/");
            } else {
                handleGenerateFeedback(messages);
            }
        }
    }, [messages, callStatus, feedbackId, interviewId, router, type, userId]);

    const handleSetupComplete = (data: InterviewSetupData) => {
        setSetupData(data);
        setShowSetup(false);
    };

    const handleCall = async () => {
        setCallStatus(CallStatus.CONNECTING);

        if (type === "generate") {
            if (!setupData) return;

            // Create a complete assistant configuration with the form data
            const dynamicAssistant = {
                name: "Custom Interviewer",
                firstMessage: `Hello ${userName}! Thank you for taking the time to speak with me today. I'm excited to discuss the ${setupData.role} position${setupData.companyName ? ` at ${setupData.companyName}` : ''} with you. Are you ready to begin your ${setupData.interviewType.toLowerCase()} interview?`,
                transcriber: {
                    provider: "deepgram",
                    model: "nova-2",
                    language: "en",
                },
                voice: {
                    provider: "11labs",
                    voiceId: "sarah",
                    stability: 0.4,
                    similarityBoost: 0.8,
                    speed: 0.9,
                    style: 0.5,
                    useSpeakerBoost: true,
                },
                model: {
                    provider: "openai",
                    model: "gpt-4",
                    messages: [
                        {
                            role: "system",
                            content: `You are conducting a ${setupData.interviewType} interview for a ${setupData.role} position with ${userName}.

INTERVIEW REQUIREMENTS:
- Interview Type: ${setupData.interviewType}
- Position: ${setupData.role}
- Experience Level: ${setupData.experienceLevel}
- Candidate: ${userName}
${setupData.companyName ? `- Company: ${setupData.companyName}` : ''}
- Questions to Ask: ${setupData.duration} questions
${setupData.techStack ? `- Tech Stack Focus: ${setupData.techStack}` : ''}

EXPERIENCE LEVEL CONTEXT:
${setupData.experienceLevel === 'Entry Level' ? `
- Ask foundational questions appropriate for someone new to the field
- Focus on basic concepts, learning ability, and potential
- Be encouraging and educational in your approach
- Ask about academic projects, internships, or personal projects
` : ''}
${setupData.experienceLevel === 'Middle' ? `
- Ask intermediate-level questions with some complexity
- Focus on practical experience and problem-solving
- Include scenario-based questions about real-world challenges
- Ask about team collaboration and project ownership
` : ''}
${setupData.experienceLevel === 'Senior' ? `
- Ask advanced technical and leadership questions
- Focus on architecture, mentoring, and strategic thinking
- Include system design and complex problem-solving scenarios
- Ask about leading teams and making technical decisions
` : ''}

INTERVIEW STRUCTURE:
You need to ask exactly ${setupData.duration} ${setupData.interviewType.toLowerCase()} questions appropriate for a ${setupData.experienceLevel} ${setupData.role}.

${setupData.interviewType === 'Technical' ? `
TECHNICAL INTERVIEW FOCUS:
- Ask ${setupData.duration} technical questions about ${setupData.role} responsibilities
- Tailor difficulty to ${setupData.experienceLevel} level
${setupData.techStack ? `- Focus specifically on: ${setupData.techStack}` : ''}
- Include coding concepts, problem-solving scenarios
${setupData.experienceLevel === 'Senior' ? '- Ask about system design and architectural decisions' : ''}
- Test their technical knowledge depth appropriate for their level
` : ''}

${setupData.interviewType === 'Behavioral' ? `
BEHAVIORAL INTERVIEW FOCUS:
- Ask ${setupData.duration} behavioral questions using STAR method
- Tailor complexity to ${setupData.experienceLevel} level
- Focus on experiences appropriate for their career stage
${setupData.experienceLevel === 'Entry Level' ? '- Ask about academic, internship, or personal project experiences' : ''}
${setupData.experienceLevel === 'Senior' ? '- Ask about leadership, mentoring, and strategic decision-making' : ''}
- Explore their communication and problem-solving skills
- Ask about career goals and motivations
` : ''}

${setupData.interviewType === 'Mixed' ? `
MIXED INTERVIEW STRUCTURE:
- Ask ${Math.ceil(parseInt(setupData.duration) * 0.6)} technical questions
- Ask ${Math.floor(parseInt(setupData.duration) * 0.4)} behavioral questions
- Start with 1-2 behavioral questions to build rapport
- Then move to technical challenges
- All questions should be appropriate for ${setupData.experienceLevel} level
${setupData.techStack ? `- Technical questions should focus on: ${setupData.techStack}` : ''}
` : ''}

INTERVIEW GUIDELINES:
- Be professional yet warm and conversational
${setupData.companyName ? `- Occasionally reference ${setupData.companyName} in context where appropriate` : ''}
- Ask one question at a time and wait for complete responses
- Adjust question difficulty based on ${setupData.experienceLevel} experience level
- Use follow-up questions if responses are unclear or incomplete
- Keep responses concise (this is voice-based)
- Acknowledge good answers positively
- Count your questions and stick to the ${setupData.duration} question limit
- End gracefully after asking all questions

Start the interview now with an appropriate first question based on the type and experience level selected.`
                        }
                    ]
                }
            };

            console.log("Starting interview with setup:", setupData);
            await vapi.start(dynamicAssistant);

        } else {
            let formattedQuestions = "";
            if (questions) {
                formattedQuestions = questions
                    .map((question) => `- ${question}`)
                    .join("\n");
            }

            await vapi.start(interviewer, {
                variableValues: {
                    questions: formattedQuestions,
                },
            });
        }
    };

    const handleDisconnect = () => {
        setCallStatus(CallStatus.FINISHED);
        vapi.stop();
    };

    // Show setup form for new interviews
    if (showSetup && type === "generate") {
        return (
            <InterviewSetup
                userName={userName}
                userId={userId}
                onStartInterview={handleSetupComplete}
            />
        );
    }

    return (
        <>
            <div className="call-view">
                {/* AI Interviewer Card */}
                <div className="card-interviewer">
                    <div className="avatar">
                        <Image
                            src="/ai-avatar.png"
                            alt="profile-image"
                            width={65}
                            height={54}
                            className="object-cover"
                        />
                        {isSpeaking && <span className="animate-speak" />}
                    </div>
                    <h3>AI Interviewer</h3>
                </div>

                {/* User Profile Card */}
                <div className="card-border">
                    <div className="card-content">
                        {profileImage ? (
                            <Image
                                src={profileImage}
                                alt="profile-image"
                                width={120}
                                height={120}
                                className="rounded-full object-cover size-[120px]"
                                onError={(e) => {
                                    // Hide the image if it fails to load
                                    e.currentTarget.style.display = 'none';
                                }}
                            />
                        ) : (
                            <div className="size-[120px] rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-4xl font-semibold">
                                {userName?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                        )}
                        <h3>{userName}</h3>
                        {setupData && (
                            <div className="mt-2 text-center">
                                <p className="text-sm text-light-100">{setupData.role}</p>
                                <p className="text-xs text-light-400">{setupData.interviewType} • {setupData.experienceLevel}</p>
                                {setupData.companyName && (
                                    <p className="text-xs text-light-300">{setupData.companyName}</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {messages.length > 0 && (
                <div className="transcript-border">
                    <div className="transcript">
                        <p
                            key={lastMessage}
                            className={cn(
                                "transition-opacity duration-500 opacity-0",
                                "animate-fadeIn opacity-100"
                            )}
                        >
                            {lastMessage}
                        </p>
                    </div>
                </div>
            )}

            <div className="w-full flex justify-center">
                {callStatus !== "ACTIVE" ? (
                    <button className="relative btn-call" onClick={() => handleCall()}>
            <span
                className={cn(
                    "absolute animate-ping rounded-full opacity-75",
                    callStatus !== "CONNECTING" && "hidden"
                )}
            />

                        <span className="relative">
              {callStatus === "INACTIVE" || callStatus === "FINISHED"
                  ? "Call"
                  : ". . ."}
            </span>
                    </button>
                ) : (
                    <button className="btn-disconnect" onClick={() => handleDisconnect()}>
                        End
                    </button>
                )}
            </div>
        </>
    );
};

export default Agent;