# Nexus CV Parser Lambda

AWS Lambda function for heavy CV parsing using OpenAI APIs. This function handles the time-intensive OpenAI processing that was causing timeouts in Netlify Functions.

## Features

- ✅ **15-minute timeout** (vs 10-second Netlify limit)
- ✅ **Text extraction** from PDF, DOCX, images using OpenAI Vision API
- ✅ **Structured data parsing** with GPT-4o-mini for efficiency
- ✅ **CORS support** for cross-origin requests
- ✅ **Error handling** with detailed logging

## Quick Setup

### 1. Prerequisites

```bash
# Install AWS CLI
npm install -g aws-cli

# Configure AWS credentials
aws configure
```

### 2. Create Lambda Function

1. Go to [AWS Lambda Console](https://console.aws.amazon.com/lambda/)
2. Click "Create function"
3. Configure:
   - **Name**: `nexus-cv-parser`
   - **Runtime**: Node.js 18.x
   - **Timeout**: 15 minutes (900 seconds)
   - **Memory**: 1024 MB
   - **Environment Variables**: Add `OPENAI_API_KEY`

### 3. Deploy Code

```bash
cd lambda/cv-parser
./deploy.sh
```

### 4. Enable Function URL

The deployment script will automatically create a Function URL for HTTP access.

## API Usage

### Request Format

```javascript
POST https://your-lambda-url.lambda-url.region.on.aws/

Content-Type: application/json

{
  "fileBuffer": "base64-encoded-file-data",
  "fileName": "resume.pdf",
  "mimeType": "application/pdf"
}
```

### Response Format

```javascript
{
  "success": true,
  "data": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "workHistory": [...],
    "boardExperience": [...],
    // ... other CV data
  },
  "completenessAnalysis": {
    "overallCompleteness": 85,
    "missingCriticalFields": ["phone"],
    // ... completeness details
  },
  "filename": "resume.pdf"
}
```

## Integration with Netlify

Your Netlify function (`/api/onboarding/parse-cv/route.ts`) will:

1. Receive the file upload
2. Convert file to base64
3. Forward to Lambda function
4. Return Lambda response to client

This keeps your existing API interface while solving the timeout issue.

## Cost Estimation

**AWS Lambda Pricing** (US East):

- **Requests**: $0.20 per 1M requests
- **Duration**: $0.0000166667 per GB-second

**Example** (1000 CV parses/month, 30 seconds each):

- Requests: 1000 × $0.0000002 = $0.0002
- Duration: 1000 × 30s × 1GB × $0.0000166667 = $0.50
- **Total**: ~$0.50/month

Plus OpenAI API costs (~$0.01-0.05 per CV).

## Monitoring

- **CloudWatch Logs**: Function execution logs
- **CloudWatch Metrics**: Duration, errors, invocations
- **X-Ray Tracing**: Available for debugging

## Security

- **Function URL**: Public endpoint (consider adding API Gateway + auth for production)
- **Environment Variables**: Encrypted at rest
- **IAM Role**: Minimal permissions (logs only)

## Troubleshooting

### Common Issues

1. **Timeout errors**: Check CloudWatch logs, increase memory/timeout
2. **OpenAI errors**: Verify API key in environment variables
3. **CORS errors**: Function URL CORS is configured in deployment script
4. **File size errors**: Lambda payload limit is 6MB

### Deployment Issues

```bash
# Check AWS credentials
aws sts get-caller-identity

# Verify function exists
aws lambda list-functions --query 'Functions[?FunctionName==`nexus-cv-parser`]'

# Check logs
aws logs describe-log-groups --log-group-name-prefix /aws/lambda/nexus-cv-parser
```
