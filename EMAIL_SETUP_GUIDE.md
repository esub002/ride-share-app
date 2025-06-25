# Email Setup Guide for Driver App

## Setting up Gmail for sending verification emails

### Step 1: Enable 2-Factor Authentication on your Gmail account
1. Go to your Google Account settings: https://myaccount.google.com/
2. Click on "Security"
3. Enable "2-Step Verification" if not already enabled

### Step 2: Generate an App Password
1. In the same Security section, find "App passwords"
2. Click on "App passwords"
3. Select "Mail" as the app and "Other" as the device
4. Click "Generate"
5. Copy the 16-character password that appears

### Step 3: Set Environment Variables
Create a `.env` file in your backend directory with:

```
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-16-character-app-password
```

### Step 4: Restart your backend server
After setting the environment variables, restart your Docker containers:

```bash
docker-compose down
docker-compose up -d
```

### Alternative: Use a different email provider

If you prefer not to use Gmail, you can also use:

#### Outlook/Hotmail:
```
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_USER=your-email@outlook.com
EMAIL_PASS=your-password
```

#### Yahoo:
```
EMAIL_HOST=smtp.mail.yahoo.com
EMAIL_PORT=587
EMAIL_USER=your-email@yahoo.com
EMAIL_PASS=your-app-password
```

### Testing
After setup, try registering a new driver account. You should receive a verification email at the email address you used for registration.

### Troubleshooting
- Make sure 2FA is enabled on your Gmail account
- Use the app password, not your regular Gmail password
- Check that the environment variables are set correctly
- Restart the backend after changing environment variables 