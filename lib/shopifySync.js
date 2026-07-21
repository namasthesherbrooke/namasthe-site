/**
 * shopifySync.js
 * 
 * Gestion de la communication avec l'API Storefront de Shopify.
 * Remplace l'ancienne logique Square.
 */

const domain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN || 'le-cafe-namasthe.myshopify.com';
const storefrontAccessToken = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN || '2ec30f8410fb9b3b154b3298affc306e';

async function shopifyFetch({ query, variables = {} }) {
  const endpoint = `https://${domain}/api/2024-04/graphql.json`;

  try {
    const result = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': storefrontAccessToken
      },
      body: JSON.stringify({ query, variables })
    });

    const json = await result.json();
    if (json.errors) {
      console.error('Shopify API errors:', json.errors);
      throw new Error('Failed to fetch Shopify API');
    }

    return json.data;
  } catch (error) {
    console.error('Error fetching Shopify:', error);
    throw error;
  }
}

// Requête pour obtenir tous les produits et leurs variantes
export async function getShopifyProducts() {
  const query = `
    query getProducts {
      products(first: 100) {
        edges {
          node {
            id
            title
            handle
            description
            productType
            images(first: 1) {
              edges {
                node {
                  url
                  altText
                }
              }
            }
            priceRange {
              minVariantPrice {
                amount
                currencyCode
              }
            }
            variants(first: 50) {
              edges {
                node {
                  id
                  title
                  price {
                    amount
                    currencyCode
                  }
                  availableForSale
                  selectedOptions {
                    name
                    value
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

  const response = await shopifyFetch({ query });
  // TODO: Formater la réponse pour qu'elle s'intègre bien avec le frontend actuel
  return response?.products?.edges || [];
}

// Requête pour créer un panier (Checkout)
export async function createShopifyCheckout(lineItems) {
  const query = `
    mutation createCart($cartInput: CartInput) {
      cartCreate(input: $cartInput) {
        cart {
          id
          checkoutUrl
          lines(first: 10) {
            edges {
              node {
                id
                attributes {
                  key
                  value
                }
              }
            }
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  // lineItems doit être un tableau d'objets: { merchandiseId: "variant_id", quantity: 1, attributes: [{key, value}] }
  const variables = {
    cartInput: {
      lines: lineItems
    }
  };

  const response = await shopifyFetch({ query, variables });
  return response?.cartCreate?.cart;
}
