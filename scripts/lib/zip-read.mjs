/**
 * zip-read.mjs — minimal ZIP archive reader (zero dependencies).
 *
 * GitHub's artifact download endpoint (`.../artifacts/{id}/zip`) returns a ZIP
 * archive, and this repo's scripts convention is zero runtime dependencies —
 * so instead of adding a zip package for one narrow use, this module parses
 * the archive's Central Directory directly and inflates entries with Node's
 * built-in zlib.
 *
 * Scope (deliberately narrow, but honest): handles stored (method 0) and
 * deflated (method 8) entries as produced by actions/upload-artifact v4,
 * including entries whose sizes live only in the Central Directory (bit-3
 * data-descriptor streams). ZIP64 — only used for archives >4 GB or >65k
 * entries, far beyond any drift-report artifact — is rejected with a clear
 * error rather than silently misread.
 *
 * Used by scripts/post-drift-pr-comment.mjs to pull the nightly
 * check-live-schema-lock reports out of the schema-lock-nightly workflow's
 * artifacts. Unit-tested in scripts/__tests__/zip-read.test.mjs.
 */

import zlib from 'node:zlib';

const EOCD_SIG = 0x06054b50; // PK\x05\x06
const CEN_SIG = 0x02014b50; // PK\x01\x02
const LOC_SIG = 0x04034b50; // PK\x03\x04

function u16(buf, off) {
  return buf.readUInt16LE(off);
}
function u32(buf, off) {
  return buf.readUInt32LE(off);
}

/**
 * Parse a ZIP buffer into entries.
 *
 * @param {Buffer|Uint8Array} archive raw zip bytes
 * @returns {Array<{name: string, data: Buffer}>} entries in Central-Directory
 *   order (directories are skipped).
 * @throws {Error} on not-a-zip, truncated/corrupt structure, unsupported
 *   compression, or ZIP64 overflow markers.
 */
export function readZipEntries(archive) {
  const buf = Buffer.isBuffer(archive) ? archive : Buffer.from(archive);
  const eocd = findEocd(buf);
  if (!eocd) throw new Error('zip-read: not a ZIP archive (no End Of Central Directory record)');

  const entryCount = u16(buf, eocd + 10);
  let cdOffset = u32(buf, eocd + 16);
  const cdSize = u32(buf, eocd + 12);

  // ZIP64 markers: 0xFFFFFFFF/0xFFFF mean the real value lives in ZIP64
  // extra fields, which this reader intentionally does not implement.
  if (entryCount === 0xffff || cdOffset === 0xffffffff || cdSize === 0xffffffff) {
    throw new Error('zip-read: ZIP64 archive — not supported (artifact too large for this reader)');
  }
  if (cdOffset + cdSize > buf.length) {
    throw new Error(`zip-read: corrupt ZIP — central directory (${cdSize}B at ${cdOffset}) exceeds archive (${buf.length}B)`);
  }

  const entries = [];
  let off = cdOffset;
  for (let i = 0; i < entryCount; i++) {
    if (off + 46 > buf.length || u32(buf, off) !== CEN_SIG) {
      throw new Error(`zip-read: corrupt ZIP — bad Central Directory entry ${i} at offset ${off}`);
    }
    const method = u16(buf, off + 10);
    const compressedSize = u32(buf, off + 20);
    const nameLen = u16(buf, off + 28);
    const extraLen = u16(buf, off + 30);
    const commentLen = u16(buf, off + 32);
    const localOffset = u32(buf, off + 42);
    const name = buf.toString('utf8', off + 46, off + 46 + nameLen);

    off += 46 + nameLen + extraLen + commentLen;

    if (name.endsWith('/')) continue; // directory entry

    // Real data start comes from the LOCAL header (its extra field length can
    // differ from the Central Directory's — the sizes we use are the central
    // ones, which are always authoritative even with bit-3 data descriptors).
    if (localOffset + 30 > buf.length || u32(buf, localOffset) !== LOC_SIG) {
      throw new Error(`zip-read: corrupt ZIP — bad local header for "${name}" at offset ${localOffset}`);
    }
    const localNameLen = u16(buf, localOffset + 26);
    const localExtraLen = u16(buf, localOffset + 28);
    const dataStart = localOffset + 30 + localNameLen + localExtraLen;
    const dataEnd = dataStart + compressedSize;
    if (dataEnd > buf.length) {
      throw new Error(`zip-read: corrupt ZIP — entry "${name}" data overruns the archive`);
    }
    const raw = buf.subarray(dataStart, dataEnd);

    let data;
    if (method === 0) {
      data = Buffer.from(raw); // stored — copy out of the view
    } else if (method === 8) {
      data = zlib.inflateRawSync(raw);
    } else {
      throw new Error(`zip-read: unsupported compression method ${method} for entry "${name}"`);
    }

    entries.push({ name, data });
  }
  return entries;
}

/** Scan the tail of the buffer for the EOCD signature (comment may follow it). */
function findEocd(buf) {
  const minPos = Math.max(0, buf.length - 22 - 0xffff); // fixed size + max comment
  for (let i = buf.length - 22; i >= minPos; i--) {
    if (u32(buf, i) === EOCD_SIG) return i;
  }
  return null;
}
