import type { CapacitorConfig } from '@capacitor/cli';

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

export default config;
