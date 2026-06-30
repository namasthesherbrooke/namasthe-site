const creation = {
  nom_breuvage: "Limonade a coco",
  base: "Lotus",
  saveurs: "Limonade rose, Limonade, Lotus crémeux coco"
};

const getBasePrice = (baseName) => {
  if (!baseName) return 0;
  const b = baseName.toLowerCase();
  if (b.includes('smoothie bol')) return 9.75;
  if (b.includes('fruithé') || b.includes('fruithe')) return 6.25;
  if (b.includes('lotus')) return 4.00;
  if (b.includes('rafraichi')) return 2.75;
  if (b.includes('bubble')) return 2.75;
  if (b.includes('limonade')) return 2.50;
  if (b.includes('matcha')) return 2.00;
  if (b.includes('méga') || b.includes('mega')) return 2.00;
  if (b.includes('mindblow')) return 1.00;
  if (b.includes('latté') || b.includes('latte')) return 1.00;
  if (b.includes('simplicithé') || b.includes('simplicithe')) return 1.00;
  return 0; // Par défaut
};

const basePrice = getBasePrice(creation.base);
console.log("basePrice:", basePrice);

const saveursStr = (creation.saveurs || '').toLowerCase();
const init = {};
const extraLists = [
  {
    name: "Extras",
    modifiers: [
      { id: "mod1", name: "Lotus crémeux coconut", price: 2.25 }
    ]
  }
];

extraLists.forEach(list => {
  list.modifiers.forEach(mod => {
    const modName = mod.name.toLowerCase();
    if (saveursStr.includes(modName)) {
      init[mod.id] = true;
    } else if (modName === 'lotus crémeux coconut' && saveursStr.includes('lotus crémeux coco')) {
      init[mod.id] = true;
    }
  });
});
console.log("selectedExtras:", init);

let total = 4.25 + basePrice; // 16 oz
extraLists.forEach(list => {
  list.modifiers.forEach(mod => {
    if (init[mod.id]) {
      total += (mod.price || 0);
    }
  });
});
console.log("total:", total);
