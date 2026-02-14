# Pashu-Krishi Rakshak

> AI-powered Rural Doctor for Livestock and Crop Disease Diagnosis

Pashu-Krishi Rakshak is a smartphone application that provides instant veterinary and crop disease diagnosis for rural farmers in India. Using multimodal AI, the app processes video and voice input in local dialects to deliver actionable prescriptions without requiring literacy or constant internet connectivity.

## Problem Statement

Rural India faces a critical shortage of veterinary experts (approximately 1 veterinarian per 50,000 livestock animals), leading to economic losses estimated at ₹15,000 crore annually from preventable diseases. Farmers need immediate, accessible, and affordable diagnostic support in their local languages.

## Key Features

- **Video-Based Diagnosis**: Record 3-60 second videos of sick animals or diseased crops
- **Voice Input in Local Dialects**: Describe symptoms verbally in 10 Indian languages
- **AI-Powered Analysis**: Multimodal AI processes both visual and verbal symptoms
- **Spoken Prescriptions**: Receive diagnosis and treatment instructions as audio in your dialect
- **Offline-First Design**: Capture videos offline, auto-upload when connectivity returns
- **Confidence Scoring**: Know when to trust AI vs. consult a human veterinarian
- **Comprehensive Coverage**: Supports cows, lambs, sheep, dogs, and crop plants

## Supported Languages

Hindi • Tamil • Telugu • Bengali • Marathi • Gujarati • Kannada • Malayalam • Punjabi • Odia

## How It Works

1. **Record**: Capture video of your sick animal or diseased crop while describing symptoms
2. **Process**: AI analyzes video and transcribes your voice description
3. **Diagnose**: System queries veterinary knowledge base and generates diagnosis
4. **Listen**: Receive spoken prescription with medicine names, dosages, and care steps
5. **Act**: Follow treatment guidance or consult veterinarian if confidence is low

## Architecture

```
Mobile App (React Native)
    ↓
AWS Bedrock (Nova Multimodal LLM)
    ↓
Knowledge Base (Vector Search)
    ↓
Amazon Transcribe + Polly
```

### Technology Stack

**Mobile Layer:**
- React Native (cross-platform)
- Local SQLite storage
- Native camera/microphone APIs

**AWS Services:**
- AWS Bedrock (Nova multimodal model)
- Bedrock Knowledge Bases (RAG)
- Amazon Transcribe (speech-to-text)
- Amazon Polly (text-to-speech)
- Amazon S3 (document storage)

## Project Structure

```
pashu-krishi-rakshak/
├── .kiro/
│   └── specs/
│       └── pashu-krishi-rakshak/
│           ├── requirements.md    # Detailed requirements
│           └── design.md          # System design & architecture
├── mobile/                        # React Native mobile app
│   ├── src/
│   │   ├── components/           # UI components
│   │   ├── services/             # AWS service adapters
│   │   ├── storage/              # Local storage layer
│   │   └── utils/                # Helper functions
│   └── tests/                    # Unit & property tests
├── knowledge-base/               # Veterinary & agricultural manuals
│   ├── veterinary/
│   └── agricultural/
└── infrastructure/               # AWS infrastructure as code
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- React Native development environment
- AWS account with Bedrock access
- Python 3.9+ (for AWS utilities)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/pashu-krishi-rakshak.git
cd pashu-krishi-rakshak

# Install mobile app dependencies
cd mobile
npm install

# Configure AWS credentials
aws configure
```

### AWS Setup

1. **Enable AWS Bedrock Models**:
   - Navigate to AWS Bedrock console
   - Enable Nova multimodal model access
   - Enable Titan Embeddings model

2. **Create Knowledge Bases**:
   ```bash
   # Upload veterinary manuals
   aws s3 cp knowledge-base/veterinary/ s3://pashu-krishi-kb/veterinary/ --recursive
   
   # Upload agricultural manuals
   aws s3 cp knowledge-base/agricultural/ s3://pashu-krishi-kb/agricultural/ --recursive
   ```

3. **Configure IAM Permissions**: Apply the IAM policy from `design.md` section "AWS IAM Permissions"

### Running the App

```bash
# Start Metro bundler
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios
```

## Testing

### Unit Tests

```bash
npm test
```

### Property-Based Tests

```bash
npm run test:properties
```

Property tests validate universal correctness properties across randomized inputs (minimum 100 iterations per property).

### Integration Tests

```bash
npm run test:integration
```

## Configuration

### Dialect Configuration

Edit `mobile/src/config/dialects.ts` to customize dialect mappings for Amazon Transcribe and Polly.

### Video Settings

Edit `mobile/src/config/video.ts`:
- `MAX_DURATION`: Maximum recording duration (default: 60s)
- `MIN_DURATION`: Minimum recording duration (default: 3s)
- `MAX_FILE_SIZE`: Compression threshold (default: 50MB)

### Network Retry Logic

Edit `mobile/src/config/network.ts`:
- `MAX_RETRIES`: Number of retry attempts (default: 3)
- `RETRY_DELAYS`: Backoff delays in seconds (default: [0, 2, 4])

## Performance Benchmarks

- Video compression: <5 seconds for 50MB files
- Transcription: <10 seconds for 60-second audio
- End-to-end diagnosis: <30 seconds (normal network)
- Speech synthesis: <3 seconds

## Privacy & Security

- All transmissions use HTTPS encryption
- Raw video/audio deleted from AWS after processing
- Only anonymized metadata stored for analytics
- No personally identifiable information shared
- Local data cleanup on app uninstall

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Write tests for your changes
4. Ensure all tests pass (`npm test`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## Documentation

- [Requirements Document](.kiro/specs/pashu-krishi-rakshak/requirements.md)
- [Design Document](.kiro/specs/pashu-krishi-rakshak/design.md)
- [API Documentation](docs/API.md)
- [Deployment Guide](docs/DEPLOYMENT.md)

## Roadmap

- [ ] Phase 1: Core diagnosis for cows and major crops
- [ ] Phase 2: Expand to all supported animal types
- [ ] Phase 3: Add treatment tracking and follow-up reminders
- [ ] Phase 4: Community features (farmer forums, expert Q&A)
- [ ] Phase 5: Integration with government veterinary services

## License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file for details.

## Acknowledgments

- AWS for Bedrock and managed AI services
- Rural farmers who provided feedback during development
- Veterinary experts who contributed to the knowledge base
- Open source community for React Native and testing libraries

## Support

- **Issues**: [GitHub Issues](https://github.com/your-org/pashu-krishi-rakshak/issues)
- **Email**: support@pashu-krishi-rakshak.org
- **Documentation**: [Wiki](https://github.com/your-org/pashu-krishi-rakshak/wiki)

## Citation

If you use this project in your research or work, please cite:

```bibtex
@software{pashu_krishi_rakshak,
  title = {Pashu-Krishi Rakshak: AI-Powered Rural Veterinary Diagnosis},
  year = {2026},
  url = {https://github.com/your-org/pashu-krishi-rakshak}
}
```

---

**Made with ❤️ for rural farmers in India**
