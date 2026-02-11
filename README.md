📌 Overview
AI Mock Interview is a web application that helps job seekers practice interviews using artificial intelligence. The platform provides realistic interview questions, records responses, and delivers instant feedback to help users improve their interview performance.

 Problem It Solves

Limited practice opportunities - Not everyone has access to mock interview sessions
Lack of feedback - Hard to know what you're doing wrong without expert guidance
Interview anxiety - Practice in a safe environment before the real thing
Accessibility - Available 24/7, completely free to use


✨ Key Features

AI-Powered Questions - Generates relevant interview questions based on job role
Record Responses - Practice answering with text or voice input
Instant Feedback - Get AI-generated feedback on your answers
User Authentication - Secure login with Firebase Authentication
Save Interview History - Track your progress and review past interviews
Responsive Design - Works seamlessly on desktop, tablet, and mobile
Real-time Updates - Fast, interactive experience with Next.js


🛠️ Tech Stack
Frontend

Next.js 14 - React framework with App Router
TypeScript - Type-safe development
Tailwind CSS - Utility-first styling
shadcn/ui - Beautiful, accessible components

Backend & Database

Firebase Authentication - Secure user authentication
Firebase Firestore - Real-time NoSQL database
Google Gemini API - AI model for question generation and feedback

Deployment

Vercel - Serverless deployment platform


🚀 Getting Started
Prerequisites

Node.js 18+ installed
Firebase account (free tier works)
Gemini API key

Installation

Clone the repository

bashgit clone https://github.com/Zubiya1805/ai_mock_interview.git
cd ai_mock_interview

Install dependencies

bashnpm install

Set up environment variables

Create a .env.local file in the root directory:
env# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Gemini AI
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key

Run the development server

bashnpm run dev

Open your browser

Navigate to http://localhost:3000

📖 How It Works

Sign Up / Login - Create an account or log in with email
Select Interview Type - Choose the role you're preparing for (e.g., Software Engineer, Data Scientist)
Start Interview - AI generates relevant questions based on your selection
Respond - Answer questions using text or voice input
Get Feedback - Receive instant AI-powered analysis of your responses
Review & Improve - Save your sessions and track improvement over time


🎓 What I Learned
Building this project taught me:

AI Integration - Working with Google Gemini API for natural language processing
Firebase Ecosystem - Implementing authentication and real-time database operations
Next.js App Router - Building modern React applications with server components
TypeScript - Writing type-safe, maintainable code
Responsive Design - Creating mobile-first, accessible user interfaces
Full-Stack Development - Managing both frontend and backend in a single application
Deployment - Deploying and maintaining a production application on Vercel


🔮 Future Enhancements

 Video recording and playback for interview responses
 Multiple interview formats (behavioral, technical, case study)
 Interview analytics dashboard with progress tracking
 Personalized improvement recommendations
 Peer-to-peer mock interviews (connecting users for practice)
 Multi-language support
 Integration with LinkedIn for job-specific preparation
 Mock interview scheduling with reminders


🤝 Contributing
Contributions are welcome! Here's how you can help:

Fork the repository
Create a feature branch (git checkout -b feature/AmazingFeature)
Commit your changes (git commit -m 'Add some AmazingFeature')
Push to the branch (git push origin feature/AmazingFeature)
Open a Pull Request



👤 Author
Zubiya

If you found this project helpful, please give it a star!
Made with ❤️ by Zubiya
