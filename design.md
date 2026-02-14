# Design Document: Pashu-Krishi Rakshak

## Overview

Pashu-Krishi Rakshak is a mobile application that leverages AWS cloud services to provide AI-powered veterinary and crop disease diagnosis for rural farmers in India. The system architecture follows a three-layer design: Edge Layer (mobile device), Intelligence Layer (AWS Bedrock), and Knowledge Layer (vector-indexed manuals). The application prioritizes offline-first capabilities, vernacular language support, and zero-literacy user experience.

The system processes multimodal inputs (video + voice) through AWS Bedrock's multimodal LLM, retrieves relevant medical knowledge from vector databases, and delivers spoken prescriptions in local dialects. This design eliminates the need for custom backend servers while maintaining high diagnostic accuracy and accessibility.

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                      MOBILE APPLICATION                      │
│  ┌────────────────┐  ┌──────────────┐  ┌─────────────────┐ │
│  │ Video Capture  │  │ Audio Capture│  │  Local Storage  │ │
│  │   Component    │  │  Component   │  │    Component    │ │
│  └────────┬───────┘  └──────┬───────┘  └────────┬────────┘ │
│           │                  │                    │          │
│           └──────────────────┴────────────────────┘          │
│                              │                               │
│                    ┌─────────▼─────────┐                    │
│                    │  Network Manager  │                    │
│                    │   (Retry Logic)   │                    │
│                    └─────────┬─────────┘                    │
└──────────────────────────────┼──────────────────────────────┘
                               │ HTTPS
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                        AWS CLOUD LAYER                       │
│                                                              │
│  ┌──────────────────┐      ┌─────────────────────────────┐ │
│  │ Amazon Transcribe│      │    AWS Bedrock (Nova)       │ │
│  │  (Speech-to-Text)│      │   Multimodal LLM + RAG      │ │
│  └────────┬─────────┘      └──────────┬──────────────────┘ │
│           │                            │                    │
│           │                   ┌────────▼────────┐          │
│           │                   │ Bedrock KB API  │          │
│           │                   │ (Vector Search) │          │
│           │                   └────────┬────────┘          │
│           │                            │                    │
│  ┌────────▼─────────┐         ┌───────▼────────┐          │
│  │  Amazon Polly    │         │   Amazon S3    │          │
│  │ (Text-to-Speech) │         │ (Manual Store) │          │
│  └──────────────────┘         └────────────────┘          │
└──────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Capture Phase**: User records video (3-60s) with simultaneous audio in local dialect
2. **Local Processing**: Video compressed if >50MB; stored locally until network available
3. **Transcription**: Audio sent to Amazon Transcribe → returns text in standardized format
4. **Diagnosis**: Video + transcribed text sent to AWS Bedrock multimodal LLM
5. **Knowledge Retrieval**: Bedrock queries Knowledge Base (vector search) for relevant veterinary/agricultural documents
6. **Response Generation**: LLM generates diagnosis with confidence score and prescription
7. **Speech Synthesis**: Amazon Polly converts diagnosis to speech in farmer's dialect
8. **Playback**: Mobile app plays audio response automatically

### Technology Stack

**Mobile Layer:**
- React Native or Flutter (cross-platform mobile development)
- Native camera/microphone APIs
- Local SQLite for offline storage
- Network connectivity monitoring

**AWS Services:**
- AWS Bedrock (Nova multimodal model for video + text processing)
- Bedrock Knowledge Bases (RAG with vector embeddings)
- Amazon Transcribe (speech-to-text with dialect support)
- Amazon Polly (text-to-speech with dialect support)
- Amazon S3 (document storage and versioning)
- AWS IAM (authentication and authorization)

**Supported Dialects:**
Hindi, Tamil, Telugu, Bengali, Marathi, Gujarati, Kannada, Malayalam, Punjabi, Odia

## Components and Interfaces

### 1. Video Capture Component

**Responsibilities:**
- Manage camera access and video recording
- Enforce duration constraints (3-60 seconds)
- Compress video if file size exceeds 50MB
- Store video locally until transmission

