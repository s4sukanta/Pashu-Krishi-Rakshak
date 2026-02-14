# Pashu-Krishi Rakshak: Requirements Document

## 1. Project Overview
**Project Name:** Pashu-Krishi Rakshak (Livestock & Crop Guardian)  
**Domain:** AI for Rural Development / Agritech  
**Problem Statement:** Rural farmers face significant economic losses due to the scarcity of veterinary and agronomy experts. Livestock (cows, buffaloes, sheep) and crops suffer from undiagnosed diseases, and farmers often rely on unverified home remedies, leading to critical asset loss.  

**Solution:** A "Thick Client" mobile solution that acts as an AI-powered "Rural Doctor." It uses **AWS Bedrock (Claude 3.5 Sonnet)** to analyze video/images of sick animals or crops and processes spoken symptoms in local dialects to provide instant, verified medical prescriptions and care advice.

---

## 2. Functional Requirements

### 2.1 Multimodal Diagnosis
* **Video Input:** The system must allow users to record a short video (10-15 seconds) of the sick animal or crop.
* **Image Extraction:** The client application must extract 3-5 key frames from the video to send to the AI model.
* **Visual Analysis:** The AI must identify visual symptoms such as skin lumps, wounds, discoloration, fungal growth, or pest infestation.

### 2.2 Vernacular Voice Interface
* **Voice Input:** The system must accept audio input in rural Indian dialects.
* **Speech-to-Text:** The system must convert spoken input to text for processing.
* **Text-to-Speech Output:** The system must read the final diagnosis and prescription back to the user in their local language.

### 2.3 Medical Reasoning & Prescription
* **Contextual Analysis:** The AI must combine visual evidence with spoken symptoms to rule out false positives (e.g., differentiating an injury-based limp from Foot & Mouth Disease).
* **Verified Knowledge Retrieval (RAG):** The system must fetch treatments **only** from a curated Knowledge Base of government-approved veterinary manuals and agricultural schemes.
* **Safety Guardrails:** The system must refuse to answer non-agricultural queries (e.g., political or human medical advice).

---

## 3. Non-Functional Requirements

### 3.1 Performance
* **Latency:** Diagnosis should be returned within 10-15 seconds of data submission.
* **Bandwidth Efficiency:** The system must work on low-bandwidth rural networks (2G/3G) by processing media on the device (extracting frames) before transmission.

### 3.2 Reliability & Accuracy
* **Hallucination Control:** The system must cite the specific veterinary manual page used for the prescription.
* **Confidence Scoring:** If the AI confidence is below 70%, it must recommend seeing a human doctor immediately.

### 3.3 Security
* **Data Privacy:** User videos and audio must be processed securely via HTTPS.
* **Compliance:** Access to AWS Bedrock must be restricted via least-privilege IAM roles.

---

## 4. Technology Stack (Strict Constraint)
* **Core Intelligence:** AWS Bedrock (Anthropic Claude 3.5 Sonnet).
* **Knowledge Base:** AWS Bedrock Knowledge Bases (Vector Search).
* **Development Tool:** Amazon Q Developer (for code generation & infrastructure).
* **Client-Side Logic:** Python (Boto3, OpenCV) running on the edge device.