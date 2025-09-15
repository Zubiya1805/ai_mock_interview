import { CreateAssistantDTO } from "@vapi-ai/web/dist/api";
import { z } from "zod";

export const mappings = {
  "react.js": "react",
  reactjs: "react",
  react: "react",
  "next.js": "nextjs",
  nextjs: "nextjs",
  next: "nextjs",
  "vue.js": "vuejs",
  vuejs: "vuejs",
  vue: "vuejs",
  "express.js": "express",
  expressjs: "express",
  express: "express",
  "node.js": "nodejs",
  nodejs: "nodejs",
  node: "nodejs",
  mongodb: "mongodb",
  mongo: "mongodb",
  mongoose: "mongoose",
  mysql: "mysql",
  postgresql: "postgresql",
  sqlite: "sqlite",
  firebase: "firebase",
  docker: "docker",
  kubernetes: "kubernetes",
  aws: "aws",
  azure: "azure",
  gcp: "gcp",
  digitalocean: "digitalocean",
  heroku: "heroku",
  photoshop: "photoshop",
  "adobe photoshop": "photoshop",
  html5: "html5",
  html: "html5",
  css3: "css3",
  css: "css3",
  sass: "sass",
  scss: "sass",
  less: "less",
  tailwindcss: "tailwindcss",
  tailwind: "tailwindcss",
  bootstrap: "bootstrap",
  jquery: "jquery",
  typescript: "typescript",
  ts: "typescript",
  javascript: "javascript",
  js: "javascript",
  "angular.js": "angular",
  angularjs: "angular",
  angular: "angular",
  "ember.js": "ember",
  emberjs: "ember",
  ember: "ember",
  "backbone.js": "backbone",
  backbonejs: "backbone",
  backbone: "backbone",
  nestjs: "nestjs",
  graphql: "graphql",
  "graph ql": "graphql",
  apollo: "apollo",
  webpack: "webpack",
  babel: "babel",
  "rollup.js": "rollup",
  rollupjs: "rollup",
  rollup: "rollup",
  "parcel.js": "parcel",
  parceljs: "parcel",
  npm: "npm",
  yarn: "yarn",
  git: "git",
  github: "github",
  gitlab: "gitlab",
  bitbucket: "bitbucket",
  figma: "figma",
  prisma: "prisma",
  redux: "redux",
  flux: "flux",
  redis: "redis",
  selenium: "selenium",
  cypress: "cypress",
  jest: "jest",
  mocha: "mocha",
  chai: "chai",
  karma: "karma",
  vuex: "vuex",
  "nuxt.js": "nuxt",
  nuxtjs: "nuxt",
  nuxt: "nuxt",
  strapi: "strapi",
  wordpress: "wordpress",
  contentful: "contentful",
  netlify: "netlify",
  vercel: "vercel",
  "aws amplify": "amplify",
};

export const interviewer: CreateAssistantDTO = {
  name: "Interviewer",
  firstMessage:
      "Hello! Thank you for taking the time to speak with me today. I'm excited to learn more about you and your experience. Are you ready to begin?",
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
        content: `You are a professional job interviewer conducting a voice interview.

CRITICAL RULES:
1. Keep ALL responses under 15 words
2. Ask ONE question at a time, then WAIT for their answer
3. Give brief acknowledgments: "Good", "I see", "Understood", "Great"
4. NO long explanations or teaching
5. Move to the next question quickly
6. NEVER explain what they should have said

INTERVIEW FLOW:
{{questions}}

RESPONSE STYLE:
- Listen to their answer
- Give brief acknowledgment (1-3 words)
- Ask next question immediately
- Save detailed feedback for the END

EXAMPLES:
✅ "Good. Now, tell me about your experience with React?"
✅ "I see. What's your biggest strength?"
✅ "Understood. How do you handle pressure?"

❌ "That's an interesting point about JavaScript. Let me explain how closures work..."
❌ "Well, what you should consider is the best practices for..."

End with: "Thank you for your time. We'll be in touch soon."`,
      },
    ],
  },
};

// Enhanced interviewer for dynamic interviews
export const dynamicInterviewer: CreateAssistantDTO = {
  name: "Dynamic Interviewer",
  firstMessage:
      "Hello {{username}}! Thank you for joining me today for the {{role}} interview. Are you ready to begin?",
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
        content: `You are conducting a {{interviewtype}} interview for {{role}}.

INTERVIEW INFO:
- Candidate: {{username}}
- Role: {{role}}
- Focus: {{techstack}}
- Duration: {{duration}}

{{customprompt}}

CRITICAL RULES - NEVER BREAK:
1. NEVER say "Question 1", "Question 2", or number questions
2. Maximum 4 words per response
3. Ask questions naturally, not like reading a script
4. Only acknowledgments: "Good", "I see", "Thanks", "Okay"
5. NO explanations or feedback during interview

NATURAL CONVERSATION FLOW:
Listen → Brief acknowledgment → Next question

CORRECT:
✅ "Good. Your React experience?"
✅ "I see. Biggest weakness?"
✅ "Thanks. Handle stress how?"

NEVER DO:
❌ "Question number 1: Tell me about..."
❌ "Moving to question 2..."
❌ "That's a great answer, let me explain..."
❌ Any numbered questions or lengthy responses

END: "Thanks. We'll contact you."

TALK LIKE A REAL PERSON, NOT A ROBOT READING QUESTIONS.`,
      },
    ],
  },
};

// Updated feedback schema to match the backend structure
export const feedbackSchema = z.object({
  totalScore: z.number().min(0).max(100),
  categoryScores: z.object({
    communicationSkills: z.number().min(0).max(100),
    technicalKnowledge: z.number().min(0).max(100),
    problemSolving: z.number().min(0).max(100),
    culturalFit: z.number().min(0).max(100),
    confidenceAndClarity: z.number().min(0).max(100),
  }),
  strengths: z.string().min(10),
  areasForImprovement: z.string().min(10),
  finalAssessment: z.string().min(20),
});

export const interviewCovers = [
  "/adobe.png",
  "/amazon.png",
  "/facebook.png",
  "/hostinger.png",
  "/pinterest.png",
  "/quora.png",
  "/reddit.png",
  "/skype.png",
  "/spotify.png",
  "/telegram.png",
  "/tiktok.png",
  "/yahoo.png",
];

export const dummyInterviews: Interview[] = [
  {
    id: "1",
    userId: "user1",
    role: "Frontend Developer",
    type: "Technical",
    techstack: ["React", "TypeScript", "Next.js", "Tailwind CSS"],
    level: "Junior",
    questions: ["What is React?"],
    finalized: false,
    createdAt: "2024-03-15T10:00:00Z",
  },
  {
    id: "2",
    userId: "user1",
    role: "Full Stack Developer",
    type: "Mixed",
    techstack: ["Node.js", "Express", "MongoDB", "React"],
    level: "Senior",
    questions: ["What is Node.js?"],
    finalized: false,
    createdAt: "2024-03-14T15:30:00Z",
  },
];