**Interface:**
```typescript
interface VideoCaptureComponent {
  startRecording(): Promise<void>
  stopRecording(): Promise<VideoFile>
  getRecordingDuration(): number
  compressVideo(video: VideoFile): Promise<VideoFile>
}

interface VideoFile {
  filePath: string
  durationSeconds: number
  fileSizeBytes: number
  timestamp: Date
}
```

**Key Behaviors:**
- Automatically stops recording at 60 seconds
- Validates minimum 3-second duration
- Compresses using H.264 codec with quality preservation
- Generates unique file identifiers

### 2. Audio Capture Component

**Responsibilities:**
- Capture audio simultaneously with video
- Store audio separately for transcription
- Handle audio format conversion

**Interface:**
```typescript
interface AudioCaptureComponent {
  startRecording(): Promise<void>
  stopRecording(): Promise<AudioFile>
  getAudioFormat(): AudioFormat
}

interface AudioFile {
  filePath: string
  durationSeconds: number
  format: AudioFormat
  timestamp: Date
}

enum AudioFormat {
  WAV,
  MP3,
  AAC
}
```

### 3. Local Storage Component

**Responsibilities:**
- Persist video and audio files locally
- Manage storage quota
- Track pending uploads
- Clean up processed files

**Interface:**
```typescript
interface LocalStorageComponent {
  saveVideo(video: VideoFile): Promise<string>
  saveAudio(audio: AudioFile): Promise<string>
  getStoredFiles(): Promise<StoredFile[]>
  deleteFile(fileId: string): Promise<void>
  getAvailableSpace(): Promise<number>
}

interface StoredFile {
  fileId: string
  type: 'video' | 'audio'
  filePath: string
  uploadStatus: 'pending' | 'uploading' | 'completed' | 'failed'
  createdAt: Date
}
```

### 4. Network Manager Component

**Responsibilities:**
- Monitor network connectivity
- Queue uploads when offline
- Implement retry logic with exponential backoff
- Handle upload failures gracefully

**Interface:**
```typescript
interface NetworkManager {
  isConnected(): boolean
  uploadVideo(video: VideoFile): Promise<UploadResult>
  uploadAudio(audio: AudioFile): Promise<UploadResult>
  retryFailedUploads(): Promise<void>
  getConnectionStatus(): ConnectionStatus
}

interface UploadResult {
  success: boolean
  uploadId?: string
  error?: string
}

interface ConnectionStatus {
  isConnected: boolean
  connectionType: 'wifi' | 'cellular' | 'none'
  signalStrength: number
}
```

**Retry Logic:**
- Attempt 1: Immediate
- Attempt 2: 2 seconds delay
- Attempt 3: 4 seconds delay
- After 3 failures: notify user

### 5. Transcription Service Adapter

**Responsibilities:**
- Interface with Amazon Transcribe
- Handle dialect detection and specification
- Process transcription results
- Handle transcription errors

**Interface:**
```typescript
interface TranscriptionService {
  transcribe(audio: AudioFile, dialect: Dialect): Promise<TranscriptionResult>
  detectDialect(audio: AudioFile): Promise<Dialect>
}

interface TranscriptionResult {
  text: string
  confidence: number
  detectedDialect: Dialect
  alternativeTranscriptions?: string[]
}

enum Dialect {
  HINDI,
  TAMIL,
  TELUGU,
  BENGALI,
  MARATHI,
  GUJARATI,
  KANNADA,
  MALAYALAM,
  PUNJABI,
  ODIA
}
```

### 6. Diagnosis Service

**Responsibilities:**
- Send video and transcription to AWS Bedrock
- Query Knowledge Base for relevant documents
- Parse diagnosis response
- Extract confidence score and prescription

