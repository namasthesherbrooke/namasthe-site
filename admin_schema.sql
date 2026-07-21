-- ==========================================
-- SCHÉMA POUR LE PORTAIL ADMIN (COÛTS & NUTRITION)
-- ==========================================

-- 1. Table des Ingrédients
CREATE TABLE IF NOT EXISTS public.ingredients (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    supplier TEXT,
    cost_per_unit NUMERIC(10,2) NOT NULL DEFAULT 0,
    unit TEXT NOT NULL CHECK (unit IN ('ml', 'g', 'piece')),
    calories_per_100 NUMERIC(10,2) DEFAULT 0,
    protein_per_100 NUMERIC(10,2) DEFAULT 0,
    carbs_per_100 NUMERIC(10,2) DEFAULT 0,
    fat_per_100 NUMERIC(10,2) DEFAULT 0,
    sugar_per_100 NUMERIC(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Table des Recettes (Costing)
CREATE TABLE IF NOT EXISTS public.admin_recipes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT,
    selling_price NUMERIC(10,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Table de liaison Recettes <-> Ingrédients
CREATE TABLE IF NOT EXISTS public.admin_recipe_ingredients (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    recipe_id UUID REFERENCES public.admin_recipes(id) ON DELETE CASCADE,
    ingredient_id UUID REFERENCES public.ingredients(id) ON DELETE CASCADE,
    quantity NUMERIC(10,2) NOT NULL, -- Quantité dans l'unité de l'ingrédient (ex: 200 pour 200ml)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ajout des politiques RLS (Row Level Security) - Optionnel mais recommandé
ALTER TABLE public.ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_recipe_ingredients ENABLE ROW LEVEL SECURITY;

-- Autoriser un accès complet (car c'est un portail admin, on gèrera la sécurité au niveau de Next.js)
CREATE POLICY "Allow full access to ingredients" ON public.ingredients FOR ALL USING (true);
CREATE POLICY "Allow full access to admin_recipes" ON public.admin_recipes FOR ALL USING (true);
CREATE POLICY "Allow full access to admin_recipe_ingredients" ON public.admin_recipe_ingredients FOR ALL USING (true);
