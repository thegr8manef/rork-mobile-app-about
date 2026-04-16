package tn.attijariup.plus

import android.app.DownloadManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.database.Cursor
import android.net.Uri
import androidx.core.content.FileProvider
import java.io.File

class DownloadCompleteReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    if (intent.action != DownloadManager.ACTION_DOWNLOAD_COMPLETE) return

    val downloadId = intent.getLongExtra(DownloadManager.EXTRA_DOWNLOAD_ID, -1)
    if (downloadId == -1L) return

    val dm = context.getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager

    val query = DownloadManager.Query().setFilterById(downloadId)
    val cursor: Cursor = dm.query(query) ?: return

    cursor.use {
      if (!it.moveToFirst()) return

      val status = it.getInt(it.getColumnIndexOrThrow(DownloadManager.COLUMN_STATUS))
      if (status != DownloadManager.STATUS_SUCCESSFUL) return

      val localUriStr = it.getString(it.getColumnIndexOrThrow(DownloadManager.COLUMN_LOCAL_URI))
      if (localUriStr.isNullOrEmpty()) return

      // localUriStr is often like: file:///storage/emulated/0/Download/xxx.pdf
      val uri = Uri.parse(localUriStr)

      // You can launch a PDF viewer directly
      val viewIntent = Intent(Intent.ACTION_VIEW).apply {
        setDataAndType(uri, "application/pdf")
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
      }

      // If no app can open PDF, this can throw
      try {
        context.startActivity(viewIntent)
      } catch (e: Exception) {
        // You can show a notification instead if you want
      }
    }
  }
}
