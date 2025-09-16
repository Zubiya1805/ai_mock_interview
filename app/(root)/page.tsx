'use client';

import { useState, useEffect } from 'react';

export default function Home() {
    const [user, setUser] = useState(null);
    const [userInterviews, setUserInterviews] = useState([]);
    const [allInterview, setAllInterview] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                const currentUser = await getCurrentUser();
                setUser(currentUser);

                const [interviews, latest] = await Promise.all([
                    getInterviewsByUserId(currentUser?.id!) ?? [],
                    getLatestInterviews({ userId: currentUser?.id! }) ?? [],
                ]);

                setUserInterviews(interviews);
                setAllInterview(latest);
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, []);

    if (loading) {
        return <div>Loading...</div>;
    }

    const hasPastInterviews = userInterviews.length > 0;
    const hasUpcomingInterviews = allInterview.length > 0;

    return (
        <>
            {/* ...same as before... */}

            <section className="flex flex-col gap-6 mt-8">
                <h2>Your Interviews</h2>

                <div className="interviews-section">
                    {hasPastInterviews ? (
                        userInterviews.map((interview) => (
                            <InterviewCard
                                key={interview.id}
                                userId={user?.id}
                                interviewId={interview.id}
                                role={interview.role}
                                type={interview.type}
                                techstack={interview.techstack}
                                createdAt={interview.createdAt}
                            />
                        ))
                    ) : (
                        <p>You haven&apos;t taken any interviews yet</p>
                    )}
                </div>
            </section>

            <section className="flex flex-col gap-6 mt-8">
                <h2>Take Interviews</h2>

                <div className="interviews-section">
                    {hasUpcomingInterviews ? (
                        allInterview.map((interview) => (
                            <InterviewCard
                                key={interview.id}
                                userId={user?.id}
                                interviewId={interview.id}
                                role={interview.role}
                                type={interview.type}
                                techstack={interview.techstack}
                                createdAt={interview.createdAt}
                            />
                        ))
                    ) : (
                        <p>There are no interviews available</p>
                    )}
                </div>
            </section>
        </>
    );
}