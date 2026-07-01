import { createClient } from '@supabase/supabase-js';
import ws from 'ws';

export async function syncSquareCatalog() {
  const SQR_ENV = process.env.SQUARE_ENVIRONMENT || 'sandbox';
  const SQR_TOKEN = process.env.SQUARE_ACCESS_TOKEN;
  const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SQR_TOKEN || !SUPA_URL || !SUPA_KEY) {
    throw new Error('Missing environment variables');
  }

  const supabase = createClient(SUPA_URL, SUPA_KEY, {
    auth: { persistSession: false },
    realtime: { transport: ws }
  });
  const SQR_BASE_URL = SQR_ENV === 'production' 
    ? 'https://connect.squareup.com' 
    : 'https://connect.squareupsandbox.com';

  // 1. Fetch Square Catalog
  const url = `${SQR_BASE_URL}/v2/catalog/list?types=ITEM,MODIFIER_LIST,CATEGORY,IMAGE`;
  const res = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${SQR_TOKEN}`,
      'Content-Type': 'application/json'
    }
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Square API Error: ${res.status} - ${errorText}`);
  }

  const data = await res.json();
  const objects = data.objects || [];

  // 2. Parse Catalog
  const categories = objects.filter(o => o.type === 'CATEGORY').map(c => ({
    id: c.id,
    name: c.category_data?.name || 'Sans Catégorie'
  }));

  const images = objects.filter(o => o.type === 'IMAGE').reduce((acc, img) => {
    acc[img.id] = img.image_data?.url;
    return acc;
  }, {});

  const modifierLists = objects.filter(o => o.type === 'MODIFIER_LIST').map(ml => ({
    id: ml.id,
    name: ml.modifier_list_data?.name || 'Options',
    min: ml.modifier_list_data?.min_selected_modifiers || 0,
    max: ml.modifier_list_data?.max_selected_modifiers || 999,
    modifiers: (ml.modifier_list_data?.modifiers || []).map(m => {
      const isSoldOut = m.modifier_data?.location_overrides?.some(loc => loc.sold_out === true) || false;
      return {
        id: m.id,
        name: m.modifier_data?.name || 'Inconnu',
        price: m.modifier_data?.price_money?.amount ? m.modifier_data.price_money.amount / 100 : 0,
        is_sold_out: isSoldOut
      };
    })
  }));

  const items = objects.filter(o => o.type === 'ITEM').map(item => {
    const variations = item.item_data?.variations || [];
    const basePrice = variations[0]?.item_variation_data?.price_money?.amount ? variations[0].item_variation_data.price_money.amount / 100 : 0;
    
    const itemModifiers = item.item_data?.modifier_list_info || [];
    const attachedModifierLists = itemModifiers.map(info => info.modifier_list_id);
    const catId = item.item_data?.category_id || (item.item_data?.categories && item.item_data.categories.length > 0 ? item.item_data.categories[0].id : null);
    const imgId = item.item_data?.image_ids?.[0];

    const isItemSoldOut = variations.length > 0 && variations.every(v => v.item_variation_data?.location_overrides?.some(loc => loc.sold_out === true));

    return {
      id: item.id,
      name: item.item_data?.name || 'Inconnu',
      description: item.item_data?.description || '',
      price: basePrice,
      category_id: catId,
      image_url: imgId ? images[imgId] : null,
      modifier_lists: attachedModifierLists,
      is_sold_out: isItemSoldOut,
      variations: variations.map(v => {
        const isSoldOut = v.item_variation_data?.location_overrides?.some(loc => loc.sold_out === true) || false;
        return {
          id: v.id,
          name: v.item_variation_data?.name || 'Standard',
          price: v.item_variation_data?.price_money?.amount ? v.item_variation_data.price_money.amount / 100 : basePrice,
          is_sold_out: isSoldOut
        };
      })
    };
  });

  const catalogData = {
    updated_at: new Date().toISOString(),
    categories,
    modifierLists,
    items
  };

  // 3. Save to Supabase `square_cache`
  await supabase.from('square_cache').delete().neq('id', 0); 
  const { error: dbError } = await supabase.from('square_cache').insert([{ catalog_data: catalogData }]);

  if (dbError) {
    throw new Error(`Supabase Error: ${dbError.message}`);
  }

  return catalogData;
}
