#!/bin/bash

echo "🚀 Setting up Chat Database Tables..."

# Install dotenv if not already installed
if ! npm list dotenv > /dev/null 2>&1; then
    echo "📦 Installing dotenv..."
    npm install dotenv
fi

# Run the setup script
echo "🔧 Creating chat tables..."
node scripts/setup-chat-tables.js

echo "✅ Chat setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Make sure your .env.local has the correct AWS credentials"
echo "2. The following tables will be created:"
echo "   - ruchi-ai-chats (for chat metadata)"
echo "   - ruchi-ai-messages (for individual messages)"
echo "3. You can now use the chat feature in your app!"
