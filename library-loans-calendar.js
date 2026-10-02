/* RFC 5545 calendar export. Floating times use the importing calendar's local timezone. */
(function(root){
  function escapeText(value){return String(value||'').replace(/\\/g,'\\\\').replace(/\r?\n/g,'\\n').replace(/;/g,'\\;').replace(/,/g,'\\,');}
  function fold(line){const chunks=[];let part='',bytes=0;for(const char of line){const size=new TextEncoder().encode(char).length;if(bytes+size>75){chunks.push(part);part=' '+char;bytes=1+size;}else{part+=char;bytes+=size;}}chunks.push(part);return chunks.join('\r\n');}
  function calendar(record,now=new Date()){
    if(!record.reminder || !record.reminder.enabled)throw new Error('Reminder disabled');
    const {date,time}=record.reminder;
    if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!/^\d{2}:\d{2}$/.test(time))throw new Error('Invalid reminder date');
    const start=date.replace(/-/g,'')+'T'+time.replace(':','')+'00';
    const stamp=now.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');
    const description='Pensez à vos livres empruntés en bibliothèque.'+(record.returnDate?' Date de retour : '+record.returnDate+'.':'')+' Rappel chaque semaine. Pour arrêter les alertes, supprimez toute la série dans votre calendrier.';
    return ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Eclat//Emprunts//FR','CALSCALE:GREGORIAN','BEGIN:VEVENT','UID:'+escapeText(record.id)+'@emprunts.eclat','DTSTAMP:'+stamp,'DTSTART:'+start,'DURATION:PT15M','RRULE:FREQ=WEEKLY','SUMMARY:Emprunt en bibliothèque — rappel','DESCRIPTION:'+escapeText(description),'BEGIN:VALARM','ACTION:DISPLAY','TRIGGER:PT0M','DESCRIPTION:'+escapeText('Pensez à vos livres empruntés en bibliothèque.'),'END:VALARM','END:VEVENT','END:VCALENDAR'].map(fold).join('\r\n')+'\r\n';
  }
  const api={calendar};if(typeof module==='object'&&module.exports)module.exports=api;else root.EclatLoanCalendar=api;
})(typeof window==='undefined'?{}:window);
