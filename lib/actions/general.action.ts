"use server";

import { generateObject } from "ai";
import { google } from "@ai-sdk/google";

import { db } from "@/firebase/admin";
import { z } from "zod";

const feedbackSchema = z.object({
    totalScore: z.number().min(0).max(100),
    categoryScores: z.object({
        communicationSkills: z.number().min(0).max(100),
        technicalKnowledge: z.number().min(0).max(100),
        problemSolving: z.number().min(0).max(100),
        culturalFit: z.number().min(0).max(100),
        confidenceAndClarity: z.number().min(0).max(100),
    }),
    strengths: z.string().min(1),
    areasForImprovement: z.string().min(1),
    finalAssessment: z.string().min(1),
});

export async function createFeedback(params: CreateFeedbackParams) {
    const { interviewId, userId, transcript, feedbackId } = params;

    try {
        const formattedTranscript = transcript
            .map(
                (sentence: { role: string; content: string }) =>
                    `- ${sentence.role}: ${sentence.content}\n`
            )
            .join("");

        console.log("Formatted transcript:", formattedTranscript); // Debug log

        const { object } = await generateObject({
            model: google("gemini-2.0-flash-001", {
                structuredOutputs: false,
            }),
            schema: feedbackSchema,
            prompt: `
You are an AI interviewer analyzing a mock interview for a Data Scientist position. Your task is to evaluate the candidate based on structured categories. Be thorough and detailed in your analysis. Don't be lenient with the candidate. If there are mistakes or areas for improvement, point them out clearly.

Interview Transcript:
${formattedTranscript}

IMPORTANT INSTRUCTIONS:
1. You MUST provide specific, detailed feedback for each category
2. Strengths should be concrete examples from the interview (minimum 2-3 sentences)
3. Areas for improvement should be specific and actionable (minimum 2-3 sentences)
4. Final assessment should be comprehensive (minimum 3-4 sentences)
5. Do NOT leave any field empty or with generic responses

Please score the candidate from 0 to 100 in the following areas:
- **Communication Skills**: Clarity, articulation, structured responses, ability to explain technical concepts clearly
- **Technical Knowledge**: Understanding of data science concepts, tools, methodologies, statistical knowledge
- **Problem-Solving**: Ability to analyze problems, propose solutions, think through complex scenarios
- **Cultural & Role Fit**: Alignment with company values, understanding of the role, professional demeanor
- **Confidence & Clarity**: Confidence in responses, engagement level, clarity of thought process

Provide specific examples from the transcript to support your scores and feedback.
            `,
            system: `You are a professional interviewer with expertise in Data Science roles. You must provide detailed, specific feedback based on the interview transcript. Never provide empty or generic responses. Always reference specific parts of the conversation when giving feedback.`
        });

        console.log("Generated feedback object:", object); // Debug log

        // Validate that we have meaningful content
        if (!object.strengths || object.strengths.trim().length < 10) {
            console.warn("Strengths field is too short or empty:", object.strengths);
        }

        if (!object.areasForImprovement || object.areasForImprovement.trim().length < 10) {
            console.warn("Areas for improvement field is too short or empty:", object.areasForImprovement);
        }

        const feedback = {
            interviewId: interviewId,
            userId: userId,
            totalScore: object.totalScore,
            categoryScores: object.categoryScores,
            strengths: object.strengths || "Unable to identify specific strengths from the interview. Please ensure the interview covers relevant topics and provides detailed responses.",
            areasForImprovement: object.areasForImprovement || "Unable to identify specific areas for improvement. Please ensure the interview is comprehensive and covers technical and behavioral aspects.",
            finalAssessment: object.finalAssessment || "Unable to provide a comprehensive assessment based on the available interview data.",
            createdAt: new Date().toISOString(),
        };

        let feedbackRef;

        if (feedbackId) {
            feedbackRef = db.collection("feedback").doc(feedbackId);
        } else {
            feedbackRef = db.collection("feedback").doc();
        }

        await feedbackRef.set(feedback);

        console.log("Feedback saved successfully:", feedback); // Debug log

        return { success: true, feedbackId: feedbackRef.id };
    } catch (error) {
        console.error("Error saving feedback:", error);
        return { success: false, error: error.message };
    }
}

export async function getInterviewById(id: string): Promise<Interview | null> {
    const interview = await db.collection("interviews").doc(id).get();

    return interview.data() as Interview | null;
}

export async function getFeedbackByInterviewId(
    params: GetFeedbackByInterviewIdParams
): Promise<Feedback | null> {
    const { interviewId, userId } = params;

    if (!userId || !interviewId) {
        console.warn('No valid userId or interviewId provided; returning null.');
        return null;
    }

    const querySnapshot = await db
        .collection("feedback")
        .where("interviewId", "==", interviewId)
        .where("userId", "==", userId)
        .limit(1)
        .get();

    if (querySnapshot.empty) return null;

    const feedbackDoc = querySnapshot.docs[0];
    return { id: feedbackDoc.id, ...feedbackDoc.data() } as Feedback;
}

export async function getLatestInterviews(
    params: GetLatestInterviewsParams
): Promise<Interview[] | null> {
    const { userId, limit = 20 } = params;

    if (!userId) {
        console.warn('No valid userId provided; returning empty array.');
        return [];
    }

    const interviews = await db
        .collection("interviews")
        .orderBy("createdAt", "desc")
        .where("finalized", "==", true)
        .where("userId", "!=", userId)
        .limit(limit)
        .get();

    return interviews.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    })) as Interview[];
}

export async function getInterviewsByUserId(
    userId: string
): Promise<Interview[] | null> {
    if (!userId) {
        console.warn('No valid userId provided; returning empty array.');
        return [];
    }

    const interviews = await db
        .collection("interviews")
        .where("userId", "==", userId)
        .orderBy("createdAt", "desc")
        .get();

    return interviews.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    })) as Interview[];
}