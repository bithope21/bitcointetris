const DRIVE_FOLDER_ID = "10EgqAcUy_W43enxWQxYka2yxTsuad4M1";
const SHEET_ID = "1gBcqQ1LgUT2zl8Yyf_o3TpUszMM_OqvuK2JuMMshmZo";

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const word = data.word;
    const meaning = data.meaning;
    const imageBase64 = data.imageBase64; // e.g. "data:image/png;base64,iVBORw0KGgo..."

    let imageUrl = "";

    // 1. Save Image to Drive
    if (imageBase64) {
      const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
      const parts = imageBase64.split(',');
      const contentType = parts[0].split(';')[0].split(':')[1];
      const decodedData = Utilities.base64Decode(parts[1]);
      const blob = Utilities.newBlob(decodedData, contentType, word + ".png");
      
      const existingFiles = folder.getFilesByName(word + ".png");
      if (existingFiles.hasNext()) {
        const file = existingFiles.next();
        // DriveApp doesn't allow setContent on non-text easily, 
        // better to trash the old one and create a new one, or just create new
        file.setTrashed(true);
      }
      const file = folder.createFile(blob);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      imageUrl = file.getDownloadUrl();
    }

    // 2. Update Google Sheet
    if (meaning) {
      const sheet = SpreadsheetApp.openById(SHEET_ID).getActiveSheet();
      const dataRange = sheet.getDataRange();
      const values = dataRange.getValues();
      let rowToUpdate = -1;
      
      // Find the row with the word (Assuming Word is in Column A)
      for (let i = 0; i < values.length; i++) {
        if (values[i][0] && values[i][0].toString().toLowerCase() === word.toLowerCase()) {
          rowToUpdate = i + 1; // 1-indexed
          break;
        }
      }

      if (rowToUpdate > 0) {
        // Update meaning in Column B
        sheet.getRange(rowToUpdate, 2).setValue(meaning);
      } else {
        // Append new row if word not found
        sheet.appendRow([word, meaning, imageUrl]);
      }
    }

    // Ensure CORS headers by returning JSONP or simple text.
    // Note: Web Apps automatically handle some CORS, but returning JSON is standard.
    const output = JSON.stringify({
      success: true,
      message: "อัปเดตข้อมูลสำเร็จ!",
      imageUrl: imageUrl
    });

    return ContentService.createTextOutput(output).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doOptions(e) {
  // Required for CORS preflight requests
  const output = ContentService.createTextOutput("");
  return output.setMimeType(ContentService.MimeType.JSON);
}