**Interface:**
```typescript
interface DiagnosisService {
  diagnose(video: VideoFile, transcription: string): Promise<DiagnosisResult>
  queryKnowledgeBase(query: string, subjectType: SubjectType): Promise<Document[]>
}

interface DiagnosisResult {
  diseaseIdentification: string
  prescription: Prescription
  confidenceScore: number
  subjectType: SubjectType
  recommendHumanVet: boolean
  rawResponse: string
}

interface Prescription {
  medicineNames: string[]
  dosages: Dosage[]
  careSt steps: string[]
  estimatedCost?: string
}

interface Dosage {
  medicine: string
  amount: string
  frequency: string
  duration: string
}

enum SubjectType {
  COW,
  LAMB,
  SHEEP,
  DOG,
  CROP
}

interface Document {
  content: string
  source: string
  relevanceScore: number
}
```

### 7. Speech Synthesis Service

**Responsibilities:**
- Convert diagnosis text to speech
- Match dialect to user's input
- Handle audio playback
- Provide replay functionality

**Interface:**
```typescript
interface SpeechSynthesisService {
  synthesize(text: string, dialect: Dialect): Promise<AudioFile>
  play(audio: AudioFile): Promise<void>
  pause(): void
  resume(): void
  stop(): void
}
```

### 8. Knowledge Base Manager

**Responsibilities:**
- Manage veterinary and agricultural document uploads
- Trigger vector embedding generation
- Handle document versioning
- Monitor indexing status

**Interface:**
```typescript
interface KnowledgeBaseManager {
  uploadDocument(document: Document, category: DocumentCategory): Promise<string>
  deleteDocument(documentId: string): Promise<void>
  getIndexingStatus(): Promise<IndexingStatus>
  listDocuments(category: DocumentCategory): Promise<DocumentMetadata[]>
}

enum DocumentCategory {
  VETERINARY_LIVESTOCK,
  VETERINARY_DOGS,
  AGRICULTURE_PESTS,
  AGRICULTURE_DISEASES
}

interface IndexingStatus {
  totalDocuments: number
  indexedDocuments: number
  lastIndexedAt: Date
  isIndexing: boolean
}

interface DocumentMetadata {
  documentId: string
  title: string
  category: DocumentCategory
  uploadedAt: Date
  version: number
}
```

## Data Models

### DiagnosisRequest

```typescript
interface DiagnosisRequest {
  requestId: string
  videoFile: VideoFile
  audioFile: AudioFile
  transcription: string
  detectedDialect: Dialect
  timestamp: Date
  deviceId: string
}
```

### DiagnosisResponse

```typescript
interface DiagnosisResponse {
  requestId: string
  diagnosis: DiagnosisResult
  speechAudio: AudioFile
  processingTimeMs: number
  timestamp: Date
}
```

### UserSession

```typescript
interface UserSession {
  sessionId: string
  deviceId: string
  preferredDialect?: Dialect
  diagnosisHistory: DiagnosisHistoryEntry[]
  createdAt: Date
  lastActiveAt: Date
}

interface DiagnosisHistoryEntry {
  requestId: string
  subjectType: SubjectType
  diseaseIdentified: string
  confidenceScore: number
  timestamp: Date
}
```

### ErrorLog

