export default async function handler(req, res) {
  // ✅ CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { slug } = req.body;

  const WEBFLOW_API_TOKEN = process.env.WEBFLOW_API_TOKEN;
  const COLLECTION_ID = '68345a9a1e62007f2897e146'; // ✅ Same collection ID

  try {
    // ✅ 1) GET ALL ITEMS
    const listRes = await fetch(`https://api.webflow.com/v2/collections/${COLLECTION_ID}/items`, {
      headers: {
        Authorization: `Bearer ${WEBFLOW_API_TOKEN}`,
        accept: 'application/json'
      }
    });

    const listData = await listRes.json();
    console.log('List Items Status:', listRes.status);
    console.log('List Items JSON:', JSON.stringify(listData, null, 2));

    // ✅ 2) Find by slug INSIDE fieldData
    const matchingItem = listData.items.find(item => item.fieldData.slug === slug);

    if (!matchingItem) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // ✅ 3) Get current dislikes
    const currentDislikes = matchingItem.fieldData.dislikes || 0;

    // ✅ 4) Prepare PATCH body
    const updatedFields = {
      isArchived: false,
      isDraft: false,
      fieldData: {
        name: matchingItem.fieldData.name,
        slug: matchingItem.fieldData.slug,
        dislikes: currentDislikes + 1
      }
    };

    // ✅ 5) PATCH
    const updateRes = await fetch(`https://api.webflow.com/v2/collections/${COLLECTION_ID}/items/${matchingItem.id}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${WEBFLOW_API_TOKEN}`,
        accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updatedFields)
    });

    if (updateRes.ok) {
      return res.status(200).json({ message: '✅ Dislike updated!' });
    } else {
      console.error(await updateRes.text());
      return res.status(500).json({ error: 'Failed to update CMS item.' });
    }

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}
