"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";
import { vapi } from "@/lib/vapi.sdk";
import { interviewer } from "@/constants";
import { createFeedback, createInterview } from "@/lib/actions/general.action";
import { AgentProps, Message } from "@/lib/types";
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
    const [createdInterviewId, setCreatedInterviewId] = useState<string | null>(null);
    const [isAutoEnding, setIsAutoEnding] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false); // Add processing state

    useEffect(() => {
        const onCallStart = () => {
            console.log("Call started");
            setCallStatus(CallStatus.ACTIVE);
        };

        const onCallEnd = () => {
            console.log("Call ended by VAPI");
            setCallStatus(CallStatus.FINISHED);
        };

        const onMessage = (message: Message) => {
            console.log("Message received:", message);
            if (message.type === "transcript" && message.transcriptType === "final") {
                const newMessage = { role: message.role, content: message.transcript };
                setMessages((prev) => {
                    const updated = [...prev, newMessage];
                    console.log("Updated messages:", updated);
                    return updated;
                });

                // Check if the AI is ending the interview
                if (message.role === "assistant" &&
                    (message.transcript.toLowerCase().includes("thank you for your time") ||
                        message.transcript.toLowerCase().includes("we'll be in touch") ||
                        message.transcript.toLowerCase().includes("that concludes our interview") ||
                        message.transcript.toLowerCase().includes("this ends our interview"))) {

                    console.log("Interview ending detected, auto-ending call in 3 seconds...");
                    setIsAutoEnding(true);

                    // Auto-end the call after a short delay to let the message complete
                    setTimeout(() => {
                        console.log("Auto-ending call now");
                        vapi.stop();
                    }, 3000);
                }
            }
        };

        const onSpeechStart = () => {
            setIsSpeaking(true);
        };

        const onSpeechEnd = () => {
            setIsSpeaking(false);
        };

        const onError = (error: Error) => {
            console.log("VAPI Error:", error);
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
    }, [messages]);

    // Separate useEffect for handling call completion
    useEffect(() => {
        const handleGenerateFeedback = async (messages: SavedMessage[], targetInterviewId: string) => {
            console.log("handleGenerateFeedback for interview:", targetInterviewId);

            try {
                console.log("Creating feedback with transcript:", messages);
                const result = await createFeedback({
                    interviewId: targetInterviewId,
                    userId: userId,
                    transcript: messages,
                    feedbackId: type === "interview" ? feedbackId : undefined,
                });

                console.log("Feedback creation result:", result);

                if (result.success && result.feedbackId) {
                    console.log("Feedback created successfully, redirecting to feedback page...");
                    // Immediate redirect
                    router.push("/interview/" + targetInterviewId + "/feedback");
                } else {
                    console.error("Error saving feedback:", result.error);
                    router.push("/");
                }
            } catch (error) {
                console.error("Error in handleGenerateFeedback:", error);
                router.push("/");
            }
        };

        const createNewInterviewWithFeedback = async (messages: SavedMessage[], setupData: InterviewSetupData) => {
            console.log("Creating new interview with feedback", { setupData, messageCount: messages.length });

            try {
                console.log("Creating interview record...");
                const result = await createInterview({
                    userId: userId,
                    type: setupData.interviewType,
                    role: setupData.role,
                    experienceLevel: setupData.experienceLevel,
                    techstack: setupData.techStack || "",
                    companyName: setupData.companyName || "",
                    duration: setupData.duration,
                    completed: true,
                    finalized: true
                });

                console.log("Interview creation result:", result);

                if (result.success && result.interviewId) {
                    console.log("Interview created successfully with ID:", result.interviewId);
                    setCreatedInterviewId(result.interviewId);
                    // Now create feedback for this interview
                    await handleGenerateFeedback(messages, result.interviewId);
                } else {
                    console.error("Error creating interview:", result.error);
                    router.push("/");
                }
            } catch (error) {
                console.error("Error in createNewInterviewWithFeedback:", error);
                router.push("/");
            }
        };

        // Process when call is finished and we haven't started processing yet
        if (callStatus === CallStatus.FINISHED && !isProcessing) {
            console.log("Call finished, starting processing...", {
                type,
                messageCount: messages.length,
                hasSetupData: !!setupData,
                interviewId,
                createdInterviewId,
                isAutoEnding
            });

            // Set processing flag to prevent duplicate processing
            setIsProcessing(true);

            // Allow processing with fewer messages for better user experience
            if (messages.length < 1) {
                console.log("No conversation recorded, redirecting to home");
                router.push("/");
                return;
            }

            if (type === "generate") {
                // For dynamically generated interviews
                if (setupData) {
                    console.log("Processing generated interview...");
                    createNewInterviewWithFeedback(messages, setupData);
                } else {
                    console.log("Missing setup data for generated interview");
                    router.push("/");
                }
            } else {
                // For existing interviews (type === "interview")
                if (interviewId) {
                    console.log("Processing existing interview...");
                    handleGenerateFeedback(messages, interviewId);
                } else {
                    console.log("Missing interview ID for existing interview");
                    router.push("/");
                }
            }
        }
    }, [callStatus, isProcessing, messages, type, setupData, interviewId, userId, feedbackId, createdInterviewId, router]);

    const handleSetupComplete = (data: InterviewSetupData) => {
        console.log("Interview setup completed:", data);
        setSetupData(data);
        setShowSetup(false);
    };

    const handleCall = async () => {
        console.log("Starting call", { type, setupData, interviewId });
        setCallStatus(CallStatus.CONNECTING);
        setIsProcessing(false); // Reset processing state
        setMessages([]); // Clear previous messages
        setIsAutoEnding(false); // Reset auto-ending state

        if (type === "generate") {
            if (!setupData) {
                console.error("No setup data available for generated interview");
                setCallStatus(CallStatus.INACTIVE);
                return;
            }

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

CRITICAL INTERVIEW GUIDELINES:
- Be professional yet warm and conversational
${setupData.companyName ? `- Occasionally reference ${setupData.companyName} in context where appropriate` : ''}
- Ask ONE question at a time and wait for complete responses
- Keep your responses SHORT - maximum 2-3 sentences
- Adjust question difficulty based on ${setupData.experienceLevel} experience level
- Use brief follow-up questions if responses are unclear: "Can you elaborate?" or "Tell me more"
- Keep responses concise since this is voice-based
- Give brief acknowledgments: "Good", "I see", "Great", "Understood"
- Count your questions and stick to the ${setupData.duration} question limit
- NEVER number your questions or say "Question 1", "Question 2", etc.
- Ask questions naturally like a real interviewer would
- IMPORTANT: After asking all ${setupData.duration} questions, IMMEDIATELY end with: "Thank you for your time today, ${userName}. That concludes our interview. We'll be in touch soon about next steps. Have a great day!"
- DO NOT ask additional questions beyond the specified ${setupData.duration} limit

RESPONSE EXAMPLES:
✅ "Good. Tell me about your React experience."
✅ "I see. What's your biggest professional challenge?"
✅ "Great. How do you handle tight deadlines?"

❌ "Question number 1: Tell me about..."
❌ "Moving to our next question..."
❌ "That's an interesting point, let me explain how that works..."

ENDING THE INTERVIEW:
- Keep track of how many questions you've asked
- After exactly ${setupData.duration} questions, say: "Thank you for your time today, ${userName}. That concludes our interview. We'll be in touch soon about next steps. Have a great day!"
- Do NOT continue with more questions after this

Start the interview now with an appropriate first question based on the type and experience level selected.`
                        }
                    ]
                }
            };

            console.log("Starting interview with dynamic assistant configuration");
            try {
                await vapi.start(dynamicAssistant);
            } catch (error) {
                console.error("Error starting dynamic interview:", error);
                setCallStatus(CallStatus.INACTIVE);
            }

        } else {
            // Existing interview flow
            let formattedQuestions = "";
            if (questions) {
                formattedQuestions = questions
                    .map((question) => `- ${question}`)
                    .join("\n");
            }

            console.log("Starting interview with predefined questions");
            try {
                await vapi.start(interviewer, {
                    variableValues: {
                        questions: formattedQuestions,
                    },
                });
            } catch (error) {
                console.error("Error starting predefined interview:", error);
                setCallStatus(CallStatus.INACTIVE);
            }
        }
    };

    const handleDisconnect = () => {
        console.log("Manually disconnecting call");
        vapi.stop();
        // Don't set call status here - let the onCallEnd event handle it
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
                    <button
                        className="relative btn-call"
                        onClick={() => handleCall()}
                        disabled={callStatus === "CONNECTING"}
                    >
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
                    <div className="flex flex-col items-center gap-2">
                        <button className="btn-disconnect" onClick={() => handleDisconnect()}>
                            End Interview
                        </button>
                        {isAutoEnding && (
                            <p className="text-sm text-blue-500 animate-pulse">
                                Interview completed. Ending call automatically...
                            </p>
                        )}
                    </div>
                )}
            </div>

            {/* Status Messages */}
            {(callStatus === CallStatus.FINISHED || isProcessing) && (
                <div className="w-full flex justify-center mt-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                            <span className="text-blue-800 font-medium">Processing Interview</span>
                        </div>
                        <p className="text-sm text-blue-600">
                            Generating your feedback and saving results...
                        </p>
                    </div>
                </div>
            )}

            {/* Debug info - remove in production */}
            {process.env.NODE_ENV === 'development' && (
                <div className="mt-4 p-4 bg-gray-800 rounded text-xs text-gray-300">
                    <p>Debug Info:</p>
                    <p>Type: {type}</p>
                    <p>Call Status: {callStatus}</p>
                    <p>Messages: {messages.length}</p>
                    <p>Setup Data: {setupData ? 'Yes' : 'No'}</p>
                    <p>Interview ID: {interviewId || 'None'}</p>
                    <p>Created Interview ID: {createdInterviewId || 'None'}</p>
                    <p>Is Processing: {isProcessing ? 'Yes' : 'No'}</p>
                    <p>Is Auto Ending: {isAutoEnding ? 'Yes' : 'No'}</p>
                </div>
            )}
        </>
    );
};

export default Agent;