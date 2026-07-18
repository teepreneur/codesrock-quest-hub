import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import https from 'https';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables are required in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Extract 11-character video ID from YouTube URL
function extractYouTubeVideoId(url: string | undefined): string | null {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : url.trim();
}

// Parse ISO 8601 duration (e.g. PT1M55S) to seconds
function parseISO8601Duration(durationStr: string): number {
  const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
  const matches = durationStr.match(regex);
  if (!matches) return 0;
  
  const hours = parseInt(matches[1] || '0', 10);
  const minutes = parseInt(matches[2] || '0', 10);
  const seconds = parseInt(matches[3] || '0', 10);
  
  return (hours * 3600) + (minutes * 60) + seconds;
}

// Fetch HTML of YouTube watch page and parse duration metadata
function fetchVideoDurationSeconds(videoId: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    };

    https.get(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          // Method 1: Check itemprop="duration"
          const itemPropMatch = data.match(/itemprop="duration"\s+content="([^"]+)"/);
          if (itemPropMatch && itemPropMatch[1]) {
            const secs = parseISO8601Duration(itemPropMatch[1]);
            if (secs > 0) {
              return resolve(secs);
            }
          }

          // Method 2: Check approxDurationMs in ytInitialPlayerResponse JSON
          const durationMsMatch = data.match(/"approxDurationMs"\s*:\s*"(\d+)"/);
          if (durationMsMatch && durationMsMatch[1]) {
            const secs = Math.round(parseInt(durationMsMatch[1], 10) / 1000);
            if (secs > 0) {
              return resolve(secs);
            }
          }

          reject(new Error('Could not find duration metadata in YouTube HTML'));
        } catch (err) {
          reject(err);
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

async function runDurationUpdater() {
  console.log('🔄 Fetching video list from database...');
  
  const { data: videos, error } = await supabase
    .from('videos')
    .select('id, title, video_url, duration');

  if (error) {
    console.error('❌ Error fetching videos:', error);
    process.exit(1);
  }

  if (!videos || videos.length === 0) {
    console.log('ℹ️ No videos found in database.');
    return;
  }

  console.log(`Found ${videos.length} videos. Checking YouTube durations...`);
  let updatedCount = 0;

  for (const video of videos) {
    const videoId = extractYouTubeVideoId(video.video_url || '');
    if (!videoId || videoId.length !== 11) {
      console.log(`⚠️ Skipping "${video.title}": Invalid YouTube URL/ID (${video.video_url})`);
      continue;
    }

    console.log(`🔍 Checking "${video.title}" (ID: ${videoId})...`);
    try {
      const durationSeconds = await fetchVideoDurationSeconds(videoId);
      const calculatedMinutes = Math.ceil(durationSeconds / 60);

      if (video.duration === calculatedMinutes) {
        console.log(`   ✅ No change needed (${calculatedMinutes} min)`);
      } else {
        // Update database duration
        const { error: updateError } = await supabase
          .from('videos')
          .update({ duration: calculatedMinutes })
          .eq('id', video.id);

        if (updateError) {
          console.error(`   ❌ Failed to update database:`, updateError);
        } else {
          console.log(`   🚀 Updated: ${video.duration} min ➔ ${calculatedMinutes} min`);
          updatedCount++;
        }
      }
    } catch (err: any) {
      console.error(`   ❌ Failed to fetch duration: ${err.message}`);
    }

    // Brief delay to avoid rate limiting
    await new Promise((r) => setTimeout(r, 1000));
  }

  console.log(`\n🎉 Completed! Updated duration for ${updatedCount} videos.`);
}

runDurationUpdater()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  });
