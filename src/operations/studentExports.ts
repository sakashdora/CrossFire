import { strToU8, zipSync } from 'fflate';

export interface StudentRecord {
  id: string; request_id: string | null; reference: string; pass_code: string | null;
  name: string; email: string; contact_number: string; whatsapp_number: string;
  institute_name: string; city_town: string; course_stream: string; board: string;
  food_preference: string; competitions: string; status: string; created_at: string;
  checked_in_at: string | null; food_redeemed_at: string | null; parent_consent: boolean; terms_accepted: boolean;
}
export const studentColumns: [string, keyof StudentRecord][] = [
  ['Reference','reference'],['Pass ID','pass_code'],['Name','name'],['Email','email'],['Phone','contact_number'],
  ['WhatsApp','whatsapp_number'],['Institute','institute_name'],['City','city_town'],['Course','course_stream'],
  ['Board','board'],['Meal','food_preference'],['Competitions','competitions'],['Status','status'],
  ['Registered (UTC)','created_at'],['Checked in (UTC)','checked_in_at'],['Meal issued (UTC)','food_redeemed_at'],
  ['Parent consent','parent_consent'],['Terms accepted','terms_accepted'],
];
const xml = (value: unknown) => String(value ?? '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
// Inline strings preserve phone numbers and prevent user input from becoming Excel formulas.
export function studentWorkbook(records: StudentRecord[]): Uint8Array {
  const rows = [studentColumns.map(([label])=>label), ...records.map(row=>studentColumns.map(([,key])=>String(row[key] ?? '')))];
  const sheet = `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" state="frozen"/></sheetView></sheetViews><cols><col min="1" max="18" width="25" customWidth="1"/></cols><sheetData>${rows.map((row,i)=>`<row r="${i+1}">${row.map((cell,j)=>`<c r="${String.fromCharCode(65+j)}${i+1}" t="inlineStr"><is><t xml:space="preserve">${xml(cell)}</t></is></c>`).join('')}</row>`).join('')}</sheetData><autoFilter ref="A1:R${rows.length}"/></worksheet>`;
  return zipSync(Object.fromEntries(Object.entries({
    '[Content_Types].xml': '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>',
    '_rels/.rels': '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
    'xl/workbook.xml': '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Students" sheetId="1" r:id="rId1"/></sheets></workbook>',
    'xl/_rels/workbook.xml.rels': '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>',
    'xl/worksheets/sheet1.xml': sheet,
  }).map(([path,value])=>[path,strToU8(value)])));
}
export async function studentPdf(records: StudentRecord[]) {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([import('jspdf'),import('jspdf-autotable')]);
  const doc = new jsPDF({orientation:'landscape',format:'a3'});
  doc.setFontSize(16); doc.text(`CrossFire student records (${records.length})`,14,15);
  doc.setFontSize(9); doc.text(`Exported ${new Date().toISOString()} | Private student data`,14,22);
  autoTable(doc,{startY:28, head:[studentColumns.map(([label])=>label)],body:records.map(row=>studentColumns.map(([,key])=>String(row[key] ?? ''))),
    styles:{fontSize:7,cellPadding:2,overflow:'linebreak'}, horizontalPageBreak:true, horizontalPageBreakRepeat:0,
    didDrawPage:()=>{doc.setFontSize(8);doc.text(`Page ${doc.getNumberOfPages()}`,14,doc.internal.pageSize.getHeight()-8);}});
  return doc;
}
export async function downloadStudents(records: StudentRecord[], format: 'xlsx'|'pdf') {
  if(format==='pdf') { (await studentPdf(records)).save('crossfire-students.pdf'); return; }
  const bytes = studentWorkbook(records);
  const url=URL.createObjectURL(new Blob([new Uint8Array(bytes)],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}));
  const link=document.createElement('a');link.href=url;link.download='crossfire-students.xlsx';link.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}