```typescript
interface ErrorLog {
  errorId: string
  errorType: ErrorType
  errorMessage: string
  component: string
  timestamp: Date
  deviceId: string
  requestId?: string
}

enum ErrorType {
  VIDEO_CAPTURE_FAILED,
  AUDIO_CAPTURE_FAILED,
  TRANSCRIPTION_FAILED,
  DIAGNOSIS_FAILED,
  NETWORK_ERROR,
  STORAGE_ERROR,
  SPEECH_SYNTHESIS_FAILED
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property 1: Video Duration Validation

*For any* video recording session, the recorded video duration should be between 3 and 60 seconds inclusive, and user-terminated recordings before 60 seconds should always be accepted.

**Validates: Requirements 1.1, 1.2, 1.3**

### Property 2: Local Storage Before Transmission

*For any* completed video recording, the video file should exist in local storage before any network transmission attempt is made.

**Validates: Requirements 1.4**

### Property 3: Large Video Compression

*For any* video file exceeding 50MB, the system should compress the file, and the compressed file size should be less than or equal to 50MB.

**Validates: Requirements 1.5**

### Property 4: Simultaneous Audio-Video Capture

*For any* recording session, the audio and video timestamps should overlap, indicating simultaneous capture.

**Validates: Requirements 2.1**

### Property 5: Transcription Request Triggered

*For any* completed audio capture, a transcription request to Amazon Transcribe should be initiated.

**Validates: Requirements 2.2**

### Property 6: Transcription Output Format

*For any* successful transcription, the result should be a non-empty string in standardized text format.

**Validates: Requirements 2.3**

### Property 7: Dialect Support Coverage

*For any* of the 10 supported dialects (Hindi, Tamil, Telugu, Bengali, Marathi, Gujarati, Kannada, Malayalam, Punjabi, Odia), the system should successfully process both input transcription and output speech synthesis.

**Validates: Requirements 2.4, 6.5**

### Property 8: Empty Transcription Error Handling

*For any* transcription that returns empty or null text, the system should display a re-record notification to the farmer.

**Validates: Requirements 2.5**

### Property 9: Multimodal API Single Call

*For any* diagnosis request, both video and transcription text should be sent to AWS Bedrock in a single API call payload.

**Validates: Requirements 3.1**

### Property 10: Knowledge Base Query Execution

*For any* diagnosis processing by the Multimodal LLM, at least one query to the Knowledge Base should be executed.

**Validates: Requirements 3.2**

### Property 11: Diagnosis Structure Completeness

*For any* successful diagnosis response, the response should contain all three required fields: disease/pest identification, prescription details, and confidence score.

**Validates: Requirements 3.4**

### Property 12: LLM Error Handling

*For any* failed Multimodal LLM processing attempt, an error message should be returned to the farmer.

**Validates: Requirements 3.5**

### Property 13: Confidence Score Range

*For any* generated diagnosis, the confidence score should be a number between 0 and 100 inclusive.

**Validates: Requirements 4.1**

### Property 14: Confidence-Based Recommendations

*For any* diagnosis, if the confidence score is below 60%, a veterinarian consultation recommendation should be present; if 60% or above, the prescription should be marked as actionable; if below 30%, an explicit high-uncertainty warning should be included.

**Validates: Requirements 4.2, 4.3, 11.4**

### Property 15: Confidence Score Display

*For any* diagnosis displayed to the user, the confidence score should be present in the UI rendering.

**Validates: Requirements 4.4**

### Property 16: Low-Confidence Diagnosis Inclusion

*For any* response that recommends consulting a human veterinarian, the AI-generated diagnosis should still be included in the response.

**Validates: Requirements 4.5**

### Property 17: High-Confidence Prescription Content

*For any* diagnosis with confidence score ≥ 60%, the prescription should include specific medicine names, exact dosages, and immediate home care steps.

**Validates: Requirements 5.1, 5.2, 5.3**

### Property 18: Speech Synthesis Triggered

*For any* generated diagnosis, a speech synthesis request to Amazon Polly should be initiated.

**Validates: Requirements 6.1**

### Property 19: Dialect Consistency

*For any* diagnosis response, the output speech dialect should match the detected input dialect from the farmer's audio.

**Validates: Requirements 6.2**

### Property 20: Automatic Playback

*For any* generated speech output, playback should start automatically without requiring user interaction.

**Validates: Requirements 6.3**

### Property 21: Replay Option Availability

*For any* completed speech playback, a replay option should be available in the UI.

**Validates: Requirements 6.4**

### Property 22: Subject Type Support

*For any* input featuring cows, lambs, sheep, dogs, or crop plants, the system should successfully process and diagnose the subject.

**Validates: Requirements 7.1, 7.2**

### Property 23: Automatic Subject Classification

*For any* video input, the system should classify it as either livestock or crop, or prompt the user to specify if classification confidence is insufficient.

**Validates: Requirements 7.3, 7.4**

### Property 24: Offline Capture Capability

*For any* video and audio capture session, the capture should succeed regardless of network connectivity status.

**Validates: Requirements 8.1**

### Property 25: Local Persistence Until Upload

*For any* completed recording, the video file should remain in local storage until successful transmission to AWS services.

**Validates: Requirements 8.2**

### Property 26: Automatic Upload on Reconnection

*For any* stored files when network connectivity transitions from unavailable to available, upload attempts should be automatically initiated.

**Validates: Requirements 8.3**

### Property 27: Connectivity Status Display

*For any* application state, the current network connectivity status should be visible in the UI.

**Validates: Requirements 8.4**

### Property 28: Retry Logic with Exponential Backoff

*For any* failed upload due to network issues, exactly 3 retry attempts should occur with delays of 0s, 2s, and 4s respectively.

**Validates: Requirements 8.5**

### Property 29: Knowledge Base Vector Storage

*For any* uploaded veterinary or agricultural manual, the document should be stored as vector embeddings in AWS Bedrock Knowledge Bases.

**Validates: Requirements 9.1, 9.2**

### Property 30: Knowledge Base Query Result Count

*For any* Knowledge Base query, the system should return up to 5 most relevant document sections (or fewer if less than 5 exist).

**Validates: Requirements 9.3**

### Property 31: Knowledge Base Re-indexing Timing

*For any* Knowledge Base content update, vector embedding re-indexing should complete within 24 hours.

**Validates: Requirements 9.5**

### Property 32: Encrypted Transmission

*For any* network transmission of video or audio to AWS, the connection should use HTTPS encryption.

**Validates: Requirements 10.1**

### Property 33: Raw Data Deletion After Processing

*For any* processed diagnosis request, raw video and audio files should be deleted from AWS servers after processing completes.

**Validates: Requirements 10.2**

### Property 34: Anonymized Analytics Storage

*For any* stored analytics record, it should contain only anonymized metadata (subject type, diagnosis category, timestamp) without personally identifiable information.

**Validates: Requirements 10.3**

### Property 35: Local Data Cleanup on Uninstall

*For any* application deletion/uninstall, all locally stored video and audio files should be removed from the device.

**Validates: Requirements 10.5**

### Property 36: Error Message Display

*For any* system error (video capture failure, transcription failure, API failure), an appropriate error message should be displayed to the farmer in their dialect.

**Validates: Requirements 11.1, 11.2, 11.3**

### Property 37: Error Logging

*For any* system error, a log entry should be created in local storage containing error details without exposing technical information to the farmer.

**Validates: Requirements 11.5**

### Property 38: Diagnosis Response Time

*For any* diagnosis request under normal network conditions, the response from AWS Bedrock should be received within 30 seconds.

**Validates: Requirements 12.1**

### Property 39: Video Compression Performance

*For any* video compression operation, the processing should complete within 5 seconds.

**Validates: Requirements 12.2**

### Property 40: Transcription Performance

*For any* audio file up to 60 seconds in length, Amazon Transcribe should return the transcription within 10 seconds.

**Validates: Requirements 12.3**

### Property 41: Speech Synthesis Performance

*For any* speech synthesis request to Amazon Polly, the audio output should be received within 3 seconds.

**Validates: Requirements 12.4**

### Property 42: Progress Indicator Display

*For any* processing operation that exceeds 2 seconds, a progress indicator should be visible in the UI.

**Validates: Requirements 12.5**

## Error Handling

### Error Categories

1. **Capture Errors**
   - Camera permission denied
   - Microphone permission denied
   - Insufficient storage space
   - Video duration too short (<3s)
   - Video recording interrupted

2. **Network Errors**
   - No connectivity during upload
   - Upload timeout
   - AWS service unavailable
   - API rate limiting

3. **Processing Errors**
   - Transcription failed (unintelligible audio)
   - Transcription empty
   - LLM processing failed
   - Knowledge Base query failed
   - Speech synthesis failed

4. **Data Errors**
   - Corrupted video file
   - Corrupted audio file
   - Invalid response format from AWS
   - Missing required fields in response

### Error Handling Strategies

**Capture Errors:**
- Display clear permission request dialogs in user's dialect
- Check available storage before recording
- Validate duration immediately after recording
- Provide retry option with guidance

**Network Errors:**
- Queue uploads for automatic retry when connectivity returns
- Implement exponential backoff (0s, 2s, 4s delays)
- Display connectivity status prominently
- Allow manual retry after 3 automatic attempts fail

**Processing Errors:**
- For transcription failures: prompt user to speak more clearly and re-record
- For LLM failures: display "service temporarily unavailable" message
- For KB query failures: attempt diagnosis without KB context (lower confidence)
- For speech synthesis failures: display text diagnosis as fallback

**Data Errors:**
- Validate file integrity before upload
- Validate response structure from AWS APIs
- Log detailed error information locally
- Display user-friendly error messages without technical jargon

### Graceful Degradation

1. **No Network**: Allow capture and queue for later upload
2. **KB Unavailable**: Generate diagnosis without KB context (with lower confidence)
3. **Speech Synthesis Failed**: Display text diagnosis
4. **Low Confidence (<60%)**: Provide diagnosis but recommend human vet
5. **Very Low Confidence (<30%)**: Explicitly warn about high uncertainty

## Testing Strategy

### Dual Testing Approach

This system requires both unit testing and property-based testing for comprehensive coverage:

- **Unit tests**: Verify specific examples, edge cases, error conditions, and integration points
- **Property tests**: Verify universal properties across all inputs through randomization

Both approaches are complementary and necessary. Unit tests catch concrete bugs in specific scenarios, while property tests verify general correctness across a wide range of inputs.

### Property-Based Testing

**Framework Selection:**
- For TypeScript/JavaScript: Use `fast-check` library
- For Python (if used for backend utilities): Use `hypothesis` library

**Configuration:**
- Each property test MUST run minimum 100 iterations
- Each test MUST reference its design document property
- Tag format: `Feature: pashu-krishi-rakshak, Property {number}: {property_text}`

**Property Test Examples:**

```typescript
// Example: Property 1 - Video Duration Validation
test('Property 1: Video duration validation', () => {
  fc.assert(
    fc.property(
      fc.integer({ min: 3, max: 60 }), // Valid duration range
      (duration) => {
        const video = createMockVideo(duration);
        const result = validateVideoDuration(video);
        expect(result.isValid).toBe(true);
      }
    ),
    { numRuns: 100 }
  );
  
  // Test invalid durations
  fc.assert(
    fc.property(
      fc.oneof(
        fc.integer({ min: 0, max: 2 }), // Too short
        fc.integer({ min: 61, max: 120 }) // Too long
      ),
      (duration) => {
        const video = createMockVideo(duration);
        const result = validateVideoDuration(video);
        expect(result.isValid).toBe(false);
      }
    ),
    { numRuns: 100 }
  );
});

