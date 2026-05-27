import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'org.ballpwal.app',
  appName: '9Mix Football',
  webDir: 'dist',
  /** APK သည် /app သာ ဖွင့်မည် — ballpwal.org ပင်မဝဘ်ဆိုက် မဟုတ်ပါ */
  server: {
    url: 'https://ballpwal.org/app',
    androidScheme: 'https',
  },
  android: {
    allowMixedContent: false,
  },
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
  },
};

export default config;
