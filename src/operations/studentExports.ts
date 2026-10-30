import { strToU8, zipSync } from 'fflate';
import { accountLabel, formatStudentDate } from './studentRecordsModel';

export interface StudentRecord {
  id: string; request_id: string | null; reference: string; pass_code: string | null; student_id: string | null; has_login: boolean;
  name: string; email: string; contact_number: string; whatsapp_number: string;
  institute_name: string; city_town: string; course_stream: string; board: string;
  food_preference: string; competitions: string; status: string; created_at: string;
  checked_in_at: string | null; food_redeemed_at: string | null; parent_consent: boolean; terms_accepted: boolean;
}
export const studentColumns: [string, keyof StudentRecord][] = [
  ['Reference','reference'],['Student ID','student_id'],['Pass ID','pass_code'],['Account access','has_login'],['Name','name'],['Email','email'],['Phone','contact_number'],
  ['WhatsApp','whatsapp_number'],['Institute','institute_name'],['City','city_town'],['Course','course_stream'],
  ['Board','board'],['Meal','food_preference'],['Competitions','competitions'],['Status','status'],
  ['Registered (IST)','created_at'],['Checked in (IST)','checked_in_at'],['Meal issued (IST)','food_redeemed_at'],
  ['Parent consent','parent_consent'],['Terms accepted','terms_accepted'],
];
const xml = (value: unknown) => String(value ?? '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
export function studentValue(row: StudentRecord, key: keyof StudentRecord): string {
  if (key === 'has_login') return accountLabel(row);
  if (['created_at','checked_in_at','food_redeemed_at'].includes(key)) return formatStudentDate(row[key] as string | null);
  if (key === 'parent_consent' || key === 'terms_accepted') return row[key] ? 'Yes' : 'Not recorded';
  return String(row[key] ?? '');
}
function columnName(index: number): string {
  let name = '';
  for (let n = index + 1; n > 0; n = Math.floor((n - 1) / 26)) name = String.fromCharCode(65 + (n - 1) % 26) + name;
  return name;
}
// Inline strings preserve phone numbers and prevent user input from becoming Excel formulas.
export function studentWorkbook(records: StudentRecord[]): Uint8Array {
  const rows = [studentColumns.map(([label])=>label), ...records.map(row=>studentColumns.map(([,key])=>studentValue(row,key)))];
  const widths = [27,16,43,22,28,34,18,18,36,22,20,14,14,46,16,27,27,27,20,20];
  const sheet = `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols>${studentColumns.map((_,i)=>`<col min="${i+1}" max="${i+1}" width="${widths[i] || 25}" customWidth="1"/>`).join('')}</cols><sheetData>${rows.map((row,i)=>`<row r="${i+1}" ht="${i===0?30:48}" customHeight="1">${row.map((cell,j)=>`<c r="${columnName(j)}${i+1}" s="${i===0?1:i%2===0?3:2}" t="inlineStr"><is><t xml:space="preserve">${xml(cell)}</t></is></c>`).join('')}</row>`).join('')}</sheetData><autoFilter ref="A1:${columnName(studentColumns.length-1)}${rows.length}"/><pageMargins left="0.3" right="0.3" top="0.5" bottom="0.5" header="0.2" footer="0.2"/><pageSetup orientation="landscape" paperSize="8"/></worksheet>`;
  return zipSync(Object.fromEntries(Object.entries({
    '[Content_Types].xml': '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>',
    '_rels/.rels': '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
    'xl/workbook.xml': '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Students" sheetId="1" r:id="rId1"/></sheets></workbook>',
    'xl/_rels/workbook.xml.rels': '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>',
    'xl/styles.xml': '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><color rgb="FFFFFFFF"/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="4"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF142023"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFF2F5F3"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="4"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf><xf numFmtId="0" fontId="0" fillId="3" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>',
    'xl/worksheets/sheet1.xml': sheet,
  }).map(([path,value])=>[path,strToU8(value)])));
}
export async function studentPdf(records: StudentRecord[]) {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([import('jspdf'),import('jspdf-autotable')]);
  const doc = new jsPDF({format:'a4'});
  const exported = formatStudentDate(new Date().toISOString());
  // One complete student record per page, with readable field labels rather than
  // a 20-column table split horizontally across several sheets.
  for (const [index,row] of records.entries()) {
    if(index) doc.addPage();
    autoTable(doc, { startY:32, margin:{top:32,bottom:18,left:14,right:14},
      head:[[{content:`${index+1}. ${row.name}`,colSpan:2}]],
      body:studentColumns.filter(([,key])=>key!=='name').map(([label,key])=>[label,studentValue(row,key)||'—']),
      theme:'striped', styles:{fontSize:10,cellPadding:3,overflow:'linebreak',valign:'top'},
      headStyles:{fillColor:[20,32,35],fontSize:12}, alternateRowStyles:{fillColor:[244,247,245]},
      columnStyles:{0:{cellWidth:52,fontStyle:'bold',textColor:[80,95,90]},1:{cellWidth:130}},
      rowPageBreak:'avoid',
      didDrawPage:()=>{doc.setFontSize(14);doc.setTextColor(20,32,35);doc.text('CrossFire | Student registration records',14,16);doc.setFontSize(8);doc.setTextColor(90,100,95);doc.text(`Exported ${exported} IST | ${records.length} records | Private student data`,14,23);},
    });
  }
  if(!records.length) {doc.setFontSize(14);doc.text('CrossFire | No student records',14,20);}
  const pages=doc.getNumberOfPages();
  for(let page=1;page<=pages;page++){doc.setPage(page);doc.setFontSize(8);doc.setTextColor(90,100,95);doc.text(`Page ${page} of ${pages}`,14,289);}
  return doc;
}
export async function downloadStudents(records: StudentRecord[], format: 'xlsx'|'pdf') {
  if(format==='pdf') { (await studentPdf(records)).save('crossfire-students.pdf'); return; }
  const bytes = studentWorkbook(records);
  const url=URL.createObjectURL(new Blob([new Uint8Array(bytes)],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}));
  const link=document.createElement('a');link.href=url;link.download='crossfire-students.xlsx';link.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}
