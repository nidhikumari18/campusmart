
import { create } from "zustand";
import { persist } from "zustand/middleware";

// ========================================
// API CONFIGURATION
// ========================================

export const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";

// ========================================
// PRODUCT HELPERS
// ========================================

export function productImage(product) {
  const image = product?.imageUrls?.[0];

  if (!image || typeof image !== "string") {
    return null;
  }

  if (
    image.startsWith("http://") ||
    image.startsWith("https://")
  ) {
    return image;
  }

  return `${API_URL}${
    image.startsWith("/") ? "" : "/"
  }${image}`;
}

export function normalizeProduct(product) {
  const seller = product.seller;

  return {
    ...product,

    id: String(product._id || product.id),

    sellerId:
      seller && typeof seller === "object"
        ? String(seller._id || seller.id || "")
        : String(product.sellerId || seller || ""),

    seller:
      seller && typeof seller === "object"
        ? seller.name || "Student"
        : seller || "Student",

    price: Number(product.price),

    original:
      product.original === null ||
      product.original === undefined ||
      product.original === ""
        ? null
        : Number(product.original),

    // Older listings default to Available
    status: product.status || "Available",
  };
}

function createProductFormData(form, images = []) {
  const data = new FormData();

  for (const [key, value] of Object.entries(form)) {
    if (value === undefined || value === null) {
      if (key === "original") {
        data.append("original", "");
      }

      continue;
    }

    data.append(key, String(value));
  }

  images.forEach((file) => {
    data.append("images", file);
  });

  return data;
}

async function readApiResponse(response) {
  const result = await response
    .json()
    .catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      result.message || "Something went wrong."
    );
  }

  return result;
}

// ========================================
// AVAILABILITY HELPERS
// ========================================

export const PRODUCT_STATUSES = [
  "Available",
  "Reserved",
  "Sold",
];

export function isProductAvailable(product) {
  return (
    product &&
    (product.status || "Available") === "Available"
  );
}

// ========================================
// ZUSTAND STORE
// ========================================

