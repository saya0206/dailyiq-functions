export default async function handler(req, res) {
  // ✅ CORS headers — allow your Webflow site to call this function
  res.setHeader('Access-Control-Allow-Origin', '*'); // Or 'https://dailyiq-7f8d7e.webflow.io'
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // ✅ Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { slug } = req.body;

  const WEBFLOW_API_TOKEN = process.env.WEBFLOW_API_TOKEN;
  const COLLECTION_ID = '68345a9a1e62007f2897e146'; // ✅ YOUR PUZZLES COLLECTION ID

  try {
    // 1️⃣ Get all items in the collection to find the item by slug
    const listRes = await fetch(`https://api.webflow.com/collections/${COLLECTION_ID}/items?live=true`, {
      headers: {
        Authorization: `Bearer ${WEBFLOW_API_TOKEN}`,
        'accept-version': '1.0.0'
      }
    });

    const listData = await listRes.json();
    const matchingItem = listData.items.find(item => item.slug === slug);

    if (!matchingItem) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const currentLikes = matchingItem['like-count'] || 0;

    // 2️⃣ Update the item with +1 like
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
