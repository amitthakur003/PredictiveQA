QA Insights Hub: AI-Driven Predictive Quality Assurance
QA Insights Hub is an intelligent test analytics dashboard designed to optimize software testing cycles. Instead of blindly retesting everything, it uses Generative AI and Mathematical Risk Scoring to predict which features are most likely to fail, recommending targeted "Full" or "Partial" retests.

This project moves beyond simple reporting by providing actionable Root Cause Analysis (RCA) for failures and predicting future risks based on historical build trends.

🌟 Key Features
1. 🤖 AI-Powered Root Cause Analysis
Manually analyzing failed test scripts is time-consuming. This system automates it:

Selective AI: The system intelligently filters test cases. Passing tests are stored directly, while failing tests (scripts + error logs) are sent to the Gemini AI API.

Context-Aware: The AI acts as a "Senior SDET," analyzing the specific Build, Module, and Feature context.

Output: Delivers a precise 1-sentence root cause and a specific code fix directly in the UI.

2. 🔮 Predictive Risk Scoring (The "Math" Logic)
The system calculates a dynamic Risk Score (0-100%) for every feature to guide testing efforts.

Weighted Moving Average: Analyzes the last 5 Release Cycles. Recent builds are given higher weight (Weight 5) than older builds (Weight 1) to accurately reflect current stability.

Trend Detection: Identifies if bug density is trending "Up" (deteriorating) or "Down" (improving).

Smart Recommendations:

🔴 Full Retest: High Risk (>60%) or critical recent failures.

🟡 Partial Retest: Moderate Risk.

🟢 No Retest: Stable feature.

3. 🏗️ Release Cycle Management
Hierarchical Data: Manages data across Builds → Modules → Features → Test Cases.

Historical Vault: A persistent archive of all past bugs, allowing for comprehensive regression testing during major releases.

Real-time Metrics: Visualizes pass/fail rates and severity distribution (P1/P2/P3).

🛠️ Technical Architecture
The project is built using a modern MERN-style stack:

Frontend: React (Vite) + Tailwind CSS + Shadcn UI + Recharts.

Backend: Node.js + Express.

Database: MongoDB (Storing hierarchical build data & AI insights).

AI Engine: Google Gemini 1.5 Flash (via REST API).

How It Works (The Flow)
Ingestion: User uploads a complex JSON dataset representing a Build (including Selenium test scripts and logs).

Processing:

The backend iterates through thousands of test cases.

Optimization: Only failed tests trigger the AI service to save costs and latency.

Calculation:

The system retrieves the history of that feature from the last 5 builds.

It applies a permutation/combination logic of weights to derive a Risk Score.

Visualization: The frontend renders these insights, allowing QA leads to see "What broke," "Why it broke (AI)," and "What to test next."

🚀 Getting Started
Prerequisites
Node.js (v18+)

MongoDB (Running locally or Atlas)

Google Gemini API Key

Installation
Clone the Repository

Bash

git clone https://github.com/yourusername/qa-insights-hub.git
cd qa-insights-hub
Setup Backend

Bash

cd server
npm install
# Create a .env file with:
# PORT=4000
# MONGO_URI=mongodb://localhost:27017//YourDB
# GEMINI_API_KEY=Your_Google_Gemini_Key
npm run dev
Setup Frontend

Bash

cd client
npm install
npm run dev
Usage

Navigate to http://localhost:8080.

Click "Upload Demo Data" on the dashboard to simulate a release cycle.

Visit "Feature Risk" to see the predictive scoring in action.

🔮 Future Roadmap
Integration with JIRA for auto-bug reporting.

Integration with Jenkins/GitHub Actions for automated ingestion.

Customizable weighting logic for different project types.
