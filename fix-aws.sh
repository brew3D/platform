#!/bin/bash

echo "🔧 AWS Credentials Fix Script"
echo "============================="
echo ""

# Clear any existing credentials
rm -rf ~/.aws

echo "Please enter your AWS credentials carefully:"
echo ""

# Get Access Key ID
read -p "AWS Access Key ID: " ACCESS_KEY
if [ -z "$ACCESS_KEY" ]; then
    echo "❌ Access Key ID cannot be empty"
    exit 1
fi

# Get Secret Access Key
read -s -p "AWS Secret Access Key: " SECRET_KEY
echo ""
if [ -z "$SECRET_KEY" ]; then
    echo "❌ Secret Access Key cannot be empty"
    exit 1
fi

# Get Region
read -p "AWS Region [us-east-1]: " REGION
REGION=${REGION:-us-east-1}

echo ""
echo "🔑 Setting up AWS credentials..."

# Create AWS directory
mkdir -p ~/.aws

# Create credentials file
cat > ~/.aws/credentials << EOF
[default]
aws_access_key_id = $ACCESS_KEY
aws_secret_access_key = $SECRET_KEY
EOF

# Create config file
cat > ~/.aws/config << EOF
[default]
region = $REGION
output = json
EOF

echo "✅ AWS credentials configured!"
echo ""

# Test the connection
echo "🧪 Testing AWS connection..."
aws sts get-caller-identity

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 AWS is working! Creating DynamoDB tables..."
    echo ""
    node scripts/setup-dynamodb.js
else
    echo ""
    echo "❌ AWS connection failed. Please check your credentials."
    echo ""
    echo "💡 Common issues:"
    echo "1. Make sure you copied the complete secret key"
    echo "2. Check for extra spaces or characters"
    echo "3. Verify the access key is active in AWS Console"
fi
