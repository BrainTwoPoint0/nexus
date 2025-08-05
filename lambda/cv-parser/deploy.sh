#!/bin/bash

# Deployment script for Nexus CV Parser Lambda
# Run this script to deploy the Lambda function to AWS

set -e

echo "🚀 Deploying Nexus CV Parser Lambda..."

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install it first."
    exit 1
fi

# Check if AWS credentials are configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS credentials not configured. Run 'aws configure' first."
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ] || [ ! -d "node_modules/mammoth" ]; then
    echo "📦 Installing dependencies..."
    npm install --production
fi

# Package the function
echo "📦 Packaging Lambda function..."
zip -r cv-parser.zip index.js node_modules package.json

# Check if function exists
FUNCTION_NAME="nexus-cv-parser"
if aws lambda get-function --function-name $FUNCTION_NAME &> /dev/null; then
    echo "🔄 Updating existing Lambda function..."
    aws lambda update-function-code \
        --function-name $FUNCTION_NAME \
        --zip-file fileb://cv-parser.zip
    
    echo "⚙️  Updating function configuration..."
    aws lambda update-function-configuration \
        --function-name $FUNCTION_NAME \
        --timeout 900 \
        --memory-size 1024 \
        --environment Variables="{OPENAI_API_KEY=$OPENAI_API_KEY}"
else
    echo "❌ Lambda function does not exist. Please create it manually first with:"
    echo ""
    echo "1. Go to AWS Lambda Console"
    echo "2. Create function named: $FUNCTION_NAME"
    echo "3. Runtime: Node.js 18.x"
    echo "4. Timeout: 15 minutes (900 seconds)"
    echo "5. Memory: 1024 MB"
    echo "6. Add environment variable: OPENAI_API_KEY"
    echo "7. Add execution role with basic Lambda permissions"
    echo ""
    echo "Then run this script again."
    exit 1
fi

# Get the function URL
FUNCTION_URL=$(aws lambda get-function-url-config --function-name $FUNCTION_NAME --query 'FunctionUrl' --output text 2>/dev/null || echo "")

if [ -z "$FUNCTION_URL" ]; then
    echo "🔗 Creating function URL..."
    aws lambda create-function-url-config \
        --function-name $FUNCTION_NAME \
        --auth-type NONE \
        --cors "AllowCredentials=false,AllowHeaders=content-type,authorization,AllowMethods=POST,OPTIONS,AllowOrigins=*"
    
    FUNCTION_URL=$(aws lambda get-function-url-config --function-name $FUNCTION_NAME --query 'FunctionUrl' --output text)
fi

echo ""
echo "✅ Deployment successful!"
echo ""
echo "📋 Function Details:"
echo "   Name: $FUNCTION_NAME"
echo "   URL: $FUNCTION_URL"
echo ""
echo "🔧 Next steps:"
echo "1. Update your Netlify function to call: $FUNCTION_URL"
echo "2. Test the integration"
echo ""
echo "💡 Remember to set the OPENAI_API_KEY environment variable in Lambda console"

# Clean up
rm cv-parser.zip