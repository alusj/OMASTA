// Reads uploaded tables into string[][] — CSV text or .xlsx workbooks (first worksheet).
// The .xlsx reader is dependency-free: it unzips with the platform's DecompressionStream and reads the sheet XML.

export function readCSV(text) {
  text = text.replace(/^﻿/, '');
  const delimiter = (text.split(/\r?\n/, 1)[0].match(/;/g)?.length ?? 0) > (text.split(/\r?\n/, 1)[0].match(/,/g)?.length ?? 0) ? ';' : ',';
  const rows = []; let row = [], cell = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') { if (quoted && text[i + 1] === '"') { cell += '"'; i++; } else if (!quoted && cell.trim()) throw new Error(`Unexpected quote on line ${rows.length + 1}.`); else quoted = !quoted; }
    else if (!quoted && c === delimiter) { row.push(cell.trim()); cell = ''; }
    else if (!quoted && (c === '\n' || c === '\r')) { if (c === '\r' && text[i + 1] === '\n') i++; row.push(cell.trim()); if (row.some(Boolean)) rows.push(row); row = []; cell = ''; }
    else cell += c;
  }
  if (quoted) throw new Error('A quoted field is never closed.');
  row.push(cell.trim()); if (row.some(Boolean)) rows.push(row);
  return rows;
}

const entities = {amp:'&', lt:'<', gt:'>', quot:'"', apos:"'"};
const decode = s => s.replace(/&(#x[0-9a-f]+|#\d+|\w+);/gi, (m, e) => e[0] === '#' ? String.fromCodePoint(e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : Number(e.slice(1))) : entities[e] ?? m);
const textOf = xml => [...xml.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)].map(m => decode(m[1])).join('');
const columnIndex = ref => [...ref.replace(/\d+/g, '')].reduce((n, ch) => n * 26 + ch.charCodeAt(0) - 64, 0) - 1;

async function unzip(buffer, wanted) {
  const view = new DataView(buffer), bytes = new Uint8Array(buffer), out = {};
  let end = -1;
  for (let i = buffer.byteLength - 22; i >= Math.max(0, buffer.byteLength - 66000); i--) if (view.getUint32(i, true) === 0x06054b50) { end = i; break; }
  if (end < 0) throw new Error('This is not a valid .xlsx file. Save it as Excel Workbook (.xlsx) or CSV.');
  let p = view.getUint32(end + 16, true);
  for (let n = view.getUint16(end + 10, true); n > 0; n--) {
    if (view.getUint32(p, true) !== 0x02014b50) throw new Error('The .xlsx file is damaged.');
    const method = view.getUint16(p + 10, true), size = view.getUint32(p + 20, true), nameLen = view.getUint16(p + 28, true), extraLen = view.getUint16(p + 30, true), commentLen = view.getUint16(p + 32, true), local = view.getUint32(p + 42, true);
    const name = new TextDecoder().decode(bytes.subarray(p + 46, p + 46 + nameLen));
    if (wanted(name)) {
      const start = local + 30 + view.getUint16(local + 26, true) + view.getUint16(local + 28, true), data = bytes.subarray(start, start + size);
      if (method === 0) out[name] = new TextDecoder().decode(data);
      else if (method === 8) out[name] = await new Response(new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).text();
      else throw new Error('The .xlsx file uses an unsupported compression method.');
    }
    p += 46 + nameLen + extraLen + commentLen;
  }
  return out;
}

export async function readXLSX(buffer) {
  const files = await unzip(buffer, name => name === 'xl/workbook.xml' || name === 'xl/_rels/workbook.xml.rels' || name === 'xl/sharedStrings.xml' || name.startsWith('xl/worksheets/sheet'));
  if (!files['xl/workbook.xml']) throw new Error('No workbook found inside the .xlsx file.');
  const firstSheet = files['xl/workbook.xml'].match(/<sheet\b[^>]*\br:id="([^"]+)"/)?.[1];
  const rels = files['xl/_rels/workbook.xml.rels'] ?? '', target = firstSheet ? (rels.match(new RegExp(`<Relationship[^>]*Id="${firstSheet}"[^>]*Target="([^"]+)"`))?.[1] ?? rels.match(new RegExp(`<Relationship[^>]*Target="([^"]+)"[^>]*Id="${firstSheet}"`))?.[1]) : null;
  const sheetPath = target ? 'xl/' + target.replace(/^\/?xl\//, '').replace(/^\.\//, '') : 'xl/worksheets/sheet1.xml';
  const sheet = files[sheetPath] ?? files['xl/worksheets/sheet1.xml'];
  if (!sheet) throw new Error('The first worksheet could not be read.');
  const shared = files['xl/sharedStrings.xml'] ? [...files['xl/sharedStrings.xml'].matchAll(/<si>([\s\S]*?)<\/si>/g)].map(m => textOf(m[1])) : [];
  const rows = [];
  for (const [, rowXml] of sheet.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)) {
    const row = [];
    for (const [, attrs, body = ''] of rowXml.matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const ref = attrs.match(/\br="([A-Z]+\d+)"/)?.[1], type = attrs.match(/\bt="(\w+)"/)?.[1], value = body.match(/<v>([\s\S]*?)<\/v>/)?.[1];
      const text = type === 's' ? shared[Number(value)] ?? '' : type === 'inlineStr' ? textOf(body) : type === 'b' ? (value === '1' ? 'TRUE' : 'FALSE') : decode(value ?? '');
      row[ref ? columnIndex(ref) : row.length] = text.trim();
    }
    const filled = Array.from(row, v => v ?? '');
    if (filled.some(Boolean)) rows.push(filled);
  }
  const width = rows[0]?.length ?? 0;
  return rows.map(r => r.length >= width ? r.slice(0, Math.max(width, r.length)) : [...r, ...Array(width - r.length).fill('')]);
}

export async function readTable(file) {
  const name = file.name.toLowerCase();
  if (name.endsWith('.xlsx')) return readXLSX(await file.arrayBuffer());
  if (name.endsWith('.xls')) throw new Error('Old .xls workbooks are not supported. Save as .xlsx or CSV.');
  return readCSV(await file.text());
}
