// One source of truth for app icons. Matching ignores case, spaces and punctuation.
const RAW:Record<string,string>={
"All Video Downloader X":"https://lh3.googleusercontent.com/drJQsOnb3KqJhJCs-CWjNfS6ajomyaNSRj1rkLuUJdmUq8FsMix4Enc0MBHb6veYdmqM2NJDGg",
"Phone Cleaner Junk Remover":"https://lh3.googleusercontent.com/m36tGO36s9u1IsS9RmhdNj24BQpBxsTcWFZdV1su174oNmJ5_3YGAoywi7wMFZ99FVGhddEwTw",
"Phone Cleaner - Junk Remover":"https://lh3.googleusercontent.com/m36tGO36s9u1IsS9RmhdNj24BQpBxsTcWFZdV1su174oNmJ5_3YGAoywi7wMFZ99FVGhddEwTw",
"Antivirus - Clean Virus, Junk":"https://lh3.googleusercontent.com/dfkVj-KpDvNMM3XJCF7zn7hWEn6gpQDcf6zEe21cjCrxEIWRAho97Ah2RX7ot5eYhOxYreH1oQ",
"Antivirus Cleaner Pro":"https://lh3.googleusercontent.com/dfkVj-KpDvNMM3XJCF7zn7hWEn6gpQDcf6zEe21cjCrxEIWRAho97Ah2RX7ot5eYhOxYreH1oQ",
"Phone - Junk Cleaner":"https://lh3.googleusercontent.com/4-2u2EQbcRAB9xhTFb7ij3SPQN2M5FnH7FHn6E5o5wcaMM82uBezVSZYlWI8nhnINTmz5IsKPg",
"GPS Map Location: Route Finder":"https://lh3.googleusercontent.com/QniK9fEnkQYFAtVWFMr6Ac1_yGo56wxyZ5cQ3jhjWe-5V62-Tc8sl9RYXchskZuXXjFZwOlw",
"GPS Maps & 3D Navigation":"https://lh3.googleusercontent.com/8wIYbFKhuCBcC6G0Xsd-QrLOMlT6RDDs1FzevOiXkC8k_v_ceXdP780whZUTlQSNr4kooL-_VBY",
"GPS Navigation Map Route Find":"https://lh3.googleusercontent.com/H6-KSAi9SjudiEwT5HplOJ0dauusCC3CzR5u4gAfwaNqnZe_iDbOJBE8BdfXFThku188Q1F4",
"GPS Navigation: Satellite View":"https://lh3.googleusercontent.com/6yVUa1FnofKnlis40fQ9LqrrmCdLnTR2SsfY7w8N-rj-DinRjVRASFFE6XT3aA1-O5vo2-eNBw"};
const norm=(s:string)=>(s||"").toLowerCase().replace(/[^a-z0-9]/g,"");
const MAP:Record<string,string>=Object.fromEntries(Object.entries(RAW).map(([k,v])=>[norm(k),v]));
export function appIconUrl(name:string,size=64){
  const n=norm(name);let u=MAP[n];
  if(!u){const k=Object.keys(MAP).filter(k=>n&&(n.includes(k)||k.includes(n))).sort((a,b)=>b.length-a.length)[0];u=k?MAP[k]:""}
  return u?u+"=s"+size:null}
