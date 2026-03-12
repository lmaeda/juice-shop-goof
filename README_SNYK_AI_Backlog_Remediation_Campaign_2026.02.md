# README_SNYK_AI_Backlog_Remediation_Campaign_2026.02.md

## Overview
The Snyk AI Backlog Remediation Campaign is the answer to the challenge of tackling persistent security issues accumulating in the backlog. Individual security issues often aren't critical enough for immediate attention, yet the security backlog poses a continuously escalating risk if neglected. 

By dedicating a single engineering sprint to intensive, AI-powered remediation, teams can quickly clear critical vulnerabilities, establishing a modern, scalable security workflow. This combination of Snyk and AI assistants will ensure developers maintain velocity while preventing security vulnerabilities.

## Who Should Attend
* AppSec
* Engineering Managers
* "Security Champions" within the Engineering Team

## AI Backlog Remediation Strategy: Order of Fixes
To maximize efficiency and minimize rework during the Hackathon sprint, AI agents and developers should tackle vulnerabilities in a specific sequence. We recommend the following "inside-out" approach:

### 1. Open Source (SCA)
* **Why First:** Third-party dependency vulnerabilities are often the most pervasive and easiest to fix via version bumps. Upgrading an open-source package can sometimes natively resolve downstream code or container issues.
* **AI Action:** Use the AI agent to analyze dependency trees and propose minimal-risk upgrade paths (preferring patch/minor version bumps) to clear known CVEs without introducing breaking changes.

### 2. Code (SAST)
* **Why Second:** Once the foundation (dependencies) is secure, focus on the proprietary business logic. Fixing custom code logic relies on the stability of the underlying packages.
* **AI Action:** Instruct the AI agent to analyze data flow for vulnerabilities like SQL Injection, XSS, or path traversal. The agent should formulate minimal code diffs to sanitize inputs, manage memory, or patch structural flaws while conforming to the existing repository style.

### 3. Container
* **Why Third:** Containers wrap your application code and dependencies. Fixing the application layer first ensures you aren't continually rebuilding containers to test code-level fixes.
* **AI Action:** Use the AI to analyze Dockerfiles and container manifests. The agent should recommend secure, minimal base images (e.g., migrating to Alpine or distroless images) and apply updates to OS-level packages to clear container-specific vulnerabilities.

### 4. Infrastructure as Code (IaC)
* **Why Fourth:** Infrastructure configurations (Terraform, Kubernetes manifests, CloudFormation) dictate how your application is deployed and exposed to the world. Secure the deployment environment last, ensuring it properly restricts access to the newly secured application.
* **AI Action:** Have the AI agent scan IaC templates for misconfigurations (e.g., overly permissive IAM roles, exposed ports, missing encryption). The agent should propose hardened configurations adhering to the principle of least privilege.

## Campaign Workflow & Integration Guide

### Phase 1: Planning Phase & Repository Setup
* Work with your Snyk team to strategically align on remediation goals and target applications, assist in identifying which developers to select for the campaign, and discuss ways in which we can measure progress.
* You will need developers who leverage AI Coding Assistants and developers who can dedicate a sprint to tackling the security backlog.
* **System Prompt Setup (GEMINI.md):** Before coding begins, commit the previously generated `GEMINI.md` file to the root directory of all target repositories. *How to utilize it:* This file acts as a persistent, passive guardrail. When the AI agent interacts with the codebase, it will read this file and automatically apply your zero-breakage and verification constraints without needing constant reminders.

### Phase 2: Engagement Kickoff
* We will begin the engagement with a kickoff call, which will include going through the target remediation goal, and GenAI Hands-on workshop.
* This hands-on GenAI Workshop will equip engineers with the knowledge and tools to consistently check their AI-generated code for security vulnerabilities.

### Phase 3: Execution Sprint (The Hackathon)
* Engage in a "Hackathon" style campaign using Snyk Studio and AI coding assistants to quickly remediate important security issues in your backlog, reducing security debt.
* Snyk Studio will provide industry-leading security analysis for AI coding assistants to address security issues with speed.
* **Automating Fixes with the CLI Prompt:** * *When to use:* Use the detailed AI prompt (generated previously) exclusively during this sprint phase. 
  * *How to use:* Execute the prompt via the Google Gemini CLI against specific files or dependency manifests identified by Snyk. Because `GEMINI.md` is already in the root directory, the prompt will act as the "active trigger" for the workflow, while `GEMINI.md` enforces the "safe execution" rules.
* **Pull Request (PR) Initiatives:** * Every automated fix generated by the AI agent must be packaged into a focused Pull Request. 
  * Do not batch dozens of unrelated fixes into one PR. Create atomic PRs per vulnerability (or per package upgrade) to ensure human reviewers and CI/CD pipelines can easily verify that the app hasn't broken.
* Participate in regular check-ins for people to ask questions, share feedback, and track progress.
* Throughout the 1-sprint campaign, weekly office hours and check-ins led by campaign leaders ensure participants have access to the technical resource they need and won’t get stuck.

### Phase 4: Report Readout
* We will end the campaign with a readout of results, which will consist of Agentic IDE usage statistics, and backlog remediation success against the target.