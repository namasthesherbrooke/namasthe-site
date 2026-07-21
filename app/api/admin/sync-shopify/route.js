import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getShopifyProducts } from '@/lib/shopifySync';

export const dynamic = 'force-dynamic';

const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(req) {
  try {
    let isAdminAuthenticated = false;
    const authHeader = req.headers.get('Authorization');
    const supabase = createClient(SUPA_URL, SUPA_KEY);
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const { data: { user } } = await supabase.auth.getUser(token);
      if (user && user.email === 'namasthesherbrooke@gmail.com') {
        isAdminAuthenticated = true;
      }
    }

    if (!isAdminAuthenticated) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    // 1. Fetch from Shopify
    const shopifyEdges = await getShopifyProducts();

    // 2. Fetch old cache to preserve images
    const { data: oldCache } = await supabase
      .from('square_cache')
      .select('catalog_data')
      .order('id', { ascending: false })
      .limit(1);

    const oldItems = oldCache?.[0]?.catalog_data?.items || [];
    const imageMap = {};
    const modifierMap = {};
    oldItems.forEach(oldItem => {
      if (oldItem.name) {
        const nameKey = oldItem.name.toLowerCase().trim();
        if (oldItem.image_url) imageMap[nameKey] = oldItem.image_url;
        if (oldItem.modifier_lists) modifierMap[nameKey] = oldItem.modifier_lists;
      }
    });

    // 3. Map Shopify to our old frontend format
    // Extract unique categories (Product Types)
    const categorySet = new Set();
    shopifyEdges.forEach(({ node }) => {
      if (node.productType) categorySet.add(node.productType);
    });
    
    const categories = Array.from(categorySet).map((name, index) => ({
      id: `cat_${index}`,
      name: name
    }));

    const modifierLists = oldCache?.[0]?.catalog_data?.modifierLists || [];

    const items = shopifyEdges.map(({ node }) => {
      const catMatch = categories.find(c => c.name === node.productType);
      
      const imageUrl = (node.images && node.images.edges.length > 0) 
        ? node.images.edges[0].node.url 
        : imageMap[node.title.toLowerCase().trim()] || null; // Fallback to old image!

      const variations = node.variants.edges.map(vNode => {
        return {
          id: vNode.node.id, // EXACTLY the Shopify variant ID (gid://...)
          name: vNode.node.title,
          price: parseFloat(vNode.node.price.amount),
          is_sold_out: !vNode.node.availableForSale
        };
      });

      const isSoldOut = variations.every(v => v.is_sold_out);

      return {
        id: node.id,
        name: node.title,
        description: node.description,
        price: variations.length > 0 ? variations[0].price : 0,
        category_id: catMatch ? catMatch.id : null,
        image_url: imageUrl,
        modifier_lists: modifierMap[node.title.toLowerCase().trim()] || [], // Restore old modifier lists
        is_sold_out: isSoldOut,
        variations: variations
      };
    });

    const catalogData = {
      updated_at: new Date().toISOString(),
      categories,
      modifierLists,
      items
    };

    // 4. Save to Supabase
    await supabase.from('square_cache').delete().neq('id', 0); 
    const { error: dbError } = await supabase.from('square_cache').insert([{ catalog_data: catalogData }]);

    if (dbError) throw new Error(dbError.message);

    return NextResponse.json({ success: true, message: "Synchronisé avec Shopify avec succès !", count: items.length });
  } catch (error) {
    console.error("Erreur sync Shopify:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
