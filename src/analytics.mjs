const normalise = value => value.toLowerCase().replace(/[^a-z0-9]/g,'');
const fields = {
  state:['state','location','region'], areaCode:['areacode'], accountLength:['accountlength'],
  internationalPlan:['internationalplan','intlplan'], voiceMailPlan:['voicemailplan','vmailplan'],
  dayMinutes:['totaldayminutes','dayminutes','daymins'], dayCalls:['totaldaycalls','daycalls'], dayCharge:['totaldaycharge','daycharge','daycharges'],
  eveningMinutes:['totaleveminutes','totaleveningminutes','eveningminutes','eveminutes','evemins'], eveningCalls:['totalevecalls','totaleveningcalls','eveningcalls','evecalls'], eveningCharge:['totalevecharge','totaleveningcharge','eveningcharge','eveningcharges','evecharge'],
  nightMinutes:['totalnightminutes','nightminutes','nightmins'], nightCalls:['totalnightcalls','nightcalls'], nightCharge:['totalnightcharge','nightcharge','nightcharges'],
  internationalMinutes:['totalintlminutes','totalinternationalminutes','internationalminutes','intlminutes','intlmins'], internationalCalls:['totalintlcalls','totalinternationalcalls','internationalcalls','intlcalls'], internationalCharge:['totalintlcharge','totalinternationalcharge','internationalcharge','internationalcharges','intlcharge'],
  customerServiceCalls:['customerservicecalls','custservcalls'],
};
export const datasetTemplate = 'state,area_code,account_length,international_plan,voice_mail_plan,total_day_minutes,total_day_calls,total_day_charge,total_eve_minutes,total_eve_calls,total_eve_charge,total_night_minutes,total_night_calls,total_night_charge,total_intl_minutes,total_intl_calls,total_intl_charge,customer_service_calls,churn';
function readCSV(text) {
  const rows=[];let row=[],cell='',quoted=false;
  for(let i=0;i<text.length;i++) {
    const c=text[i];
    if(c==='"') {if(quoted&&text[i+1]==='"'){cell+='"';i++;}else if(!quoted&&cell.trim()){throw new Error('Unexpected quote in CSV.');}else quoted=!quoted;}
    else if(!quoted&&c===','){row.push(cell.trim());cell='';}
    else if(!quoted&&(c==='\n'||c==='\r')) {if(c==='\r'&&text[i+1]==='\n')i++;row.push(cell.trim());if(row.some(Boolean))rows.push(row);row=[];cell='';}
    else cell+=c;
  }
  if(quoted)throw new Error('Unclosed quoted field in CSV.');
  row.push(cell.trim());if(row.some(Boolean))rows.push(row);
  return rows;
}
function yesNo(value,field,row,optional=false) {
  const cleaned=value.toLowerCase().replace(/\.$/,'');
  if(optional&&(!cleaned||['unknown','null','na','n/a'].includes(cleaned)))return null;
  if(['yes','true','1'].includes(cleaned))return true;
  if(['no','false','0'].includes(cleaned))return false;
  throw new Error(`Row ${row}: ${field} must be yes/no or true/false.`);
}
export function parseCustomerCSV(text,defaultDepartment='B2C') {
  if(typeof text!=='string'||text.length>5_000_000)throw new Error('Use a CSV smaller than 5 MB.');
  if(!['B2C','B2B'].includes(defaultDepartment))throw new Error('Select B2C or B2B for this telecom dataset.');
  const csv=readCSV(text.replace(/^\uFEFF/,''));
  if(csv.length<2)throw new Error('The CSV must include a header and at least one customer.');
  if(csv.length>50_001)throw new Error('Import up to 50,000 rows at a time.');
  const headers=csv[0].map(normalise);
  if(new Set(headers).size!==headers.length)throw new Error('Duplicate column names in CSV.');
  const indexes=Object.fromEntries(Object.entries(fields).map(([key,aliases])=>[key,headers.findIndex(h=>aliases.includes(h))]));
  const missing=Object.entries(indexes).filter(([,i])=>i<0).map(([key])=>key);
  if(missing.length)throw new Error('Missing columns: '+missing.join(', ')+'. Download the template for accepted names.');
  const churnIndex=headers.findIndex(h=>['churn','churned'].includes(h)), departmentIndex=headers.indexOf('department');
  return csv.slice(1).map((cells,i)=>{
    if(cells.length!==headers.length)throw new Error(`Row ${i+2}: expected ${headers.length} columns, found ${cells.length}.`);
    const record={id:`ROW-${String(i+1).padStart(5,'0')}`,department:departmentIndex<0?defaultDepartment:cells[departmentIndex]};
    if(!['B2C','B2B'].includes(record.department))throw new Error(`Row ${i+2}: department must be B2C or B2B.`);
    for(const [field,index] of Object.entries(indexes)) {
      const value=cells[index];
      if(field==='state'||field==='areaCode'){if(!value)throw new Error(`Row ${i+2}: ${field} is required.`);record[field]=value;}
      else if(field==='internationalPlan'||field==='voiceMailPlan')record[field]=yesNo(value,field,i+2);
      else {const number=Number(value);if(!value||!Number.isFinite(number)||number<0||((field.endsWith('Calls')||field==='accountLength')&&!Number.isInteger(number)))throw new Error(`Row ${i+2}: ${field} must be a non-negative ${field.endsWith('Calls')||field==='accountLength'?'whole number':'number'}.`);record[field]=number;}
    }
    record.churn=churnIndex<0?null:yesNo(cells[churnIndex],'churn',i+2,true);
    return record;
  });
}
export function reviewSignals(customer) {
  const signals=[];
  if(customer.customerServiceCalls>=4)signals.push('Repeated support calls');
  if(customer.internationalPlan)signals.push('International plan review');
  return signals;
}
export function selectCustomers(rows,selected,allowed) {
  return rows.filter(row=>allowed.includes(row.department)&&(selected==='All departments'||selected===row.department));
}
export function summariseCustomers(rows) {
  const count=rows.length, labelled=rows.filter(row=>row.churn!==null), churned=labelled.filter(row=>row.churn).length;
  const sum=key=>rows.reduce((total,row)=>total+row[key],0);
  const result={count,labelledCount:labelled.length,churnedCount:churned,observedChurnRate:labelled.length?churned/labelled.length*100:null,averageAccountLength:count?sum('accountLength')/count:0,internationalPlanCount:rows.filter(r=>r.internationalPlan).length,voiceMailPlanCount:rows.filter(r=>r.voiceMailPlan).length,repeatSupportCount:rows.filter(r=>r.customerServiceCalls>=4).length,averageSupportCalls:count?sum('customerServiceCalls')/count:0,totalCharges:0,usage:{}};
  for(const period of ['day','evening','night','international']){result.usage[period]={minutes:sum(period+'Minutes'),calls:sum(period+'Calls'),charges:sum(period+'Charge')};result.totalCharges+=result.usage[period].charges;}
  result.planGroups=['internationalPlan','voiceMailPlan'].map(key=>{
    const group=rows.filter(r=>r[key]),known=group.filter(r=>r.churn!==null);
    return {plan:key,count:group.length,labelledCount:known.length,churnRate:known.length?known.filter(r=>r.churn).length/known.length*100:null};
  });
  return result;
}
export function exportCustomerCSV(rows) {
  const cell=value=>{
    let text=value===null?'':String(value);
    if(/^[=+\-@\t\r]/.test(text))text="'"+text;
    return /[,"\r\n]/.test(text)?'"'+text.replaceAll('"','""')+'"':text;
  };
  const keys=Object.keys(fields);
  return datasetTemplate+',department\n'+rows.map(row=>[...keys.map(key=>row[key]),row.churn,row.department].map(cell).join(',')).join('\n');
}
