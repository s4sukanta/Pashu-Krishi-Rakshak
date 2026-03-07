# Requirements Document: Pashu-Krishi Rakshak

## Introduction

Pashu-Krishi Rakshak is a smartphone-based AI "Rural Doctor" application that provides instant veterinary and crop disease diagnosis for rural farmers in India. The system addresses the critical shortage of veterinary experts (approximately 1 veterinarian per 50,000 livestock animals) and prevents economic losses estimated at ₹15,000 crore annually from preventable diseases. The application uses multimodal AI to process video and voice input in local dialects, delivering actionable prescriptions without requiring literacy or backend servers.

## Glossary

- **System**: The Pashu-Krishi Rakshak mobile application and its AWS cloud components
- **Farmer**: The end user who operates the application to diagnose livestock or crop issues
- **Diagnosis**: The AI-generated identification of disease or pest issues with recommended treatment
- **Prescription**: Specific medicine names, dosages, and care instructions provided by the System
- **Confidence_Score**: A numerical measure (0-100%) indicating the AI's certainty in its diagnosis
- **Multimodal_LLM**: AWS Bedrock's large language model that processes video, images, and text inputs
- **Knowledge_Base**: Vector-indexed veterinary and agricultural manuals stored in AWS Bedrock Knowledge Bases
- **Vernacular_Input**: Voice input in rural Indian dialects
- **Transcription**: Text conversion of voice input via Amazon Transcribe
- **Speech_Output**: Audio response generated via Amazon Polly in the Farmer's dialect
- **Subject**: The livestock animal or crop being diagnosed (cow, lamb, sheep, dog, or crop plant)

## Requirements

### Requirement 1: Video Capture and Processing

**User Story:** As a farmer, I want to record a video of my sick animal or diseased crop for as long as needed, so that the System can visually identify symptoms without requiring me to describe them in text.

#### Acceptance Criteria

1. WHEN a Farmer initiates video recording, THE System SHALL allow continuous recording up to 60 seconds
2. WHEN a Farmer stops recording before 60 seconds, THE System SHALL accept the video regardless of length
3. THE System SHALL support video recording with minimum duration of 3 seconds
4. WHEN video recording completes, THE System SHALL store the complete video file locally on the device before transmission
5. WHEN the video file exceeds 50MB, THE System SHALL compress the video while maintaining diagnostic quality

### Requirement 2: Voice Input and Transcription

**User Story:** As a farmer who may be illiterate, I want to describe symptoms in my local dialect while recording video, so that I can communicate without typing or reading menus.

#### Acceptance Criteria

1. WHEN a Farmer speaks during video recording, THE System SHALL capture audio simultaneously with video
2. WHEN audio capture completes, THE System SHALL send the audio to Amazon Transcribe for speech-to-text conversion
3. WHEN Amazon Transcribe processes audio, THE System SHALL receive Transcription text in a standardized language format
4. THE System SHALL support Vernacular_Input in Hindi, Tamil, Telugu, Bengali, Marathi, Gujarati, Kannada, Malayalam, Punjabi, and Odia dialects
5. WHEN Transcription fails or returns empty text, THE System SHALL notify the Farmer to re-record with clearer speech

### Requirement 3: Multimodal AI Diagnosis

**User Story:** As a farmer, I want the System to analyze both what it sees in the video and what I describe verbally, so that I receive an accurate diagnosis combining visual and descriptive symptoms.

#### Acceptance Criteria

1. WHEN video and Transcription are ready, THE System SHALL send both to AWS Bedrock Multimodal_LLM via a single API call
2. WHEN the Multimodal_LLM processes inputs, THE System SHALL query the Knowledge_Base for relevant veterinary or agricultural information
3. WHEN the Knowledge_Base returns relevant documents, THE System SHALL use them to generate a Diagnosis
4. THE System SHALL generate a Diagnosis that includes disease or pest identification, Prescription details, and a Confidence_Score
5. WHEN the Multimodal_LLM cannot process the inputs, THE System SHALL return an error message to the Farmer

### Requirement 4: Confidence-Based Recommendations

**User Story:** As a farmer, I want to know how confident the AI is in its diagnosis, so that I can decide whether to follow the prescription or seek a human veterinarian.

#### Acceptance Criteria

1. WHEN a Diagnosis is generated, THE System SHALL calculate a Confidence_Score between 0% and 100%
2. WHEN the Confidence_Score is below 60%, THE System SHALL recommend that the Farmer consult a human veterinarian
3. WHEN the Confidence_Score is 60% or above, THE System SHALL present the Prescription as actionable guidance
4. THE System SHALL display the Confidence_Score prominently alongside the Diagnosis
5. WHEN recommending a human veterinarian, THE System SHALL still provide the AI-generated Diagnosis for reference

### Requirement 5: Prescription Generation

**User Story:** As a farmer, I want to receive specific medicine names, dosages, and immediate care steps, so that I can treat my animal or crop without needing to interpret medical jargon.

#### Acceptance Criteria

1. WHEN a Diagnosis is generated with Confidence_Score ≥ 60%, THE System SHALL include specific medicine names in the Prescription
2. WHEN medicine names are provided, THE System SHALL include exact dosages appropriate for the Subject type and estimated weight
3. WHEN a Prescription is generated, THE System SHALL include immediate home care steps that can be performed without specialized equipment
4. THE System SHALL format Prescription information in simple, actionable language suitable for non-medical users
5. WHEN multiple treatment options exist, THE System SHALL prioritize the most accessible and affordable option first