// Example: Property 13 - Confidence Score Range
test('Property 13: Confidence score range', () => {
  fc.assert(
    fc.property(
      fc.record({
        video: fc.constant(mockVideo),
        transcription: fc.string({ minLength: 10, maxLength: 500 })
      }),
      async ({ video, transcription }) => {
        const diagnosis = await diagnosisService.diagnose(video, transcription);
        expect(diagnosis.confidenceScore).toBeGreaterThanOrEqual(0);
        expect(diagnosis.confidenceScore).toBeLessThanOrEqual(100);
      }
    ),
    { numRuns: 100 }
  );
});
```

### Unit Testing

**Focus Areas:**
- Specific dialect examples (test each of the 10 supported dialects)
- Edge cases: empty transcription, corrupted files, network timeouts
- Error conditions: permission denied, storage full, API failures
- Integration points: AWS service mocking and response validation
- UI rendering: confidence score display, error messages, progress indicators

**Unit Test Examples:**

```typescript
// Test specific dialect
test('Hindi dialect transcription and synthesis', async () => {
  const hindiAudio = loadTestAudio('hindi_sample.wav');
  const transcription = await transcriptionService.transcribe(hindiAudio, Dialect.HINDI);
  expect(transcription.detectedDialect).toBe(Dialect.HINDI);
  
  const speech = await speechService.synthesize(transcription.text, Dialect.HINDI);
  expect(speech).toBeDefined();
});

