# HomeJoy Innovation Roadmap & AI/ML Architecture

**Project:** HomeJoy — Elderly Care & Assisted Living Platform  
**Academic Submission:** Master of Computer Applications (MCA)  
**Evaluation Date:** October 7, 2026

---

## 1. Implemented Innovations (P5)

Rather than introducing fragile third-party dependencies or speculative prototypes, HomeJoy incorporates five practical, reliable, and high-impact innovations specifically tailored for geriatric telemetry and caregiver workflows:

### Innovation 1: Personalized Behavioral Baseline
- **Problem:** Conventional systems evaluate health metrics against static population standards (e.g., standard 8 hours of sleep). However, seniors exhibit varied personal baselines.
- **Solution:** The scoring engine analyzes the past 7 days of verified check-in history to establish individual averages for sleep duration and mobility.
- **Implementation:**
  - Evaluates: $\Delta_{\text{sleep}} = \text{today\_sleep} - \text{baseline\_average\_sleep}$
  - User Presentation: e.g., *"Sleep is 2.0 hours below your usual 7.0-hour average."*

### Innovation 2: Missing-Data Telemetry Awareness
- **Problem:** Many digital health dashboards default missing telemetry fields to "Normal" or zero, creating severe clinical blind spots.
- **Solution:** Strict tripartite categorization:
  1. **Healthy / Stable** (Recorded & within normal range)
  2. **At Risk** (Recorded & displaying concerning indicators)
  3. **Not Recorded** (Missing telemetry requiring caregiver follow-up)
- **Implementation:** Daily reports and preview cards explicitly label unrecorded vitals with `"Not recorded"` and `recorded: false`.

### Innovation 3: Explainable Wellness Telemetry Scoring Engine
- **Academic Rigor Notice:** Rather than misrepresenting rule-based logic as a "black-box deep learning model", HomeJoy implements a transparent, explainable scoring engine clearly designated as a **Prototype for Future ML Integration**.
- **Features:**
  - Transparent rule weights for sleep, mood, mobility, appetite, and medication adherence.
  - Generates clear bulleted contributing factors (e.g., *"Low sleep duration (4.0 hrs)"*, *"Poor reported appetite"*).
  - Explicit non-diagnostic disclaimer: *"This scoring engine provides non-diagnostic lifestyle wellness indicators. It does not provide medical diagnosis or replace clinical judgment."*

### Innovation 4: Caregiver Priority Triage Queue
- **Problem:** In large eldercare facilities, caregivers face alert fatigue when scrolling through alphabetical resident rosters.
- **Solution:** An automated triage ordering algorithm:
  $$\text{Priority Rank} = \begin{cases} 
  1 & \text{High Wellness Risk} \\
  2 & \text{Pending Urgent Help Request} \\
  3 & \text{Missed Today's Check-in} \\
  4 & \text{Moderate Wellness Risk} \\
  5 & \text{Low Wellness Risk / Completed}
  \end{cases}$$
- **UI:** A one-click toggle in the Caregiver Portal sorts residents by urgency, surfacing seniors requiring immediate attention first.

### Innovation 5: 9 AM Elderly-Centric Dual-Action Reminder
- **Problem:** Seniors often find complicated notification centers confusing.
- **Solution:** A high-contrast, uncluttered modal that automatically triggers at 9:00 AM IST if today's check-in or vitals are unrecorded. Features large typography and distinct one-click actions:
  - **"Complete Check-in"**
  - **"Enter Health Readings"**

---

## 2. ML Architecture for Future Integration

```
[ Elderly Daily Telemetry & Vitals ]
                 │
                 ▼
    [ Feature Extraction Pipeline ]
    ├── Delta from 7-day Personal Baseline
    ├── Cumulative 14-day Telemetry Trends
    ├── Medication Adherence Frequency
    └── Vitals Dispersion (Systolic / SpO2 Variance)
                 │
                 ▼
    [ Supervised ML Classifier / XGBoost ]  <─── (Future Trained Pipeline)
                 │
                 ▼
    [ SHAP / Explainability Framework ]
                 │
                 ▼
    [ Caregiver Early Warning Alert & Confidence Metric ]
```

### Transition Steps Post-Graduation:
1. **Data Collection & Anonymization:** Accumulate real-world de-identified telemetry from partner assisted living facilities under institutional ethical review.
2. **Feature Engineering:** Build automated feature extractors for vital trend variance and medication omission patterns.
3. **Model Selection:** Benchmark Explainable Boosting Machines (EBM) and XGBoost with TreeSHAP for human-interpretable feature importance.
4. **Clinical Advisory:** Formulate model safety thresholds in collaboration with geriatric healthcare providers before introducing automated predictive risk alerts.

---

## 3. Deliberately Excluded Technologies (Scope Guard)

To ensure zero downtime, rock-solid security, and flawless viva demonstration, the following technologies were intentionally rejected:
- **LLM Medical Diagnostic Agents:** Unpredictable hallucination risks and FDA/HIPAA compliance violations.
- **Blockchain Smart Contracts:** Unnecessary compute overhead and latency for elderly telemetry logging.
- **Complex IoT Hardware Emulators:** Fragile dependencies prone to network timeouts during live examiner demonstrations.
- **Microservices & Distributed Queues (Kafka/RabbitMQ):** Monolithic FastAPI architecture provides optimal speed, sub-10ms response times, and straightforward cloud deployment.
