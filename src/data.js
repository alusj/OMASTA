export const departments = ['B2C', 'B2B', 'Orange Money', 'Customer Service', 'Retention / CRM', 'Sales', 'Network', 'Finance', 'Executive Management'];
export const business = [
  {name:'B2C', label:'Consumer business', customers:842600, risk:136501, rate:16.2, revenue:32.8, color:'#ff7900', trend:'+2.8'},
  {name:'B2B', label:'Enterprise business', customers:12840, risk:822, rate:6.4, revenue:18.6, color:'#367cf6', trend:'−0.6'},
  {name:'Orange Money', label:'Mobile financial services', customers:624800, risk:73726, rate:11.8, revenue:23.2, color:'#17b26a', trend:'+1.9'},
];
export const initialUsers = [
  {id:1, name:'Mariama Kamara', initials:'MK', email:'mariama@example.com', role:'Super admin', departments:[...departments]},
  {id:2, name:'Ibrahim Sesay', initials:'IS', email:'ibrahim@example.com', role:'Department admin', departments:['B2C', 'Sales']},
  {id:3, name:'Fatmata Conteh', initials:'FC', email:'fatmata@example.com', role:'Department admin', departments:['Orange Money']},
  {id:4, name:'Mohamed Bangura', initials:'MB', email:'mohamed@example.com', role:'Department admin', departments:['B2B']},
];
export const drivers = [ ['Network experience',24.8,'#ff7900'], ['Price & value',18.7,'#f4b740'], ['Low engagement',15.2,'#8b5cf6'], ['Customer service',12.6,'#367cf6'], ['Bundle mismatch',10.4,'#17b26a'] ];