// Test edge case: empty transcription
test('Empty transcription triggers re-record prompt', async () => {
  const emptyTranscription = { text: '', confidence: 0, detectedDialect: Dialect.HINDI };
  const result = await handleTranscriptionResult(emptyTranscription);
  expect(result.shouldPromptReRecord).toBe(true);
  expect(result.errorMessage).toContain('speak more clearly');
});

// Test error condition: network timeout
test('Network timeout triggers retry logic', async () => {
  const mockNetworkManager = createMockNetworkManager({ simulateTimeout: true });
  const video = createMockVideo(10);
  
  const uploadPromise = mockNetworkManager.uploadVideo(video);
  
  await expect(uploadPromise).rejects.toThrow();
  expect(mockNetworkManager.getRetryCount()).toBe(3);
});
```

### Integration Testing

**Test Scenarios:**
1. End-to-end flow: capture → transcribe → diagnose → synthesize → playback
2. Offline-to-online transition: capture offline → detect connectivity → auto-upload
3. Error recovery: failed upload → retry → success
4. Low confidence flow: diagnosis → confidence <60% → vet recommendation displayed

### Performance Testing

**Benchmarks:**
- Video compression: <5 seconds for 50MB files
- Transcription: <10 seconds for 60-second audio
- Diagnosis: <30 seconds end-to-end
- Speech synthesis: <3 seconds

**Load Testing:**
- Simulate multiple concurrent users
- Test Knowledge Base query performance under load
- Verify retry logic doesn't cause cascading failures

### Security Testing

**Test Cases:**
- Verify HTTPS encryption for all AWS communications
- Confirm raw data deletion after processing
- Validate anonymization of analytics data
- Test permission handling for camera/microphone
- Verify local data cleanup on app uninstall

## Implementation Notes

### AWS Bedrock Configuration

**Model Selection:**
- Use AWS Bedrock Nova multimodal model for video + text processing
- Configure model with veterinary and agricultural domain context
- Set temperature to 0.3 for consistent, factual responses

**Knowledge Base Setup:**
1. Create two separate knowledge bases:
   - Veterinary KB: livestock disease manuals
   - Agricultural KB: crop pest and disease manuals
2. Upload PDF/text documents to S3
3. Configure vector embedding generation (Amazon Titan Embeddings)
4. Set up retrieval configuration (top-k=5)

### Dialect Mapping

**Amazon Transcribe Language Codes:**
- Hindi: `hi-IN`
- Tamil: `ta-IN`
- Telugu: `te-IN`
- Bengali: `bn-IN`
- Marathi: `mr-IN`
- Gujarati: `gu-IN`
- Kannada: `kn-IN`
- Malayalam: `ml-IN`
- Punjabi: `pa-IN`
- Odia: `or-IN`

**Amazon Polly Voice IDs:**
- Hindi: `Aditi` or `Kajal`
- Tamil: `Aditi` (supports Tamil)
- Other dialects: Map to closest available Polly voice

### Mobile App Framework

**Recommended: React Native**
- Cross-platform (iOS + Android)
- Good camera/microphone API support
- Strong AWS SDK integration
- Large community and library ecosystem

**Key Libraries:**
- `react-native-camera` or `expo-camera`: Video/audio capture
- `aws-sdk` or `@aws-sdk/client-*`: AWS service integration
- `@react-native-async-storage/async-storage`: Local persistence
- `@react-native-community/netinfo`: Network connectivity monitoring
- `react-native-sound`: Audio playback

### Video Compression

**Strategy:**
- Use H.264 codec with CRF 23-28 (balance quality and size)
- Target resolution: 720p (sufficient for visual diagnosis)
- Frame rate: 15-24 fps (lower than standard to reduce size)
- Use hardware acceleration when available

**Library:**
- `react-native-video-processing` or `ffmpeg-kit-react-native`

### Offline Storage

**SQLite Schema:**

```sql
CREATE TABLE recordings (
  id TEXT PRIMARY KEY,
  video_path TEXT NOT NULL,
  audio_path TEXT NOT NULL,
  duration_seconds INTEGER NOT NULL,
  file_size_bytes INTEGER NOT NULL,
  upload_status TEXT NOT NULL, -- 'pending', 'uploading', 'completed', 'failed'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  uploaded_at TIMESTAMP
);

