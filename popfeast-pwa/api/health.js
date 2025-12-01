export default async function handler(req, res){
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=60');
  return res.status(200).json({ status: 'ok' });
}
