export const sampleCustomers=Array.from({length:36},(_,i)=>({
  id:`DEMO-${String(i+1).padStart(4,'0')}`,department:i%6===0?'B2B':'B2C',
  state:['Western Area','Bo','Kenema','Makeni'][i%4],areaCode:['DEMO-WA','DEMO-BO','DEMO-KE','DEMO-MA'][i%4],accountLength:25+(i*17)%240,
  internationalPlan:i%4===0,voiceMailPlan:i%3===0,
  dayMinutes:Math.round((80+(i*13)%240)*10)/10,dayCalls:40+i*3,dayCharge:Math.round((80+(i*13)%240)*17)/100,
  eveningMinutes:100+(i*7)%190,eveningCalls:30+i*2,eveningCharge:Math.round((100+(i*7)%190)*8.5)/100,
  nightMinutes:90+(i*11)%200,nightCalls:25+i*2,nightCharge:Math.round((90+(i*11)%200)*4.5)/100,
  internationalMinutes:2+(i*3)%22,internationalCalls:1+i%8,internationalCharge:Math.round((2+(i*3)%22)*27)/100,
  customerServiceCalls:i%7,churn:i%5===0||i%11===0,
}));