CREATE TABLE diagnoses (
  id TEXT PRIMARY KEY,
  recording_id TEXT REFERENCES recordings(id),
  disease_identification TEXT NOT NULL,
  confidence_score REAL NOT NULL,
  subject_type TEXT NOT NULL,
  prescription_json TEXT NOT NULL,
  speech_audio_path TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE error_logs (
  id TEXT PRIMARY KEY,
  error_type TEXT NOT NULL,
  error_message TEXT NOT NULL,
  component TEXT NOT NULL,
  recording_id TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### AWS IAM Permissions

**Required Permissions:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "bedrock:Retrieve"
      ],
      "Resource": [
        "arn:aws:bedrock:*:*:model/*",
        "arn:aws:bedrock:*:*:knowledge-base/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "transcribe:StartTranscriptionJob",
        "transcribe:GetTranscriptionJob"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "polly:SynthesizeSpeech"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject"
      ],
      "Resource": "arn:aws:s3:::pashu-krishi-knowledge-base/*"
    }
  ]
}
```

### Prompt Engineering for Diagnosis

**System Prompt Template:**
```
You are a veterinary and agricultural expert AI assistant helping rural farmers in India diagnose livestock diseases and crop pests. 

Context: You will receive a video of an animal or crop along with a verbal description of symptoms from the farmer.

