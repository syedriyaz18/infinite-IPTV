const hls = new Hls({
  debug: true,
  enableWorker: true,
  lowLatencyMode: true,
  backBufferLength: 90,
  maxBufferLength: 30,
  maxMaxBufferLength: 60,
  liveSyncDuration: 3,
  liveMaxLatencyDuration: 5,
  liveDurationInfinity: true,
  // Add these for better compatibility
  xhrSetup: function(xhr, url) {
    xhr.setRequestHeader('Cache-Control', 'no-cache');
    xhr.setRequestHeader('Pragma', 'no-cache');
  }
});