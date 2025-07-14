export default async function handler(req, res) {
  // ✅ Always set these headers first
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // ✅ Handle the preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // ✅ Allow only POST after OPTIONS
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ✅ Real Like logic
  const { slug } = req.body;

  const WEBFLOW_API_TOKEN = process.env.WEBFLOW_API_TOKEN;
  const COLLECTION_ID = '68345a9a1e62007f2897e146';

  try {
    // 1) Get all items to find by slug
    const listRes = await fetch(`https://api.webflow.com/collections/${COLLECTION_ID}/items?live=true`, {
      headers: {
        Authorization: `Bearer ${WEBFLOW_API_TOKEN}`,
        'accept-version': '1.0.0'
      }
    });

    const listData = await listRes.json();
    console.log('List Items Response:', listData); // ✅ NEW LINE!
    const matchingItem = listData.items.find(item => item.slug === slug);

    if (!matchingItem) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const currentLikes = matchingItem['like-count'] || 0;

    // 2) Update like count
    const updatedFields = {
      fields: {
        _archived: false,
        _draft: false,
        name: matchingItem.name,
        slug: matchingItem.slug,
        'like-count': currentLikes + 1
      }
    };

    const updateRes = await fetch(`https://api.webflow.com/collections/${COLLECTION_ID}/items/${matchingItem._id}?live=true`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${WEBFLOW_API_TOKEN}`,
        'accept-version': '1.0.0',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updatedFields)
    });

    if (updateRes.ok) {
      return res.status(200).json({ message: '✅ Like updated!' });
    } else {
      return res.status(500).json({ error: 'Failed to update CMS item.' });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}
