// proxy-server.js
const express = require('express');
const fetch = require('node-fetch');
const { PassThrough } = require('stream');
const { createServer } = require('http');
const app = express();
const server = createServer(app);

// Configuration
const PORT = process.env.PORT || 3001;
const SEGMENT_DURATION = 6; // seconds per segment
const SEGMENT_COUNT = 5; // number of segments to keep in buffer

// Store active streams
const activeStreams = new Map();



// Generate HLS manifest
function generateManifest(streamId, segments) {
    let manifest = '#EXTM3U\n';
    manifest += '#EXT-X-VERSION:3\n';
    manifest += '#EXT-X-MEDIA-SEQUENCE:0\n';
    manifest += '#EXT-X-TARGETDURATION:6\n';
    manifest += '#EXT-X-ALLOW-CACHE:NO\n';
    
    segments.forEach(segment => {
        manifest += `#EXTINF:${SEGMENT_DURATION.toFixed(3)},\n`;
        manifest += `/proxy/segment/${streamId}/${segment.index}\n`;
    });
    
    return manifest;
}

// Proxy endpoint for converting .TS to HLS
app.get('/proxy/ts-to-hls', async (req, res) => {
    const originalUrl = req.query.url;
    if (!originalUrl) {
        return res.status(400).send('Missing URL parameter');
    }
    
    // Generate a unique stream ID
    const streamId = Buffer.from(originalUrl).toString('base64').replace(/[^a-zA-Z0-9]/g, '');
    
    // If stream is already active, return its manifest
    if (activeStreams.has(streamId)) {
        const streamData = activeStreams.get(streamId);
        return res.type('application/vnd.apple.mpegurl').send(generateManifest(streamId, streamData.segments));
    }
    
    // Initialize stream data
    const streamData = {
        originalUrl,
        segments: [],
        currentSegment: 0,
        buffer: Buffer.alloc(0),
        segmentSize: SEGMENT_DURATION * 188 * 1024, // Approximate size for 6 seconds
    };
    
    activeStreams.set(streamId, streamData);
    
    // Start fetching the stream
    try {
        const response = await fetch(originalUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch stream: ${response.status}`);
        }
        
        // Handle the stream
        response.body.on('data', (chunk) => {
            streamData.buffer = Buffer.concat([streamData.buffer, chunk]);
            
            // Check if we have enough data for a segment
            if (streamData.buffer.length >= streamData.segmentSize) {
                const segmentBuffer = streamData.buffer.slice(0, streamData.segmentSize);
                streamData.buffer = streamData.buffer.slice(streamData.segmentSize);
                
                // Create a new segment
                const segmentIndex = streamData.currentSegment++;
                streamData.segments.push({
                    index: segmentIndex,
                    data: segmentBuffer,
                });
                
                // Keep only the last SEGMENT_COUNT segments
                if (streamData.segments.length > SEGMENT_COUNT) {
                    streamData.segments.shift();
                }
            }
        });
        
        response.body.on('end', () => {
            console.log(`Stream ended for ${streamId}`);
            // Keep the stream active for a while in case of reconnects
            setTimeout(() => {
                activeStreams.delete(streamId);
            }, 30000);
        });
        
        response.body.on('error', (error) => {
            console.error(`Stream error for ${streamId}:`, error);
            activeStreams.delete(streamId);
        });
        
        // Return the initial manifest
        res.type('application/vnd.apple.mpegurl').send(generateManifest(streamId, streamData.segments));
    } catch (error) {
        console.error('Error setting up stream:', error);
        activeStreams.delete(streamId);
        res.status(500).send('Error setting up stream');
    }
});

// Serve individual segments
app.get('/proxy/segment/:streamId/:segmentIndex', (req, res) => {
    const { streamId, segmentIndex } = req.params;
    
    if (!activeStreams.has(streamId)) {
        return res.status(404).send('Stream not found');
    }
    
    const streamData = activeStreams.get(streamId);
    const segment = streamData.segments.find(s => s.index === parseInt(segmentIndex));
    
    if (!segment) {
        return res.status(404).send('Segment not found');
    }
    
    res.type('video/mp2t').send(segment.data);
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.send('Proxy server is running');
});

server.listen(PORT, () => {
    console.log(`Proxy server running on port ${PORT}`);
});