export const useShop = create(
  persist(
    (set, get) => ({
        products: [],
      wishlist: [],
      cart: [],
      orders: [],

      theme: "light",
      user: null,

      productsLoading: false,
      productsError: "",

      // ==================================
      // THEME
      // ==================================

      toggleTheme: () =>
        set((state) => ({
          theme:
            state.theme === "light"
              ? "dark"
              : "light",
        })),

      // ==================================
      // WISHLIST
      // ==================================

      toggleWishlist: (id) =>
        set((state) => {
          const productId = String(id);

          return {
            wishlist: state.wishlist.includes(productId)
              ? state.wishlist.filter(
                  (item) => item !== productId
                )
              : [...state.wishlist, productId],
          };
        }),

      // ==================================
      // CART
      // ==================================

      addCart: (id) => {
        const productId = String(id);

        const product = get().products.find(
          (item) => item.id === productId
        );

        if (!product) {
          return false;
        }

        if (!isProductAvailable(product)) {
          return false;
        }

        set((state) => ({
          cart: state.cart.includes(productId)
            ? state.cart
            : [...state.cart, productId],
        }));

        return true;
      },

      removeCart: (id) =>
        set((state) => ({
          cart: state.cart.filter(
            (item) => item !== String(id)
          ),
        })),

      // ==================================
      // LEGACY USER STATE
      // ==================================

      login: (user) => set({ user }),

      logout: () => set({ user: null }),

      // ==================================
      // LOAD PRODUCTS
      // ==================================

      loadProducts: async () => {
        set({
          productsLoading: true,
          productsError: "",
        });

        try {
          const response = await fetch(
            `${API_URL}/api/products`,
            {
              credentials: "include",
            }
          );

          const result = await readApiResponse(
            response
          );

          

          const allProducts = (
            result.products || []
          ).map(normalizeProduct);

          set((state) => ({
            products: allProducts,

            cart: state.cart.filter((id) => {
              const product = allProducts.find(
                (item) => item.id === id
              );

              return isProductAvailable(product);
            }),

            productsLoading: false,
            productsError: "",
          }));

          return allProducts;
        } catch (error) {
          set({
            productsLoading: false,
            productsError: error.message,
          });

          throw error;
        }
      },

      // ==================================
      // CREATE PRODUCT
      // ==================================

      addProduct: async (form, images = []) => {
        const data = createProductFormData(
          form,
          images
        );

        const response = await fetch(
          `${API_URL}/api/products`,
          {
            method: "POST",
            credentials: "include",
            body: data,
          }
        );

        const result = await readApiResponse(
          response
        );

        const product = normalizeProduct(
          result.product
        );

        set((state) => ({
          products: [
            product,
            ...state.products.filter(
              (item) => item.id !== product.id
            ),
          ],
        }));

        return product;
      },

      // ==================================
      // EDIT PRODUCT
      // ==================================

      updateProduct: async (
        id,
        form,
        images = []
      ) => {
        const productId = String(id);

        const data = createProductFormData(
          form,
          images
        );

        const response = await fetch(
          `${API_URL}/api/products/${productId}`,
          {
            method: "PUT",
            credentials: "include",
            body: data,
          }
        );

        const result = await readApiResponse(
          response
        );

        const updatedProduct = normalizeProduct(
          result.product
        );

        set((state) => ({
          products: state.products.map(
            (product) =>
              product.id === productId
                ? updatedProduct
                : product
          ),
        }));

        return updatedProduct;
      },

      // ==================================
      // NEW: UPDATE PRODUCT STATUS
      // ==================================

      updateProductStatus: async (
        id,
        status
      ) => {
        const productId = String(id);

        if (!PRODUCT_STATUSES.includes(status)) {
          throw new Error(
            "Invalid product status."
          );
        }

        const response = await fetch(
          `${API_URL}/api/products/${productId}/status`,
          {
            method: "PATCH",
            credentials: "include",

            headers: {
              "Content-Type": "application/json",
            },

            body: JSON.stringify({
              status,
            }),
          }
        );

        const result = await readApiResponse(
          response
        );

        const updatedProduct = normalizeProduct(
          result.product
        );

        set((state) => ({
          products: state.products.map(
            (product) =>
              product.id === productId
                ? updatedProduct
                : product
          ),

          cart:
            status === "Available"
              ? state.cart
              : state.cart.filter(
                  (item) => item !== productId
                ),
        }));

        return updatedProduct;
      },

      // ==================================
      // DELETE PRODUCT
      // ==================================

      deleteProduct: async (id) => {
        const productId = String(id);

        const response = await fetch(
          `${API_URL}/api/products/${productId}`,
          {
            method: "DELETE",
            credentials: "include",
          }
        );

        await readApiResponse(response);

        set((state) => ({
          products: state.products.filter(
            (product) => product.id !== productId
          ),

          wishlist: state.wishlist.filter(
            (item) => item !== productId
          ),

          cart: state.cart.filter(
            (item) => item !== productId
          ),
        }));

        return true;
      },

      // ==================================
      // DEMO CHECKOUT
      // ==================================

      demoCheckout: () => {
        const state = get();

        const items = state.cart
          .map((id) =>
            state.products.find(
              (product) => product.id === id
            )
          )
          .filter(Boolean);

        if (!items.length) {
          return false;
        }

        // Don't create an order containing
        // reserved or sold products.
        if (
          items.some(
            (product) =>
              !isProductAvailable(product)
          )
        ) {
          return false;
        }

        set({
          orders: [
            {
              id: crypto.randomUUID(),

              items,

              total: items.reduce(
                (total, product) =>
                  total + product.price,
                0
              ),

              date: new Date().toISOString(),

              status: "Demo order — unpaid",
            },

            ...state.orders,
          ],

          cart: [],
        });

        return true;
      },
    }),

    // ==================================
    // PERSISTENCE
    // ==================================

    {
      name: "campusmart-demo-v1",

      partialize: (state) => ({
        wishlist: state.wishlist,
        cart: state.cart,
        orders: state.orders,
        theme: state.theme,
      }),
    }
  )
);
