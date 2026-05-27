package org.ballpwal.app;

import android.app.AlertDialog;
import android.content.Intent;
import android.content.pm.PackageInfo;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import org.json.JSONObject;

public class MainActivity extends BridgeActivity {

  /** အောက်ပါ build ထက် နိမ့်ရင် App မဖွင့် — release တိုင်း တိုးပါ */
  private static final int FALLBACK_MIN_VERSION = 14;
  private static final String VERSION_JSON_URL = "https://ballpwal.org/app-version.json";
  private static final String APK_PAGE_URL = "https://ballpwal.org/apk.html";

  @Override
  public void onCreate(Bundle savedInstanceState) {
    registerPlugin(AppUpdatePlugin.class);

    int installed = readInstalledVersionCode();
    int required = fetchRequiredVersionCode();

    if (installed > 0 && installed < required) {
      showForceUpdateDialog(installed, required);
      return;
    }

    super.onCreate(savedInstanceState);
  }

  private int readInstalledVersionCode() {
    try {
      PackageInfo info = getPackageManager().getPackageInfo(getPackageName(), 0);
      if (Build.VERSION.SDK_INT >= 28) {
        return (int) info.getLongVersionCode();
      }
      return info.versionCode;
    } catch (Exception ignored) {
      return 0;
    }
  }

  private int fetchRequiredVersionCode() {
    HttpURLConnection connection = null;
    try {
      connection = (HttpURLConnection) new URL(VERSION_JSON_URL + "?cb=" + System.currentTimeMillis()).openConnection();
      connection.setConnectTimeout(8000);
      connection.setReadTimeout(8000);
      connection.setRequestProperty("Cache-Control", "no-cache");
      connection.connect();
      if (connection.getResponseCode() >= 400) {
        return FALLBACK_MIN_VERSION;
      }
      BufferedReader reader = new BufferedReader(new InputStreamReader(connection.getInputStream()));
      StringBuilder body = new StringBuilder();
      String line;
      while ((line = reader.readLine()) != null) {
        body.append(line);
      }
      reader.close();
      JSONObject json = new JSONObject(body.toString());
      return Math.max(json.optInt("versionCode", FALLBACK_MIN_VERSION), FALLBACK_MIN_VERSION);
    } catch (Exception ignored) {
      return FALLBACK_MIN_VERSION;
    } finally {
      if (connection != null) {
        connection.disconnect();
      }
    }
  }

  private void showForceUpdateDialog(int installed, int required) {
    AlertDialog.Builder builder =
        new AlertDialog.Builder(this)
            .setTitle("ဗားရှင်း အသစ် လိုအပ်ပါသည်")
            .setMessage(
                "လက်ရှိ v"
                    + installed
                    + " → အသစ် v"
                    + required
                    + " လိုအပ်ပါသည်။\n\nUpdate ဒေါင်းလုဒ် လုပ်ပြီး APK ထပ်သွင်းမှ App သုံးလို့ရမည်။")
            .setCancelable(false)
            .setPositiveButton(
                "Update ဒေါင်းလုဒ်",
                (dialog, which) -> {
                  Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(APK_PAGE_URL));
                  startActivity(intent);
                });

    AlertDialog dialog = builder.create();
    dialog.show();
  }
}
