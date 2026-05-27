import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Production APK: UI ကို dist ထဲမှ တိုက်ရိုက်ဖွင့် (Web site down ဖြစ်ရင် App မကျအောင်).
 * ဖုန်းမှာ live site စမ်းချင်ရင်: CAPACITOR_LIVE_URL=https://ballpwal.org/app npm run android:sync
 */
const liveUrl = process.env.CAPACITOR_LIVE_URL?.trim();

const config: CapacitorConfig = {
  appId: 'org.ballpwal.app',
  appName: '9Mix Football',
  webDir: 'dist',
  android: {
    allowMixedContent: false,
  },
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
  },
};

if (liveUrl) {
  config.server = {
    url: liveUrl,
    androidScheme: 'https',
  };
}

export default config;
