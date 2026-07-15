export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: '/admin/',
    },
    sitemap: 'https://cafenamasthesherbrooke.ca/sitemap.xml',
  };
}
