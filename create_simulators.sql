-- Table pour sauvegarder les patrons de revenus (Simulateur persistant)
CREATE TABLE IF NOT EXISTS finances_income_patterns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    entity TEXT NOT NULL,
    category_id BIGINT REFERENCES finances_categories(id),
    description TEXT,
    monday_amount NUMERIC DEFAULT 0,
    tuesday_amount NUMERIC DEFAULT 0,
    wednesday_amount NUMERIC DEFAULT 0,
    thursday_amount NUMERIC DEFAULT 0,
    friday_amount NUMERIC DEFAULT 0,
    saturday_amount NUMERIC DEFAULT 0,
    sunday_amount NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table pour sauvegarder les règles de répartition (ex: 15% pour les taxes)
CREATE TABLE IF NOT EXISTS finances_distribution_rules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    source_entity TEXT NOT NULL,
    target_entity TEXT NOT NULL,
    percentage NUMERIC NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Sécurité RLS pour permettre à l'API d'y accéder
ALTER TABLE finances_income_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE finances_distribution_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all for finances_income_patterns" ON finances_income_patterns FOR ALL USING (true);
CREATE POLICY "Enable all for finances_distribution_rules" ON finances_distribution_rules FOR ALL USING (true);
