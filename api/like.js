export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { itemId } = req.body;

  const WEBFLOW_API_TOKEN = process.env.WEBFLOW_API_TOKEN;
  const COLLECTION_ID = '68345a9a1e62007f2897e146';

  // 1. Get the item details
  const itemRes = await fetch(`https://api.webflow.com/collections/${COLLECTION_ID}/items/${itemId}?live=true`, {
    headers: {
      Authorization: `Bearer ${WEBFLOW_API_TOKEN}`,
      'accept-version': '1.0.0'
    }
  });

  const itemData = await itemRes.json();
  const currentLikes = itemData.item['like-count'] || 0;

  // 2. Update the item
  const updatedFields = {
    fields: {
      _archived: false,
      _draft: false,
      name: itemData.item.name,
      slug: itemData.item.slug,
      'like-count': currentLikes + 1
    }
  };

  const updateRes = await fetch(`https://api.webflow.com/collections/${COLLECTION_ID}/items/${itemId}?live=true`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${WEBFLOW_API_TOKEN}`,
      'accept-version': '1.0.0',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updatedFields)
  });

  if (updateRes.ok) {
    res.status(200).json({ message: 'Like updated!' });
  } else {
    res.status(500).json({ error: 'Failed to update CMS item.' });
  }
}
