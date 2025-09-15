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

        const interview = {
            role: role,
            type: type,
            level: level,
            techstack: techstack ? techstack.split(",").map((tech: string) => tech.trim()) : [],
            questions: cleanedQuestions,
            userId: userid,
            finalized: true, // Mark as finalized so it shows in the interviews list
            coverImage: getRandomInterviewCover(),
            createdAt: new Date().toISOString(),
            questionCount: parseInt(amount) || 5,
            completed: completed || false,
        };

        console.log("Creating interview document:", interview);

        const docRef = await db.collection("interviews").add(interview);

        console.log("Interview created successfully with ID:", docRef.id);

        return Response.json({
            success: true,
            interviewId: docRef.id,
            message: "Interview created successfully"
        }, { status: 200 });

    } catch (error) {
        console.error("Detailed error creating interview:", error);

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