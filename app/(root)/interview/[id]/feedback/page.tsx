import dayjs from "dayjs";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";

import {
    getFeedbackByInterviewId,
    getInterviewById,
} from "@/lib/actions/general.action";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/actions/auth.action";

const Feedback = async ({ params }: RouteParams) => {
    const { id } = await params;
    const user = await getCurrentUser();

    const interview = await getInterviewById(id);
    if (!interview) redirect("/");

    const feedback = await getFeedbackByInterviewId({
        interviewId: id,
        userId: user?.id!,
    });

    // Helper function to format category names
    const formatCategoryName = (key: string) => {
        return key
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase())
            .trim();
    };

    return (
        <section className="section-feedback">
            <div className="flex flex-row justify-center">
                <h1 className="text-4xl font-semibold">
                    Feedback on the Interview -{" "}
                    <span className="capitalize">{interview.role}</span> Interview
                </h1>
            </div>

            <div className="flex flex-row justify-center ">
                <div className="flex flex-row gap-5">
                    {/* Overall Impression */}
                    <div className="flex flex-row gap-2 items-center">
                        <Image src="/star.svg" width={22} height={22} alt="star" />
                        <p>
                            Overall Impression:{" "}
                            <span className="text-primary-200 font-bold">
                                {feedback?.totalScore || "N/A"}
                            </span>
                            {feedback?.totalScore && "/100"}
                        </p>
                    </div>

                    {/* Date */}
                    <div className="flex flex-row gap-2">
                        <Image src="/calendar.svg" width={22} height={22} alt="calendar" />
                        <p>
                            {feedback?.createdAt
                                ? dayjs(feedback.createdAt).format("MMM D, YYYY h:mm A")
                                : "N/A"}
                        </p>
                    </div>
                </div>
            </div>

            <hr />

            <p>{feedback?.finalAssessment || "No assessment available yet."}</p>

            {/* Interview Breakdown */}
            <div className="flex flex-col gap-4">
                <h2>Breakdown of the Interview:</h2>
                {feedback?.categoryScores && typeof feedback.categoryScores === 'object'
                    ? Object.entries(feedback.categoryScores).map(([key, score], index) => (
                        <div key={key} className="mb-3">
                            <p className="font-bold">
                                {index + 1}. {formatCategoryName(key)}: {score}/100
                            </p>
                            {/* Progress bar */}
                            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                                <div
                                    className="bg-primary-200 h-2.5 rounded-full"
                                    style={{ width: `${score}%` }}
                                ></div>
                            </div>
                        </div>
                    ))
                    : <p>No category breakdown available yet.</p>
                }
            </div>

            <div className="flex flex-col gap-3">
                <h3>Strengths</h3>
                {feedback?.strengths && feedback.strengths.trim().length > 0
                    ? <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-400">
                        <p className="text-green-800">{feedback.strengths}</p>
                    </div>
                    : <p>No strengths identified yet.</p>
                }
            </div>

            <div className="flex flex-col gap-3">
                <h3>Areas for Improvement</h3>
                {feedback?.areasForImprovement && feedback.areasForImprovement.trim().length > 0
                    ? <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-400">
                        <p className="text-yellow-800">{feedback.areasForImprovement}</p>
                    </div>
                    : <p>No improvement areas identified yet.</p>
                }
            </div>

            <div className="buttons">
                <Button className="btn-secondary flex-1">
                    <Link href="/" className="flex w-full justify-center">
                        <p className="text-sm font-semibold text-primary-200 text-center">
                            Back to dashboard
                        </p>
                    </Link>
                </Button>

                <Button className="btn-primary flex-1">
                    <Link
                        href={`/interview/${id}`}
                        className="flex w-full justify-center"
                    >
                        <p className="text-sm font-semibold text-black text-center">
                            Retake Interview
                        </p>
                    </Link>
                </Button>
            </div>
        </section>
    );
};

export default Feedback;