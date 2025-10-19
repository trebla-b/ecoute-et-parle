Place optional static assets here.

For offline speech recognition with Vosk, download the desired model and unpack it into the `vosk/`
subdirectory. Example:

```
frontend/public/
  vosk/
    fr/
      am/
      conf/
      graph/
      ...
```

During development builds, files inside `public/` are served as-is from the root of the dev server.
