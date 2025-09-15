// hooks/useFeedbackSubmission.ts
import { useState } from 'react';

interface FeedbackData {
    interviewId: string;
    userId: string;
    feedback: string;
    overallScore?: number;
    questionResponses?: Array<{
        question: string;
        response: string;
        score?: number;
    }>;
    strengths?: string[];
    improvements?: string[];
    recommendations?: string[];
}

export const useFeedbackSubmission = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const submitFeedback = async (feedbackData: FeedbackData) => {
        try {
            setIsSubmitting(true);
            setError(null);

            console.log('Submitting feedback:', feedbackData);

            const response = await fetch('/api/interviews/feedback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(feedbackData)
            });

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error || 'Failed to submit feedback');
            }

            console.log('Feedback submitted successfully:', result);
            return result;

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
            setError(errorMessage);
            console.error('Error submitting feedback:', err);
            throw err;
        } finally {
            setIsSubmitting(false);
        }
    };

    return {
        submitFeedback,
        isSubmitting,
        error
    };
};

// Utility function to parse AI-generated feedback into structured format
export const parseFeedbackFromAI = (aiResponse: string, interviewId: string, userId: string) => {
    try {
        // Try to parse if it's JSON
        const parsed = JSON.parse(aiResponse);

        return {
            interviewId,
            userId,
            feedback: parsed.feedback || aiResponse,
            overallScore: parsed.overallScore || parsed.score,
            questionResponses: parsed.questionResponses || [],
            strengths: parsed.strengths || [],
            improvements: parsed.improvements || [],
            recommendations: parsed.recommendations || []
        };
    } catch {
        // If not JSON, extract information using regex/text parsing
        const feedbackData: FeedbackData = {
            interviewId,
            userId,
            feedback: aiResponse
        };

        // Extract overall score
        const scoreMatch = aiResponse.match(/(?:overall\s+score|score)[:=]\s*(\d+(?:\.\d+)?)\s*(?:\/\s*10)?/i);
        if (scoreMatch) {
            feedbackData.overallScore = parseFloat(scoreMatch[1]);
        }

        // Extract strengths
        const strengthsMatch = aiResponse.match(/(?:strengths?|positive\s+aspects?)[:=]\s*(.*?)(?:\n\n|\n(?:[A-Z]|$))/is);
        if (strengthsMatch) {
            feedbackData.strengths = strengthsMatch[1]
                .split(/[•\-\n]/)
                .map(s => s.trim())
                .filter(s => s.length > 0);
        }

        // Extract improvements
        const improvementsMatch = aiResponse.match(/(?:improvements?|areas?\s+for\s+improvement|weaknesses?)[:=]\s*(.*?)(?:\n\n|\n(?:[A-Z]|$))/is);
        if (improvementsMatch) {
            feedbackData.improvements = improvementsMatch[1]
                .split(/[•\-\n]/)
                .map(s => s.trim())
                .filter(s => s.length > 0);
        }

        // Extract recommendations
        const recommendationsMatch = aiResponse.match(/(?:recommendations?|suggestions?)[:=]\s*(.*?)(?:\n\n|\n(?:[A-Z]|$))/is);
        if (recommendationsMatch) {
            feedbackData.recommendations = recommendationsMatch[1]
                .split(/[•\-\n]/)
                .map(s => s.trim())
                .filter(s => s.length > 0);