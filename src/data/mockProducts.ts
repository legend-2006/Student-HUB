import sneakers from "@/assets/products/sneakers.jpg";
import textbooks from "@/assets/products/textbooks.jpg";
import headphones from "@/assets/products/headphones.jpg";
import backpack from "@/assets/products/backpack.jpg";
import calculator from "@/assets/products/calculator.jpg";
import lamp from "@/assets/products/lamp.jpg";

export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  seller: string;
  campus: string;
  category: string;
}

export const mockProducts: Product[] = [
  {
    id: "1",
    name: "White Campus Sneakers",
    price: 45,
    image: sneakers,
    seller: "Thabo M.",
    campus: "Wits University",
    category: "Fashion",
  },
  {
    id: "2",
    name: "Engineering Textbook Bundle",
    price: 120,
    image: textbooks,
    seller: "Amara K.",
    campus: "UCT",
    category: "Books",
  },
  {
    id: "3",
    name: "Wireless Studio Headphones",
    price: 85,
    image: headphones,
    seller: "Jordan P.",
    campus: "Stellenbosch",
    category: "Electronics",
  },
  {
    id: "4",
    name: "Laptop Backpack Navy",
    price: 60,
    image: backpack,
    seller: "Naledi S.",
    campus: "UJ",
    category: "Accessories",
  },
  {
    id: "5",
    name: "Scientific Calculator",
    price: 35,
    image: calculator,
    seller: "David L.",
    campus: "UP",
    category: "Electronics",
  },
  {
    id: "6",
    name: "Minimalist Desk Lamp",
    price: 28,
    image: lamp,
    seller: "Fatima A.",
    campus: "UKZN",
    category: "Dorm Essentials",
  },
];

export const categories = [
  "All",
  "Fashion",
  "Books",
  "Electronics",
  "Accessories",
  "Dorm Essentials",
  "Food & Snacks",
];