### Requirement 6: Vernacular Speech Output

**User Story:** As a farmer who may be illiterate, I want to hear the diagnosis and prescription spoken in my local dialect, so that I can understand and follow the instructions without reading.

#### Acceptance Criteria

1. WHEN a Diagnosis is generated, THE System SHALL convert the Diagnosis text to Speech_Output using Amazon Polly
2. WHEN converting to Speech_Output, THE System SHALL use the same dialect that was detected in the Farmer's Vernacular_Input
3. THE System SHALL play the Speech_Output automatically upon generation without requiring user interaction
4. WHEN Speech_Output playback completes, THE System SHALL provide an option to replay the audio
5. THE System SHALL support Speech_Output in Hindi, Tamil, Telugu, Bengali, Marathi, Gujarati, Kannada, Malayalam, Punjabi, and Odia dialects

### Requirement 7: Subject Type Coverage

**User Story:** As a farmer with diverse agricultural needs, I want to diagnose both livestock diseases and crop pests using the same application, so that I have a single tool for all my farming health concerns.

#### Acceptance Criteria

1. THE System SHALL support diagnosis for cows, lambs, sheep, and dogs as livestock Subject types
2. THE System SHALL support diagnosis for crop plants affected by pests or bacterial contamination
3. WHEN analyzing a Subject, THE System SHALL automatically identify whether it is livestock or a crop based on visual analysis
4. WHEN the Subject type cannot be determined, THE System SHALL prompt the Farmer to specify whether it is an animal or crop
5. THE System SHALL maintain separate Knowledge_Base sections for livestock veterinary information and crop agricultural information

### Requirement 8: Offline-First Architecture

**User Story:** As a farmer in a rural area with intermittent connectivity, I want to capture video and audio locally, so that I can prepare my diagnosis request even when network is unavailable.

#### Acceptance Criteria

1. THE System SHALL allow video and audio capture without requiring active internet connectivity
2. WHEN video recording completes, THE System SHALL store the video file locally until network connectivity is available
3. WHEN network connectivity is detected, THE System SHALL automatically transmit stored video and audio to AWS services
4. THE System SHALL display the current connectivity status to the Farmer
5. WHEN transmission fails due to network issues, THE System SHALL retry automatically up to 3 times with exponential backoff

### Requirement 9: Knowledge Base Management

**User Story:** As a system administrator, I want veterinary and agricultural manuals to be indexed and searchable, so that the AI can retrieve accurate, evidence-based treatment information.

#### Acceptance Criteria

1. THE System SHALL store veterinary manuals as vector embeddings in AWS Bedrock Knowledge_Bases
2. THE System SHALL store agricultural pest and disease manuals as vector embeddings in AWS Bedrock Knowledge_Bases
3. WHEN the Multimodal_LLM queries the Knowledge_Base, THE System SHALL return the top 5 most relevant document sections
4. THE System SHALL back all Knowledge_Base data with Amazon S3 for persistence and versioning
5. WHEN Knowledge_Base content is updated, THE System SHALL re-index vector embeddings within 24 hours

### Requirement 10: Privacy and Data Security

**User Story:** As a farmer, I want my video and voice data to be handled securely, so that my personal information and farm details remain private.

#### Acceptance Criteria

1. WHEN transmitting Key_Frames and audio to AWS, THE System SHALL use encrypted HTTPS connections
2. THE System SHALL not store raw video or audio files on AWS servers after processing completes
3. WHEN a Diagnosis is generated, THE System SHALL store only anonymized metadata (Subject type, diagnosis category, timestamp) for analytics
4. THE System SHALL not share Farmer identity or location data with third parties
5. WHEN a Farmer deletes the application, THE System SHALL remove all locally stored video and audio data

### Requirement 11: Error Handling and User Feedback

**User Story:** As a farmer, I want clear feedback when something goes wrong, so that I understand what to do next without technical knowledge.

#### Acceptance Criteria

1. WHEN video recording fails, THE System SHALL display a message in the Farmer's dialect explaining the issue and suggesting retry
2. WHEN Transcription returns empty or unintelligible text, THE System SHALL prompt the Farmer to speak more clearly and re-record
3. WHEN AWS Bedrock API calls fail, THE System SHALL display a message indicating temporary unavailability and suggest trying again later
4. WHEN the Confidence_Score is below 30%, THE System SHALL explicitly state that the diagnosis is highly uncertain
5. THE System SHALL log all errors locally for diagnostic purposes without exposing technical details to the Farmer

### Requirement 12: Performance and Responsiveness

**User Story:** As a farmer with limited time, I want to receive a diagnosis quickly, so that I can take immediate action to treat my animal or crop.

#### Acceptance Criteria

1. WHEN video and Transcription are transmitted, THE System SHALL receive a Diagnosis from AWS Bedrock within 30 seconds under normal network conditions
2. WHEN compressing video files, THE System SHALL complete processing within 5 seconds
3. WHEN Amazon Transcribe processes audio, THE System SHALL receive Transcription within 10 seconds for up to 60-second audio clips
4. WHEN Amazon Polly generates Speech_Output, THE System SHALL receive audio within 3 seconds
5. THE System SHALL display a progress indicator during all processing steps that exceed 2 seconds