Your task:
1. Analyze the visual symptoms in the video
2. Consider the verbal description provided
3. Query the knowledge base for relevant medical/agricultural information
4. Provide a diagnosis with:
   - Disease/pest identification
   - Confidence score (0-100%)
   - Specific medicine names and dosages
   - Immediate home care steps
   - Whether to consult a veterinarian (if confidence <60%)

Requirements:
- Use simple, non-technical language
- Provide specific, actionable guidance
- Prioritize affordable and accessible treatments
- Be honest about uncertainty (low confidence scores)
- Consider the subject type (cow, lamb, sheep, dog, or crop)

Format your response as JSON:
{
  "diseaseIdentification": "string",
  "confidenceScore": number,
  "subjectType": "cow|lamb|sheep|dog|crop",
  "prescription": {
    "medicines": [{"name": "string", "dosage": "string", "frequency": "string", "duration": "string"}],
    "careSteps": ["string"]
  },
  "recommendHumanVet": boolean
}
```

### Deployment Considerations

**Mobile App Distribution:**
- Publish to Google Play Store (primary target: Android users in rural India)
- Consider offline APK distribution for areas with limited Play Store access
- Optimize app size (<50MB) for users with limited storage

**AWS Infrastructure:**
- Deploy in `ap-south-1` (Mumbai) region for lowest latency to India
- Use AWS CloudWatch for monitoring and alerting
- Set up AWS Cost Explorer alerts to monitor usage costs
- Consider AWS Free Tier limits for initial deployment

**Scalability:**
- Bedrock and managed services auto-scale
- Monitor Knowledge Base query performance
- Implement caching for common diagnoses
- Consider CDN for app distribution

**Cost Optimization:**
- Use S3 Intelligent-Tiering for knowledge base documents
- Implement request batching where possible
- Monitor Bedrock token usage
- Set up billing alerts
