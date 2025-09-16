import { NextRequest, NextResponse } from 'next/server';

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

const parseFeedbackFromAI = (aiResponse: string, interviewId: string, userId: string): FeedbackData => {
    try {
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
        const feedbackData: FeedbackData = {
            interviewId,
            userId,
            feedback: aiResponse
        };

        const scoreMatch = aiResponse.match(/(?:overall\s+score|score)[:=]\s*(\d+(?:\.\d+)?)\s*(?:\/\s*10)?/i);
        if (scoreMatch) {
            feedbackData.overallScore = parseFloat(scoreMatch[1]);
        }

        const strengthsMatch = aiResponse.match(/(?:strengths?|positive\s+aspects?)[:=]\s*(.*?)(?:\n\n|\n(?:[A-Z]|$))/is);
        if (strengthsMatch) {
            feedbackData.strengths = strengthsMatch[1]
                .split(/[•\-\n]/)
                .map(s => s.trim())
                .filter(s => s.length > 0);
        }

        const improvementsMatch = aiResponse.match(/(?:improvements?|areas?\s+for\s+improvement|weaknesses?)[:=]\s*(.*?)(?:\n\n|\n(?:[A-Z]|$))/is);
        if (improvementsMatch) {
            feedbackData.improvements = improvementsMatch[1]
                .split(/[•\-\n]/)
                .map(s => s.trim())
                .filter(s => s.length > 0);
        }

        const recommendationsMatch = aiResponse.match(/(?:recommendations?|suggestions?)[:=]\s*(.*?)(?:\n\n|\n(?:[A-Z]|$))/is);
        if (recommendationsMatch) {
            feedbackData.recommendations = recommendationsMatch[1]
                .split(/[•\-\n]/)
                .map(s => s.trim())
                .filter(s => s.length > 0);
        }

        return feedbackData;
    }
};

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { aiResponse, interviewId, userId } = body;

        if (!aiResponse || !interviewId || !userId) {
            return NextResponse.json(
                { error: 'Missing required fields: aiResponse, interviewId, userId' },
                { status: 400 }
            );
        }

        const parsedFeedback = parseFeedbackFromAI(aiResponse, interviewId, userId);

        return NextResponse.json({
            success: true,
            data: parsedFeedback
        });

    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function GET() {
    return NextResponse.json({ message: 'API route is working' });
}