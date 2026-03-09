# Follow-Up Context Improvement: Visual History for AI Diagnosis

## Problem

When a user does a follow-up diagnosis, the AI receives the **new image** and the **text of previous diagnoses**, but it cannot see the **previous images**. This means it cannot visually compare how a wound, infection, or condition has changed over time — it can only rely on what it previously described in text.

Chat-based AI apps (ChatGPT, Gemini, Claude) send the entire conversation history — including all images — with every request. Our app should move closer to this model for follow-up diagnoses.

## Current Follow-Up Flow

1. Frontend builds a `previousDiagnosis` string from all past visit records (text only)
2. Frontend sends: new image/video + `previousDiagnosis` text + current symptoms
3. Backend injects the text history into a `<CASE_HISTORY>` block in the prompt
4. AI sees: new media + text history of past diagnoses
5. AI cannot visually compare old vs new condition

## Proposed Improvement

### Send Previous Thumbnails with Follow-Up Requests

Each diagnosis record already stores a `thumbnailBase64` field (a small base64-encoded image). On follow-up, send the last 2-3 thumbnails alongside the new media so the AI can visually compare progression.

### Implementation Plan

#### Frontend (`src/app/app/page.tsx` — `handleSubmit`)

When `activeCaseId` is set (follow-up mode):

1. Collect thumbnails from previous records: `activeCase.records.map(r => r.thumbnailBase64).filter(Boolean)`
2. Take the last 2-3 thumbnails (to limit payload size)
3. Convert each base64 thumbnail to a Blob and append to FormData as additional media fields (e.g., `previousMedia`)
4. Keep the existing `previousDiagnosis` text field for the text history

#### Backend (`backend/src/analyze/index.js`)

1. Parse `previousMedia` files from the multipart form data (separate from current `media`)
2. Add them to the Bedrock content blocks with labels like "Previous visit 1 image", "Previous visit 2 image"
3. Update the `<FOLLOW_UP_PROTOCOL>` prompt to instruct the AI:
   - "The following images show the animal's condition at previous visits. Compare them visually with the new media to assess progression."
   - Reference the text history for context on what was diagnosed and prescribed

#### Prompt Changes

Current prompt structure for follow-up:
```
<FOLLOW_UP_PROTOCOL>
  <CASE_HISTORY>{text of all previous visits}</CASE_HISTORY>
  Compare new media against previous diagnosis context.
</FOLLOW_UP_PROTOCOL>
```

Proposed:
```
<FOLLOW_UP_PROTOCOL>
  <CASE_HISTORY>{text of all previous visits}</CASE_HISTORY>

  <VISUAL_HISTORY>
  The following images show the animal's condition at previous visits (oldest to newest).
  Compare them visually with the NEW media provided above to determine if the condition
  is improving, stable, or worsening.
  </VISUAL_HISTORY>
</FOLLOW_UP_PROTOCOL>

[Previous visit 1 image]
[Previous visit 2 image]
[New image/video from user]
```

### Constraints

- **Payload size**: Thumbnails are small (typically <50KB each). Sending 2-3 adds ~100-150KB — acceptable.
- **Bedrock token cost**: Each image adds to the input token count. Limiting to 2-3 past thumbnails keeps cost manageable.
- **Video follow-ups**: If previous visits used video, only the stored thumbnail is available (not the full video). This is acceptable since the thumbnail captures the key visual.

### Files to Modify

| File | Change |
|---|---|
| `src/app/app/page.tsx` | Extract thumbnails from `activeCase.records`, append as `previousMedia` in FormData |
| `backend/src/analyze/index.js` | Parse `previousMedia`, add to Bedrock content blocks with labels, update follow-up prompt |

### Stretch Goals

- Send the user's previous symptoms text alongside the text history (currently only current symptoms are sent explicitly; past symptoms are only in the diagnosis JSON)
- Allow the AI to reference specific visit numbers when comparing ("In visit 2, the redness was more pronounced than in visit 3")
- Store a richer case summary that the AI generates at each visit to make the text history more useful
