package org.ballpwal.app;

import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import androidx.core.content.FileProvider;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;

@CapacitorPlugin(name = "AppUpdate")
public class AppUpdatePlugin extends Plugin {

  @PluginMethod
  public void installApk(PluginCall call) {
    String url = call.getString("url");
    if (url == null || url.trim().isEmpty()) {
      call.reject("APK URL လိုအပ်ပါတယ်");
      return;
    }

    Runnable task =
        () -> {
          try {
            File apkFile = downloadApk(url.trim());
            getActivity()
                .runOnUiThread(
                    () -> {
                      try {
                        launchInstaller(apkFile);
                        JSObject result = new JSObject();
                        result.put("ok", true);
                        call.resolve(result);
                      } catch (Exception error) {
                        call.reject("တပ်ဆင်၍ မရပါ: " + error.getMessage());
                      }
                    });
          } catch (Exception error) {
            call.reject("ဒေါင်းလုဒ် မအောင်မြင်ပါ: " + error.getMessage());
          }
        };

    new Thread(task).start();
  }

  private File downloadApk(String urlString) throws Exception {
    HttpURLConnection connection = (HttpURLConnection) new URL(urlString).openConnection();
    connection.setConnectTimeout(30000);
    connection.setReadTimeout(120000);
    connection.setInstanceFollowRedirects(true);
    connection.connect();

    if (connection.getResponseCode() >= 400) {
      throw new Exception("HTTP " + connection.getResponseCode());
    }

    File updatesDir = new File(getContext().getCacheDir(), "updates");
    if (!updatesDir.exists() && !updatesDir.mkdirs()) {
      throw new Exception("cache folder မဖန်တီးနိုင်ပါ");
    }

    File apkFile = new File(updatesDir, "9mix-football-update.apk");
    try (InputStream input = connection.getInputStream();
        FileOutputStream output = new FileOutputStream(apkFile, false)) {
      byte[] buffer = new byte[8192];
      int read;
      while ((read = input.read(buffer)) != -1) {
        output.write(buffer, 0, read);
      }
    }

    connection.disconnect();

    if (!apkFile.exists() || apkFile.length() < 1024) {
      throw new Exception("APK ဖိုင် မပြည့်စုံပါ");
    }

    return apkFile;
  }

  private void launchInstaller(File apkFile) {
    Uri apkUri =
        FileProvider.getUriForFile(
            getContext(), getContext().getPackageName() + ".fileprovider", apkFile);

    Intent intent = new Intent(Intent.ACTION_VIEW);
    intent.setDataAndType(apkUri, "application/vnd.android.package-archive");
    intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
      intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP);
    }

    getContext().startActivity(intent);
  }
}
