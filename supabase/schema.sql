-- Schéma SQL pour la base de données Supabase du Café Namasthé

-- Création de la table profiles
-- Cette table étend auth.users avec les informations spécifiques de l'inscription
CREATE TABLE public.profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  prenom text NOT NULL,
  nom text NOT NULL,
  date_naissance date,
  code_postal text,
  source text,
  newsletter boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Activation de RLS (Row Level Security)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs peuvent lire leur propre profil
CREATE POLICY "Les utilisateurs peuvent lire leur propre profil." ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Les utilisateurs peuvent modifier leur propre profil
CREATE POLICY "Les utilisateurs peuvent modifier leur propre profil." ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Uniquement le système (Service Role) ou des triggers peuvent insérer
-- Mais si on veut que l'API client puisse le faire après un signup, on peut autoriser l'insertion si id = auth.uid()
CREATE POLICY "Les utilisateurs peuvent insérer leur propre profil." ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Fonction pour gérer la mise à jour de 'updated_at'
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour la mise à jour automatique
CREATE TRIGGER on_profiles_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE handle_updated_at();

-- ==========================================
-- POLITIQUES POUR LA TABLE `mytable`
-- ==========================================

-- Activation de RLS
ALTER TABLE public.mytable ENABLE ROW LEVEL SECURITY;

-- Autoriser tout le monde (visiteurs anonymes) à lire les recettes
CREATE POLICY "Les recettes sont publiques." ON public.mytable
  FOR SELECT USING (true);

-- ==========================================
-- POLITIQUES POUR LES TABLES `Breuvage` ET `Nourriture`
-- ==========================================

-- Activation de RLS pour Breuvage
ALTER TABLE public."Breuvage" ENABLE ROW LEVEL SECURITY;

-- Autoriser tout le monde à lire la table Breuvage
CREATE POLICY "Les breuvages sont publics." ON public."Breuvage"
  FOR SELECT USING (true);

-- Activation de RLS pour Nourriture
ALTER TABLE public."Nourriture" ENABLE ROW LEVEL SECURITY;

-- Autoriser tout le monde à lire la table Nourriture
CREATE POLICY "La nourriture est publique." ON public."Nourriture"
  FOR SELECT USING (true);

-- ==========================================
-- FONCTIONS POUR L'INFOLETTRE
-- ==========================================

-- Fonction pour permettre la désinscription via RPC (bypass RLS grâce à SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.unsubscribe_user(user_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.profiles
  SET newsletter = false
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour permettre la désinscription via Webhook Brevo (par email)
CREATE OR REPLACE FUNCTION public.unsubscribe_user_by_email(user_email text)
RETURNS void AS $$
BEGIN
  UPDATE public.profiles
  SET newsletter = false
  WHERE id = (
    SELECT id FROM auth.users WHERE email = user_email LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
