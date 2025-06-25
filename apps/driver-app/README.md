# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.

# Running Expo App on a USB-Connected Android Device

To run your Expo (React Native) app on a real Android device via USB:

---

## 1. Enable Developer Options and USB Debugging

- On your Android device:
  1. Go to **Settings > About phone**.
  2. Tap **Build number** 7 times to enable Developer Options.
  3. Go to **Settings > Developer options**.
  4. Enable **USB debugging**.

---

## 2. Connect Your Device

- Connect your Android device to your computer via USB cable.
- Allow USB debugging permission if prompted on your device.

---

## 3. Install Expo Go App

- Install [Expo Go](https://play.google.com/store/apps/details?id=host.exp.exponent) from the Play Store on your device.

---

## 4. Start the Expo Project

- In your `mobile/` directory, run:
  ```
  npx expo start
  ```
- This will open the Expo DevTools in your browser.

---

## 5. Run on Device

- In Expo DevTools, click **"Run on Android device/emulator"**.
- Or, in your terminal, run:
  ```
  npx expo run:android
  ```
- Your device should appear as a connected device. Select it if prompted.

---

## 6. Troubleshooting

- If your device does not show up:
  - Make sure USB debugging is enabled.
  - Try running `adb devices` in your terminal to see if your device is listed.
    - If not, install [Android Platform Tools](https://developer.android.com/studio/releases/platform-tools) and add to your PATH.
  - Accept any permission dialogs on your phone.
  - Try a different USB cable or port.

---

## 7. Alternative: Scan QR Code

- With Expo Go open on your device, scan the QR code shown in Expo DevTools or terminal.
- Your app will load over WiFi (device and computer must be on the same network).

---

**Now your app will run on your real Android device via USB!**

# Driver App

## Authentication Update

- **Login/Register is now via mobile number and OTP only.**
- Enter your mobile number and tap 'Send OTP'.
- Use the fake OTP: **123456** (always works for testing).
- If it's a new number, you will be prompted to enter your name and car info to complete registration.
- No email or password is required. Email-based login and verification are disabled.

## How to Test
1. Start the backend and frontend as usual.
2. On the login screen, enter a mobile number (any valid format).
3. Tap 'Send OTP'.
4. Enter **123456** as the OTP.
5. If prompted, fill in your name and car info.
6. You will be logged in as a driver.

---

For developers: To switch back to email/password, revert the changes in `LoginScreen.js` and `backend/routes/authDriver.js`.
