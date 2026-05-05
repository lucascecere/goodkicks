const SHOPIFY_ADMIN_URL = `https://${process.env.SHOPIFY_STORE_DOMAIN}/admin/api/2024-10/graphql.json`;

const CREATE_DISCOUNT_MUTATION = `
  mutation discountCodeBasicCreate($basicCodeDiscount: DiscountCodeBasicInput!) {
    discountCodeBasicCreate(basicCodeDiscount: $basicCodeDiscount) {
      codeDiscountNode {
        id
        codeDiscount {
          ... on DiscountCodeBasic {
            codes(first: 1) {
              nodes {
                code
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

export async function createAmbassadorDiscountCode({
  instagramHandle,
  tierPct,
}: {
  instagramHandle: string;
  tierPct: number;
}): Promise<string> {
  // e.g. @miltonhigh → MILTONHIGH15
  const slug = instagramHandle.replace(/^@/, '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  const code = `${slug}${tierPct}`;

  const res = await fetch(SHOPIFY_ADMIN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': process.env.SHOPIFY_ADMIN_API_TOKEN ?? '',
    },
    body: JSON.stringify({
      query: CREATE_DISCOUNT_MUTATION,
      variables: {
        basicCodeDiscount: {
          title: `Ambassador — ${instagramHandle}`,
          code,
          startsAt: new Date().toISOString(),
          customerSelection: { all: true },
          customerGets: {
            value: { percentage: tierPct / 100 },
            items: { all: true },
          },
          usageLimit: null,
          appliesOncePerCustomer: false,
        },
      },
    }),
  });

  const json = await res.json() as {
    data?: {
      discountCodeBasicCreate?: {
        codeDiscountNode?: {
          codeDiscount?: {
            codes?: { nodes?: { code: string }[] };
          };
        };
        userErrors?: { field: string[]; message: string }[];
      };
    };
  };

  const errors = json.data?.discountCodeBasicCreate?.userErrors ?? [];
  if (errors.length) {
    throw new Error(`Shopify discount error: ${errors.map((e) => e.message).join(', ')}`);
  }

  const created =
    json.data?.discountCodeBasicCreate?.codeDiscountNode?.codeDiscount?.codes?.nodes?.[0]?.code;

  return created ?? code;
}
