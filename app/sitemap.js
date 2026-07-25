export default function sitemap() {
  const baseUrl = 'https://cafenamasthesherbrooke.ca';

  const routes = [
    '',
    '/menu',
    '/boutique',
    '/promotions',
    '/evenements',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: route === '' ? 1 : 0.8,
  }));

  return routes;
}
