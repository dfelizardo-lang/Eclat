const test=require('node:test');const assert=require('node:assert/strict');const {calendar}=require('./library-loans-calendar');
test('weekly alarm starts at return date, keeps stable UID and has no end',()=>{const record={id:'stable-id',returnDate:'2026-11-04',reminder:{enabled:true,date:'2026-11-04',time:'09:00'}};const text=calendar(record,new Date('2026-10-02T12:00:00Z'));assert.match(text,/DTSTART:20261104T090000\r\n/);assert.match(text,/RRULE:FREQ=WEEKLY\r\n/);assert.match(text,/UID:stable-id@emprunts.eclat\r\n/);assert.match(text,/BEGIN:VALARM\r\nACTION:DISPLAY\r\nTRIGGER:PT0M/);assert.doesNotMatch(text,/UNTIL=|COUNT=/);for(const line of text.split('\r\n'))assert.ok(Buffer.byteLength(line)<=75);assert.throws(()=>calendar({...record,reminder:{enabled:false}}));});

const {googleCalendarUrl}=require('./library-loans-calendar');
test('Google editor receives weekly recurrence, local time zone and midnight rollover',()=>{
 const record={id:'loan&é',returnDate:'2026-12-31',reminder:{enabled:true,date:'2026-12-31',time:'23:55'}};
 const login=new URL(googleCalendarUrl(record,'Europe/Paris'));assert.equal(login.origin,'https://accounts.google.com');
 const url=new URL(login.searchParams.get('continue'));
 assert.equal(url.origin,'https://calendar.google.com');assert.equal(url.searchParams.get('action'),'TEMPLATE');
 assert.equal(url.searchParams.get('dates'),'20261231T235500/20270101T001000');assert.equal(url.searchParams.get('ctz'),'Europe/Paris');assert.equal(url.searchParams.get('recur'),'RRULE:FREQ=WEEKLY');assert.ok(url.searchParams.get('details').includes(record.id));
 assert.throws(()=>googleCalendarUrl({...record,reminder:{...record.reminder,date:'2026-02-30'}}));assert.throws(()=>googleCalendarUrl({...record,reminder:{enabled:false}}));
});
