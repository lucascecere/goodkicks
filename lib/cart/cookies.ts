// Deliberately still named for Good Kicks, even though Townies is the store now.
//
// This is the key a shopper's live cart is stored under. Renaming it to
// something Townies-flavoured would orphan every cart currently in existence:
// the browser would look up the new name, find nothing, and quietly empty the
// basket of anyone mid-purchase. That is a real cost paid by customers to buy
// nothing but tidier-looking internals, which nobody sees.
//
// The same reasoning covers the 'goodkicks_cart' localStorage key in
// lib/cart/cart-context.tsx. If either is ever renamed, do it with a migration
// that reads the old key first and writes the new one — never a straight swap.
export const CART_COOKIE = 'goodkicks_cart_id';
