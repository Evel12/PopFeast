import { applyCors } from './_cors.js';

export default async function handler(req, res){
  if (applyCors(req, res)) return;
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=60');
  return res.status(200).json({ status: 'ok' });
}
