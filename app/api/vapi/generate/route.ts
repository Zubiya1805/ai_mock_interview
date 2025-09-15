import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { db } from "@/firebase/admin";
import { getRandomInterviewCover } from "@/lib/utils";

export async function POST(request: Request) {
    try {
        const {
            type,
            role,
            level = "Mid-level",
            techstack = "",
            amount = "5",
            userid,
            duration = "15 minutes",
            completed = false
        } = await request.json();

        console.log("API Request received:", {
            type,
            role,
            level,
            techstack,
            amount,
            userid,
            duration,
            completed
        });

        // Validate required fields
        if (!type) {
            return Response.json({
                success: false,
                error: "Interview type is required"
            }, { status: 400 });
        }

        if (!role) {
            return Response.json({
                success: false,
                error: "Role is required"
            }, { status: 400 });
        }

        if (!userid) {
            return Response.json({
                success: false,
                error: "User ID is required"
            }, { status: 400 });
        }

        // **NEW: Check for recent duplicate interviews to prevent spam creation**
        const recentInterviews = await db
            .collection("interviews")
            .where("userId", "==", userid)
            .where("role", "==", role)
            .where("type", "==", type)
            .orderBy("createdAt", "desc")
            .limit(1)
            .get();

        // If there's a recent interview created within the last minute, return existing one
        if (!recentInterviews.empty) {
            const lastInterview = recentInterviews.docs[0];
            const lastInterviewData = lastInterview.data();
            const lastCreated = new Date(lastInterviewData.createdAt);
            const now = new Date();
            const timeDiff = now.getTime() - lastCreated.getTime();

            // If created within last 60 seconds, return existing interview
            if (timeDiff < 60000) {
                console.log("Returning existing interview to prevent duplicate:", lastInterview.id);
                return Response.json({
                    success: true,
                    interviewId: lastInterview.id,
                    message: "Using existing recent interview"
                }, { status: 200 });
            }
        }

        // Create different prompts based on interview type
        let prompt = "";

        if (type === "Technical") {
            prompt = `Generate ${amount} technical interview questions for a ${role} position.
            Focus Areas: ${techstack || "general technical skills for the role"}
            Experience Level: ${level}
            Duration: ${duration}
            
            Focus on:
            - Technical knowledge and implementation
            - Problem-solving scenarios
            - Code review and debugging
            - System design (if senior level)
            ${techstack ? `- Specific questions about ${techstack}` : ''}
            
            Make questions progressively challenging and include follow-up scenarios.`;

        } else if (type === "Behavioral") {
            prompt = `Generate ${amount} behavioral interview questions for a ${role} position.
            Experience Level: ${level}
            Duration: ${duration}
            
            Focus on:
            - Past experiences and challenges
            - Leadership and teamwork
            - Problem-solving approach
            - Communication skills
            - Career motivation and goals
            
            Use STAR method friendly questions (Situation, Task, Action, Result).
            Include questions specific to ${role} responsibilities.`;

        } else if (type === "Mixed") {
            const technicalCount = Math.ceil(parseInt(amount) * 0.6);
            const behavioralCount = parseInt(amount) - technicalCount;

            prompt = `Generate a mixed interview with ${technicalCount} technical and ${behavioralCount} behavioral questions for a ${role} position.
            
            Technical Focus: ${techstack || "general technical skills"}
            Experience Level: ${level}
            Duration: ${duration}
            
            Technical Questions (${technicalCount}):
            - Technical knowledge and problem-solving
            - Implementation and best practices
            ${techstack ? `- Specific to ${techstack}` : ''}
            
            Behavioral Questions (${behavioralCount}):
            - Past experiences and teamwork
            - Leadership and communication
            - Problem-solving approach
            
            Mix the questions naturally, starting with behavioral to build rapport, then technical challenges.`;
        }

        prompt += `

        IMPORTANT: Return questions as a valid JSON array format like this:
        ["Question 1?", "Question 2?", "Question 3?"]
        
        - Do not use special characters like /, *, #, or any markdown formatting
        - Make questions conversational and suitable for voice interaction
        - Ensure each question is clear and specific
        - No additional text or explanations, just the JSON array`;

        console.log("Generating questions with AI...");

        const { text: questions } = await generateText({
            model: google("gemini-2.0-flash-001"),
            prompt: prompt,
        });

        console.log("AI Response received:", questions);

        // Clean and parse the response
        let cleanedQuestions;
        try {
            // Remove any markdown formatting and extract JSON
            const jsonMatch = questions.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                cleanedQuestions = JSON.parse(jsonMatch[0]);
            } else {
                cleanedQuestions = JSON.parse(questions);
            }
        } catch (parseError) {
            console.error("Error parsing questions:", parseError);
            // Fallback: create default questions
            cleanedQuestions = [
                `Tell me about your experience with ${role} responsibilities.`,
                `How do you approach problem-solving in your work?`,
                `Describe a challenging project you worked on recently.`,
                `What interests you most about this ${role} position?`,
                `How do you stay updated with industry trends?`
            ];
        }

        console.log("Parsed questions:", cleanedQuestions);

        // **NEW: Use a transaction to ensure atomic creation**
        const interviewRef = db.collection("interviews").doc();

        const interview = {
            role: role,
            type: type,
            level: level,
            techstack: techstack ? techstack.split(",").map((tech: string) => tech.trim()) : [],
            questions: cleanedQuestions,
            userId: userid,
            finalized: true,
            coverImage: getRandomInterviewCover(),
            createdAt: new Date().toISOString(),
            questionCount: parseInt(amount) || 5,
            completed: completed || false,
        };

        console.log("Creating interview document:", interview);

        // Use transaction to prevent race conditions
        await db.runTransaction(async (transaction) => {
            // Double-check that no interview was created in the meantime
            const doubleCheckSnapshot = await transaction.get(
                db.collection("interviews")
                    .where("userId", "==", userid)
                    .where("role", "==", role)
                    .where("type", "==", type)
                    .orderBy("createdAt", "desc")
                    .limit(1)
            );

            if (!doubleCheckSnapshot.empty) {
                const recentDoc = doubleCheckSnapshot.docs[0];
                const recentData = recentDoc.data();
                const recentCreated = new Date(recentData.createdAt);
                const now = new Date();
                const timeDiff = now.getTime() - recentCreated.getTime();

                if (timeDiff < 60000) {
                    throw new Error(`DUPLICATE_INTERVIEW:${recentDoc.id}`);
                }
            }

            // Create the interview
            transaction.set(interviewRef, interview);
        });

        console.log("Interview created successfully with ID:", interviewRef.id);

        return Response.json({
            success: true,
            interviewId: interviewRef.id,
            message: "Interview created successfully"
        }, { status: 200 });

    } catch (error) {
        console.error("Detailed error creating interview:", error);

        // Handle duplicate interview error
        if (error instanceof Error && error.message.startsWith('DUPLICATE_INTERVIEW:')) {
            const existingId = error.message.split(':')[1];
            return Response.json({
                success: true,
                interviewId: existingId,
                message: "Using existing recent interview"
            }, { status: 200 });
        }

        // More detailed error logging
        if (error instanceof Error) {
            console.error("Error name:", error.name);
            console.error("Error message:", error.message);
            console.error("Error stack:", error.stack);
        }

        return Response.json({
            success: false,
            error: "Failed to create interview",
            message: error instanceof Error ? error.message : "Unknown error",
            details: error instanceof Error ? {
                name: error.name,
                message: error.message
            } : null
        }, { status: 500 });
    }
}

export async function GET() {
    return Response.json({ success: true, data: "Interview API is working!" }, { status: 200 });
}