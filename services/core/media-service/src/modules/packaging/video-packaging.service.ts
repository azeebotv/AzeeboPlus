import { Injectable } from '@nestjs/common';

/**
 * Video Packaging Service (TAA §23)
 *
 * Handles video packaging requirements:
 * - HLS baseline delivery
 * - CMAF/fMP4 packaging for cross-platform reuse
 * - Adaptive bitrate ladder with Data Saver rendition
 * - Captions/subtitles (WebVTT) from authoritative assets
 * - Playback telemetry tracking
 */

export interface PackagingJob {
  id: string;
  contentId: string;
  masterAssetKey: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  outputs: PackagingOutput[];
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
}

export interface PackagingOutput {
  /** Output format */
  format: 'hls' | 'cmaf' | 'mp4';
  /** Rendition quality */
  rendition: string;
  /** Output key in storage */
  key: string;
  /** File size in bytes */
  size: number;
  /** Duration in seconds */
  duration: number;
  /** Bitrate in kbps */
  bitrate: number;
  /** Resolution */
  resolution?: { width: number; height: number };
}

export interface RenditionConfig {
  /** Rendition name */
  name: string;
  /** Video bitrate in kbps */
  videoBitrate: number;
  /** Audio bitrate in kbps */
  audioBitrate: number;
  /** Resolution */
  resolution: { width: number; height: number };
  /** Frame rate */
  frameRate: number;
  /** Whether this is a Data Saver rendition */
  dataSaver: boolean;
}

export interface CaptionTrack {
  /** Track ID */
  id: string;
  /** Language code */
  language: string;
  /** Track label */
  label: string;
  /** Source asset key */
  assetKey: string;
  /** Output format */
  format: 'webvtt' | 'srt' | 'ttml';
  /** Whether this is the default track */
  isDefault: boolean;
}

@Injectable()
export class VideoPackagingService {
  /** Default adaptive bitrate ladder */
  private readonly DEFAULT_RENDITIONS: RenditionConfig[] = [
    {
      name: '1080p',
      videoBitrate: 5000,
      audioBitrate: 192,
      resolution: { width: 1920, height: 1080 },
      frameRate: 30,
      dataSaver: false,
    },
    {
      name: '720p',
      videoBitrate: 2500,
      audioBitrate: 128,
      resolution: { width: 1280, height: 720 },
      frameRate: 30,
      dataSaver: false,
    },
    {
      name: '480p',
      videoBitrate: 1000,
      audioBitrate: 96,
      resolution: { width: 854, height: 480 },
      frameRate: 30,
      dataSaver: false,
    },
    {
      name: '360p',
      videoBitrate: 600,
      audioBitrate: 64,
      resolution: { width: 640, height: 360 },
      frameRate: 30,
      dataSaver: false,
    },
    {
      name: 'data-saver',
      videoBitrate: 300,
      audioBitrate: 48,
      resolution: { width: 426, height: 240 },
      frameRate: 24,
      dataSaver: true,
    },
  ];

  constructor() {}

  /**
   * Get the adaptive bitrate ladder
   */
  getRenditions(): RenditionConfig[] {
    return [...this.DEFAULT_RENDITIONS];
  }

  /**
   * Get Data Saver rendition specifically
   */
  getDataSaverRendition(): RenditionConfig {
    return this.DEFAULT_RENDITIONS.find((r) => r.dataSaver) || this.DEFAULT_RENDITIONS[4];
  }

  /**
   * Generate HLS master playlist content
   */
  generateHlsMasterPlaylist(
    renditionOutputs: PackagingOutput[],
    captionTracks: CaptionTrack[] = []
  ): string {
    const lines: string[] = ['#EXTM3U', '#EXT-X-VERSION:3'];

    // Video renditions
    const videoOutputs = renditionOutputs.filter((o) => o.format === 'hls');
    for (const output of videoOutputs) {
      lines.push(
        `#EXT-X-STREAM-INF:BANDWIDTH=${output.bitrate * 1000},RESOLUTION=${output.resolution?.width}x${output.resolution?.height},CODECS="avc1.64001f,mp4a.40.2"`
      );
      lines.push(`${output.key}/index.m3u8`);
    }

    // Caption tracks
    for (const track of captionTracks) {
      lines.push(
        `#EXT-X-MEDIA:TYPE=SUBTITLES,GROUP-ID="subs",NAME="${track.label}",DEFAULT=${track.isDefault ? 'YES' : 'NO'},FORCED=NO,URI="${track.assetKey}"`
      );
    }

    return lines.join('\n');
  }

