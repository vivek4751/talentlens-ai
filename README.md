# TalentLens AI

TalentLens AI is a resume screening project that helps recruiters compare candidates with job descriptions. The idea is to make it easier to review resumes, find suitable candidates and understand why a candidate matches a role.

[Visit the website](https://talentlens-ai-gray.vercel.app/)

## What it does

- **Resume upload:** Reads PDF resumes and extracts skills, education and work experience.
- **Job descriptions:** Lets recruiters add jobs and identify the requirements for each role.
- **Candidate ranking:** Compares resumes with a job description and ranks candidates by their match score.
- **Score breakdown:** Shows how skills, experience, education and other factors contribute to a match.
- **Candidate comparison:** Compares up to three candidates using radar charts.
- **Recruiter decisions:** Supports shortlisting, rejection and notes for each candidate–job match.
- **Analytics:** Includes a candidate leaderboard, skill gaps, score distribution, role summaries and a review/shortlist funnel.
- **Search and filters:** Helps recruiters find candidates by name, skills, role, decision and minimum match score.
- **Export:** Downloads candidate results as CSV or Excel files.
- **Candidate account:** Allows candidates to manage their profile, upload a resume and check application status.

## How it works

1. A recruiter adds a job description.
2. Resumes are uploaded and converted into structured candidate profiles.
3. The matching engine compares each profile with the job requirements.
4. The recruiter reviews rankings, compares candidates and saves decisions.

Updating a resume or job description refreshes the matching results. A match score shows alignment with a role; it is not a percentage of hiring accuracy.

## Tech stack

| Part | Technology |
| --- | --- |
| Website | Next.js, React, TypeScript and Tailwind CSS |
| Backend | Next.js API routes |
| Database | PostgreSQL, Prisma and pgvector |
| Resume parsing and semantic matching | Google Gemini and embeddings |
| Authentication | NextAuth |
| Charts | Recharts |
| Hosting | Vercel |

## Android companion

The repository also includes an Android companion built with React Native and Expo. It connects to the same backend for sign-in, resume uploads, profiles, jobs and rankings.
