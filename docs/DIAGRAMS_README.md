# Architecture Diagrams Guide

This document explains the architecture diagrams for Pashu-Krishi Rakshak.

---

## Available Diagrams

### 1. System Architecture Diagram
**File:** `aws-architecture.png`

**Purpose:** Shows the complete technical infrastructure with all AWS services and data flow.

**Key Components:**
- Edge Layer (Farmer's device with Canvas API and Web Speech API)
- AWS Amplify (Frontend hosting)
- Amazon Cognito (Authentication)
- API Gateway (REST API with Cognito authorizer)
- 3 Lambda Functions (Analyze, History, Location)
- Amazon Bedrock (Nova Lite, Knowledge Base, Nova Pro)
- Data Layer (S3, DynamoDB, Geo Places API)

**Use Cases:**
- Understanding system architecture
- Technical discussions with developers
- Infrastructure planning
- AWS service integration reference

---

### 2. Process Flow Diagram
**File:** `process-flow.png`

**Purpose:** Shows the user journey from capture to diagnosis with decision points.

**Key Steps:**
1. Capture media (photo/video)
2. Extract 4 frames (videos only)
3. Upload to backend
4. AI analysis pipeline (Nova Lite → Knowledge Base → Nova Pro)
5. Confidence check (≥70% threshold)
6. Display results OR trigger emergency alert
7. Save to history

**Decision Points:**
- New case vs Follow-up
- Confidence threshold (70%)
- Emergency vet alert trigger

**Use Cases:**
- Understanding user experience
- Product discussions
- Feature planning
- User documentation

---

## How to Use These Diagrams

### For Presentations
Both diagrams are high-resolution PNGs suitable for:
- PowerPoint/Keynote presentations
- Documentation websites
- Technical proposals
- Architecture reviews

### For Documentation
Reference diagrams in markdown:
```markdown
![Architecture](aws-architecture.png)
![Process Flow](process-flow.png)
```

### For Updates
If you need to update the diagrams:

**Architecture Diagram:**
- Generated using AWS Diagram MCP Server (Python diagrams library)
- Source: AWS icons with proper styling
- To regenerate: Use MCP server with updated code

**Process Flow Diagram:**
- Generated using Graphviz DOT format
- Source: `process-flow.dot` (if needed for updates)
- To regenerate: `dot -Tpng process-flow.dot -o process-flow.png`

---

## Diagram Details

### Architecture Diagram Specifications
- **Format:** PNG
- **Size:** ~217 KB
- **Resolution:** High-res for printing
- **Color Scheme:** AWS official colors
- **Layout:** Top-to-bottom flow
- **Icons:** Official AWS service icons

### Process Flow Diagram Specifications
- **Format:** PNG
- **Size:** ~160 KB
- **Resolution:** High-res for printing
- **Color Scheme:** 
  - Green: User actions
  - Purple: Backend processing
  - Teal: AI/ML operations
  - Yellow: Decision points
  - Red: Emergency paths
- **Layout:** Top-to-bottom flow with decision diamonds

---

## Current Implementation Notes

### Video Processing (Current)
- **Videos:** Frontend extracts 4 key frames using Canvas API
- **Photos:** Sent directly without extraction
- **Upload Size:** ~100-200 KB for 4 frames

### Video Processing (Planned - See Future Enhancements)
- **Videos:** Send full video file to Bedrock
- **Bedrock Sampling:** 1 FPS (10 frames for 10-second video)
- **Upload Size:** ~5-10 MB for full video
- **Benefits:** Better temporal understanding, more frames analyzed

---

## Related Documentation

- [AWS_ARCHITECTURE.md](./AWS_ARCHITECTURE.md) - Detailed architecture documentation
- [FEATURES.md](./FEATURES.md) - Feature descriptions
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment guide

---

*Generated: March 9, 2026*
*Tools Used: AWS Diagram MCP Server, Graphviz*
