import { inflateSync } from "node:zlib";

interface FontTable {
  tag: string;
  data: Buffer;
  checksum: number;
}

// resvg reads TrueType, not WOFF. Fontsource ships WOFF, so the build converts
// each file in memory and does not write a second copy of the font to the repo.
export function woffToSfnt(woff: Buffer): Buffer {
  if (woff.toString("ascii", 0, 4) !== "wOFF") throw new Error("Expected a WOFF font.");
  const flavor = woff.readUInt32BE(4);
  const numTables = woff.readUInt16BE(12);
  const tables: FontTable[] = [];
  let directory = 44;
  for (let index = 0; index < numTables; index += 1) {
    const tag = woff.toString("ascii", directory, directory + 4);
    const offset = woff.readUInt32BE(directory + 4);
    const compLength = woff.readUInt32BE(directory + 8);
    const origLength = woff.readUInt32BE(directory + 12);
    const checksum = woff.readUInt32BE(directory + 16);
    const slice = woff.subarray(offset, offset + compLength);
    const data = compLength === origLength ? Buffer.from(slice) : inflateSync(slice);
    if (data.length !== origLength) throw new Error(`WOFF table ${tag} expanded to ${data.length}, expected ${origLength}.`);
    tables.push({ tag, data, checksum });
    directory += 20;
  }
  tables.sort((a, b) => (a.tag < b.tag ? -1 : a.tag > b.tag ? 1 : 0));

  const searchRange = 2 ** Math.floor(Math.log2(numTables)) * 16;
  const entrySelector = Math.floor(Math.log2(numTables));
  const rangeShift = numTables * 16 - searchRange;
  const header = Buffer.alloc(12);
  header.writeUInt32BE(flavor, 0);
  header.writeUInt16BE(numTables, 4);
  header.writeUInt16BE(searchRange, 6);
  header.writeUInt16BE(entrySelector, 8);
  header.writeUInt16BE(rangeShift, 10);

  let dataOffset = 12 + numTables * 16;
  const records: Buffer[] = [];
  const body: Buffer[] = [];
  for (const table of tables) {
    const record = Buffer.alloc(16);
    record.write(table.tag, 0, 4, "ascii");
    record.writeUInt32BE(table.checksum >>> 0, 4);
    record.writeUInt32BE(dataOffset, 8);
    record.writeUInt32BE(table.data.length, 12);
    records.push(record);
    const pad = (4 - (table.data.length % 4)) % 4;
    body.push(table.data);
    if (pad) body.push(Buffer.alloc(pad));
    dataOffset += table.data.length + pad;
  }
  return Buffer.concat([header, ...records, ...body]);
}
