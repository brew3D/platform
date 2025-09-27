# 🚀 AWS DynamoDB Teams Setup Guide

## 📋 **STEP-BY-STEP SETUP**

### **1. Create Environment File**

Create a `.env.local` file in your project root with your AWS credentials:

```bash
# ===========================================
# AWS Configuration
# ===========================================
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_actual_access_key_here
AWS_SECRET_ACCESS_KEY=your_actual_secret_key_here

# ===========================================
# DynamoDB Table Names
# ===========================================
DDB_TEAMS_TABLE=ruchi-ai-teams
DYNAMODB_TABLE_NAME=ruchi-ai-users
DDB_SCENES_TABLE=ruchi-ai-scenes
DDB_PROJECTS_TABLE=ruchi-ai-projects
DDB_MAPS_TABLE=ruchi-ai-maps
DDB_CHARACTERS_TABLE=ruchi-ai-characters
DDB_ASSETS_TABLE=ruchi-ai-assets

# ===========================================
# JWT Secret
# ===========================================
JWT_SECRET=3bdc1f5d2ea1246c61db2de2354080bbdddb2b818df124a71ac2e0c6d1f99d8a8bb26931755fe00c688ae44a54be38de371b39372cc1c7f7a8875f2a566e0534

# ===========================================
# NextAuth
# ===========================================
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_here
```

### **2. Get AWS Credentials**

#### **Option A: AWS IAM User (Recommended)**
1. Go to [AWS IAM Console](https://console.aws.amazon.com/iam/)
2. Click "Users" → "Create user"
3. Username: `ruchi-ai-dynamodb-user`
4. Attach policies: `AmazonDynamoDBFullAccess`
5. Click "Create user"
6. Go to "Security credentials" tab
7. Click "Create access key"
8. Copy the Access Key ID and Secret Access Key

#### **Option B: AWS CLI (If you have it installed)**
```bash
aws configure
# Enter your credentials when prompted
```

### **3. Create Teams Table**

Run the setup script:

```bash
# Install dotenv if not already installed
npm install dotenv

# Run the teams table setup
node scripts/setup-teams-table.js
```

### **4. Verify Setup**

Check that your table was created:
1. Go to [AWS DynamoDB Console](https://console.aws.amazon.com/dynamodb/)
2. Look for table: `ruchi-ai-teams`
3. Verify it has the correct structure

### **5. Test the API**

Start your development server:

```bash
npm run dev
```

Then test creating a team - it should work without 500 errors!

## 🔧 **TROUBLESHOOTING**

### **Still Getting 500 Errors?**

1. **Check AWS Credentials:**
   ```bash
   # Test if credentials work
   aws sts get-caller-identity
   ```

2. **Check Table Exists:**
   - Go to DynamoDB Console
   - Verify `ruchi-ai-teams` table exists

3. **Check Environment Variables:**
   ```bash
   # In your terminal
   echo $AWS_ACCESS_KEY_ID
   echo $AWS_SECRET_ACCESS_KEY
   ```

4. **Check Console Logs:**
   - Look at browser console for specific error messages
   - Check terminal where `npm run dev` is running

### **Common Issues:**

- **Invalid credentials**: Double-check your AWS keys
- **Wrong region**: Make sure region matches your DynamoDB table
- **Table doesn't exist**: Run the setup script again
- **Permission denied**: Make sure IAM user has DynamoDB permissions

## 🎯 **WHAT'S WORKING AFTER SETUP**

- ✅ **Create Teams** - Real DynamoDB storage
- ✅ **List Teams** - Load from DynamoDB
- ✅ **Team Members** - Full team management
- ✅ **Persistent Data** - Survives server restarts
- ✅ **Production Ready** - Real AWS backend

## 📞 **NEED HELP?**

If you're still having issues:
1. Share the exact error message from console
2. Verify your AWS credentials are correct
3. Make sure the table was created successfully
4. Check that your `.env.local` file is in the project root
