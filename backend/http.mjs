import {timingSafeEqual} from 'node:crypto';
export function secretMatches(actual,expected){if(typeof actual!=='string'||!expected)return false;const a=Buffer.from(actual),b=Buffer.from(expected);return a.length===b.length&&timingSafeEqual(a,b);}
export function json(res,status,body){res.setHeader('Cache-Control','no-store');res.status(status).json(body);}
export function body(req){const b=typeof req.body==='string'?JSON.parse(req.body):req.body;if(!b||Buffer.byteLength(JSON.stringify(b))>250000)throw Error('Invalid body');return b;}
