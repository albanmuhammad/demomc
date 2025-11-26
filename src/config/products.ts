// src/config/products.ts

// Id produk yang juga dipakai untuk tracking
export type ProductId = "PRD001" | "PRD002" | "PRD003";

export interface Product {
  id: ProductId; // Product Id dari CSV
  name: string; // Product Name
  sku: string; // Product SKU
  description: string;
  imageUrl: string;
  badge?: string; // optional, buat tampilan
}

// Hard-code sesuai CSV + tambahkan imageUrl
export const PRODUCTS: Product[] = [
  {
    id: "PRD001",
    name: "Laptop X1",
    sku: "LAPTOP-X1",
    description: "High performance laptop",
    imageUrl:
      "https://images.pexels.com/photos/18105/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=800",
    badge: "Best Seller",
  },
  {
    id: "PRD002",
    name: "Headset Pro",
    sku: "HDP-900",
    description: "Premium noise-cancelling headset",
    imageUrl:
      "https://images.pexels.com/photos/3394664/pexels-photo-3394664.jpeg?auto=compress&cs=tinysrgb&w=800",
    badge: "New",
  },
  {
    id: "PRD003",
    name: "FitWatch Z",
    sku: "FWZ-2024",
    description: "Smart fitness watch with GPS",
    imageUrl:
      "https://images.pexels.com/photos/267394/pexels-photo-267394.jpeg?auto=compress&cs=tinysrgb&w=800",
    badge: "Trending",
  },
];
