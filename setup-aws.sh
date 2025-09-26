#!/bin/bash

echo "🔧 AWS Setup Script"
echo "=================="
echo ""
echo "Please enter your AWS credentials:"
echo ""

# Get Access Key ID
read -p "AWS Access Key ID [AKIAQIJRRY5XMPXY744M]: " ACCESS_KEY
ACCESS_KEY=${ACCESS_KEY:-AKIAQIJRRY5XMPXY744M}

# Get Secret Access Key
read -s -p "AWS Secret Access Key: " SECRET_KEY
echo ""

# Get Region
read -p "AWS Region [us-east-1]: " REGION
REGION=${REGION:-us-east-1}

echo ""
echo "🔑 Setting up AWS credentials..."

# Create AWS credentials file
mkdir -p ~/.aws
cat > ~/.aws/credentials << EOF
[default]
aws_access_key_id = $ACCESS_KEY
aws_secret_access_key = $SECRET_KEY
EOF

# Create AWS config file
cat > ~/.aws/config << EOF
[default]
region = $REGION
output = json
EOF

echo "✅ AWS credentials configured successfully!"
echo ""
echo "🧪 Testing AWS connection..."
aws sts get-caller-identity

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 AWS is working! Now let's create the DynamoDB tables..."
    echo ""
    node scripts/setup-dynamodb.js
else
    echo ""
    echo "❌ AWS connection failed. Please check your credentials."
fi
