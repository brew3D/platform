#!/bin/bash

echo "🚀 Setting up AWS DynamoDB Teams Table..."

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "❌ .env.local file not found!"
    echo "Please create .env.local with your AWS credentials first."
    echo "See AWS_TEAMS_SETUP.md for instructions."
    exit 1
fi

# Check if AWS credentials are set
if [ -z "$AWS_ACCESS_KEY_ID" ] || [ -z "$AWS_SECRET_ACCESS_KEY" ]; then
    echo "❌ AWS credentials not found in .env.local"
    echo "Please add your AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY to .env.local"
    exit 1
fi

# Install dotenv if not already installed
echo "📦 Installing dotenv..."
npm install dotenv

# Run the teams table setup
echo "🏗️ Creating teams table..."
node scripts/setup-teams-table.js

echo "✅ Setup complete!"
echo "Now run: npm run dev"
echo "And test creating a team!"
