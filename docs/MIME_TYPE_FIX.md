# MIME Type Detection Issue [RESOLVED]

## ✅ Issue Resolved

**Resolution Date**: March 8, 2026

**Root Cause**: When extracting frames from video files, the frontend created Blob objects with `image/jpeg` MIME type, but when appending to FormData with just a filename string, the browser didn't preserve the MIME type correctly. This resulted in the multipart parser receiving `application/octet-stream` instead of `image/jpeg`, which Bedrock API rejected.

**Error Message**:
```
ValidationException: The detected file MIME type application/octet-stream does not match the expected type image/jpeg. Reformat your input and try again.
```

## Solution

**Frontend Fix**: Changed from appending Blob objects to creating proper File objects with explicit MIME type.

**Before**:
```typescript
frames.forEach((blob, index) => {
  formData.append("media", blob, `frame_${index}.jpg`);
});
```

**After**:
```typescript
frames.forEach((blob, index) => {
  // Create a proper File object with explicit MIME type to ensure it's preserved
  const frameFile = new File([blob], `frame_${index}.jpg`, { type: 'image/jpeg' });
  formData.append("media", frameFile);
});
```

**Backend Fallback**: Added MIME type detection from file extension as a safety net in `backend/src/analyze/index.js`:

```javascript
bb.on('file', (name, file, info) => {
  const { filename, encoding, mimeType } = info;
  const chunks = [];
  file.on('data', (data) => chunks.push(data));
  file.on('end', () => {
    // Fallback: detect MIME type from filename if it's application/octet-stream
    let detectedMimeType = mimeType;
    console.log('Original MIME type from busboy:', mimeType, 'for file:', filename);
    
    if (!mimeType || mimeType === 'application/octet-stream') {
      const ext = filename.toLowerCase().split('.').pop();
      const mimeMap = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp',
        'mp4': 'video/mp4',
        'mov': 'video/quicktime',
        'avi': 'video/x-msvideo'
      };
      detectedMimeType = mimeMap[ext] || mimeType;
      console.log('Detected MIME type from extension:', detectedMimeType, 'from extension:', ext);
    }
    
    result.media.push({
      filename,
      mimeType: detectedMimeType,
      content: Buffer.concat(chunks)
    });
  });
});
```

## Why This Worked

1. **File vs Blob**: The `File` constructor explicitly sets the MIME type in the File object's metadata, which browsers preserve when creating multipart/form-data requests.

2. **FormData Behavior**: When appending a Blob with just a filename string, FormData doesn't always preserve the Blob's type property. Using a File object ensures the type is included in the Content-Type header of that part.

3. **Backend Fallback**: Even if the frontend doesn't send the correct MIME type, the backend now has a fallback mechanism to detect it from the file extension.

## Related Issues

### Previous Issues in This Chain:
1. **401 Unauthorized + CORS** (RESOLVED) - Frontend was sending wrong token type
2. **busboy is not defined** (RESOLVED) - Case sensitivity issue in Lambda code
3. **MIME type detection** (RESOLVED) - This issue

### Deployment Challenges:
- SAM deployment was showing "No changes to deploy" even after code changes
- Created `backend/force-deploy.ps1` to force redeployment
- Used `backend/update-lambda-code.ps1` to directly update Lambda code

## Files Modified

- `src/app/app/page.tsx` - Fixed video frame extraction to use File objects
- `backend/src/analyze/index.js` - Added MIME type fallback detection

## Testing

After deploying the fix:
1. Upload a video file
2. System extracts 4 frames as JPEG images
3. Each frame is sent with correct `image/jpeg` MIME type
4. Bedrock API successfully processes the images
5. Diagnosis is returned successfully

## Lessons Learned

1. **Browser FormData Quirks**: When working with FormData, always use File objects instead of Blobs when you need to preserve MIME types.

2. **Multipart Parsing**: The Content-Type of each part in multipart/form-data comes from the File/Blob metadata, not just the filename extension.

3. **Defense in Depth**: Having fallback MIME type detection in the backend provides resilience against frontend issues.

4. **Deployment Verification**: Always verify code changes are actually deployed by checking CloudWatch logs for console.log statements.

## References

- [MDN: File Constructor](https://developer.mozilla.org/en-US/docs/Web/API/File/File)
- [MDN: FormData.append()](https://developer.mozilla.org/en-US/docs/Web/API/FormData/append)
- [Busboy Documentation](https://github.com/mscdex/busboy)