  /**
   * Generate CMAF MPD (Media Presentation Definition) for DASH
   */
  generateCmafMpd(
    _contentId: string,
    renditionOutputs: PackagingOutput[],
    duration: number
  ): string {
    const videoOutputs = renditionOutputs.filter((o) => o.format === 'cmaf');

    let mpd = `<?xml version="1.0" encoding="UTF-8"?>
<MPD xmlns="urn:mpeg:dash:schema:mpd:2011"
     type="static"
     mediaPresentationDuration="PT${duration}S"
     minBufferTime="PT2S"
     profiles="urn:mpeg:dash:profile:isoff-on-demand:2011">
  <Period id="1" start="PT0S">`;

    for (const output of videoOutputs) {
      mpd += `
    <AdaptationSet contentType="video" mimeType="video/mp4" codecs="avc1.64001f">
      <Representation id="${output.rendition}" bandwidth="${output.bitrate * 1000}" width="${output.resolution?.width}" height="${output.resolution?.height}">
        <BaseURL>${output.key}/</BaseURL>
        <SegmentTemplate timescale="90000" initialization="init.mp4" media="segment_$Number$.m4s" startNumber="1"/>
      </Representation>
    </AdaptationSet>`;
    }

    mpd += `
  </Period>
</MPD>`;

    return mpd;
  }

  /**
   * Generate WebVTT caption file from source
   */
  generateWebVtt(cues: Array<{ start: number; end: number; text: string }>): string {
    let vtt = 'WEBVTT\n\n';

    for (let i = 0; i < cues.length; i++) {
      const cue = cues[i];
      vtt += `${i + 1}\n`;
      vtt += `${this.formatTimestamp(cue.start)} --> ${this.formatTimestamp(cue.end)}\n`;
      vtt += `${cue.text}\n\n`;
    }

    return vtt;
  }

  /**
   * Format seconds to WebVTT timestamp (HH:MM:SS.mmm)
   */
  private formatTimestamp(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const ms = Math.round((seconds % 1) * 1000);

    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  }

  /**
   * Calculate total bitrate for a rendition
   */
  calculateTotalBitrate(rendition: RenditionConfig): number {
    return rendition.videoBitrate + rendition.audioBitrate;
  }

  /**
   * Estimate output file size for a rendition
   */
  estimateOutputSize(rendition: RenditionConfig, durationSeconds: number): number {
    const totalBitrate = this.calculateTotalBitrate(rendition);
    return Math.ceil((totalBitrate * 1000 * durationSeconds) / 8);
  }

  /**
   * Get optimal rendition for bandwidth
   */
  getOptimalRendition(bandwidthKbps: number, dataSaverEnabled: boolean = false): RenditionConfig {
    if (dataSaverEnabled) {
      return this.getDataSaverRendition();
    }

    // Find the highest quality rendition that fits the bandwidth
    const sorted = [...this.DEFAULT_RENDITIONS]
      .filter((r) => !r.dataSaver)
      .sort((a, b) => b.videoBitrate - a.videoBitrate);

    for (const rendition of sorted) {
      if (rendition.videoBitrate <= bandwidthKbps * 0.8) {
        return rendition;
      }
    }

    // Return lowest non-data-saver rendition
    return sorted[sorted.length - 1];
  }

  /**
   * Generate packaging manifest for content
   */
  generatePackagingManifest(
    _contentId: string,
    outputs: PackagingOutput[],
    captionTracks: CaptionTrack[]
  ): Record<string, unknown> {
    return {
      contentId: _contentId,
      version: '1.0',
      generatedAt: new Date().toISOString(),
      formats: {
        hls: {
          masterPlaylist: `content/${_contentId}/hls/master.m3u8`,
          renditions: outputs.filter((o) => o.format === 'hls'),
        },
        cmaf: {
          mpd: `content/${_contentId}/cmaf/manifest.mpd`,
          renditions: outputs.filter((o) => o.format === 'cmaf'),
        },
        mp4: {
          progressive: outputs.filter((o) => o.format === 'mp4'),
        },
      },
      captions: captionTracks,
      totalSize: outputs.reduce((sum, o) => sum + o.size, 0),
      totalDuration: outputs[0]?.duration || 0,
    };
  }

  /**
   * Validate packaging outputs
   */
  validateOutputs(outputs: PackagingOutput[]): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (outputs.length === 0) {
      errors.push('No packaging outputs generated');
    }

    // Check we have at least one HLS output
    if (!outputs.some((o) => o.format === 'hls')) {
      errors.push('HLS output is required');
    }

    // Check renditions are complete
    const requiredRenditions = ['1080p', '720p', '480p', '360p'];
    const presentRenditions = new Set(outputs.map((o) => o.rendition));
    for (const required of requiredRenditions) {
      if (!presentRenditions.has(required)) {
        errors.push(`Missing rendition: ${required}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
