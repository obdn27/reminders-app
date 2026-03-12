# Frontend (Expo)

## Environment
Copy `.env.example` to `.env` and set your backend LAN URL:

`EXPO_PUBLIC_API_BASE_URL=http://<YOUR_MAC_LAN_IP>:8000`

## Run
```bash
npm install
npx expo start -c --tunnel
```

## Dev Build For Notifications + Live Activities
`Expo Go` is limited for full native notification/live-activity testing.

Build and run a dev client:
```bash
npx expo prebuild
npx expo run:ios
```

Installed native modules:
- `expo-notifications`
- `expo-device`
- `expo-dev-client`
- `expo-live-activity`
- `@react-native-picker/picker`

## Debug Tools
Open `Settings -> Debug tools`:
- enable debug time mode
- skip forward days/hours/minutes
- accelerate session timers (`1x` to `50x`)
- request notification permissions
- test local notifications

## Auth flow
- Access token: in-memory only
- Refresh token: Expo SecureStore
- Axios interceptor adds bearer token
- On 401, one refresh attempt + one retry
- If refresh fails, logout and clear stored tokens
