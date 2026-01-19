// Kiosk Constants & Helpers
export const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export const DEFAULT_PRODUCTS = [
  // ET BURGER
  {id: "kasa-classic", name: "Kasa Classic Burger", category: "Et Burger", price: 460, image: "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768719627/kasaburger/products/lxmwj2opjfgpn5wfyvni.jpg"},
  {id: "golden-burger", name: "Golden Burger", category: "Et Burger", price: 1190, image: "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768719644/kasaburger/products/etnwv98b4qqa3dhs7j5w.jpg", is_premium: true},
  {id: "cheese-lover", name: "Cheese Lover Burger", category: "Et Burger", price: 560, image: "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768719667/kasaburger/products/c2kdofwltpm4xsrcheuu.jpg"},
  {id: "no7-burger", name: "No:7 Burger", category: "Et Burger", price: 540, image: "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768719690/kasaburger/products/dvqjrymmcqtfjxiuc29z.jpg"},
  {id: "hirsiz-polis", name: "Hırsız & Polis Burger", category: "Et Burger", price: 490, image: "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768719731/kasaburger/products/zo9ysvxshviqu7pbqztq.jpg"},
  // PREMIUM
  {id: "viking-burger", name: "Viking Burger", category: "Premium", price: 430, image: "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768719764/kasaburger/products/fojwkaq08bwngprupkgt.jpg", is_premium: true},
  {id: "milano-burger", name: "Milano Burger", category: "Premium", price: 440, image: "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768719790/kasaburger/products/oybw8jxjs53wleejjeen.jpg", is_premium: true},
  {id: "kasa-double-xl", name: "Kasa Double XL", category: "Premium", price: 640, image: "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768719837/kasaburger/products/e5erpcna8ufgyl4roxhh.jpg", is_premium: true},
  {id: "smoky-bbq", name: "Smoky BBQ Burger", category: "Premium", price: 560, image: "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768719856/kasaburger/products/zx1kw1d23traidkigrdv.jpg", is_premium: true},
  {id: "animal-style", name: "Animal Style Burger", category: "Premium", price: 550, image: "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768719882/kasaburger/products/sdgw0vm1iicwkjvvkeee.jpg", is_premium: true},
  // TAVUK
  {id: "crispy-chicken", name: "Crispy Chicken Burger", category: "Tavuk", price: 360, image: "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768719954/kasaburger/products/xobrshlgrwd4opojrmum.jpg"},
  {id: "double-crispy", name: "Double Crispy Chicken", category: "Tavuk", price: 410, image: "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768719978/kasaburger/products/ronl4qic10vbgjictclt.jpg"},
  {id: "animal-chicken", name: "Animal Style Chicken", category: "Tavuk", price: 430, image: "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768720009/kasaburger/products/lpmkvz6bhfewl5pgskic.jpg"},
  {id: "spicy-hirsiz", name: "(Spicy) Hırsız Burger", category: "Tavuk", price: 420, image: "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768720039/kasaburger/products/bvxcrizznvjaqjvxlucu.jpg"},
  {id: "sweet-polis", name: "(Sweet) Polis Burger", category: "Tavuk", price: 420, image: "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768720071/kasaburger/products/w50qmsz041zi7h4pjkwu.jpg"},
  {id: "milano-chicken", name: "Milano Chicken Burger", category: "Tavuk", price: 440, image: "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768720100/kasaburger/products/tfrehnmtr9juqankalhj.jpg"},
  {id: "viking-chicken", name: "Viking Chicken Burger", category: "Tavuk", price: 430, image: "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768720128/kasaburger/products/qwg6eqpyimd8dpn9nr1v.jpg"},
  // YAN ÜRÜN
  {id: "mac-cheese", name: "Mac and Cheese Topları", category: "Yan Ürün", price: 170, image: "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768720160/kasaburger/products/jnzrcojxzkdrgb5u2exk.jpg"},
  {id: "mozarella-sticks", name: "Mozarella Sticks", category: "Yan Ürün", price: 210, image: "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768720187/kasaburger/products/kvsrbiutiqdqhoolov8z.jpg"},
  {id: "sogan-halkasi", name: "Soğan Halkası", category: "Yan Ürün", price: 180, image: "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768720212/kasaburger/products/ujatmwdny3it8dzcikkn.jpg"},
  {id: "cheese-fries", name: "Prison Cheese Lover Fries", category: "Yan Ürün", price: 150, image: "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768720240/kasaburger/products/dzxb0lv41xafeybynhri.jpg"},
  {id: "truffle-fries", name: "Prison Truffle Fries", category: "Yan Ürün", price: 175, image: "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768720258/kasaburger/products/cj3px5epr92okzergc7c.jpg"},
  {id: "cajun-fries", name: "Prison Hot Lockdown Fries", category: "Yan Ürün", price: 160, image: "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768720282/kasaburger/products/csdwzqwozldfxxt7pkpr.jpg"},
  // İÇECEK
  {id: "ayran", name: "Ayran", category: "İçecek", price: 35, image: "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768720311/kasaburger/products/xgrn8fvph9jaeh1bqwat.jpg"},
  {id: "su", name: "Su", category: "İçecek", price: 20, image: "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768720333/kasaburger/products/jl2q8smtq7de6lh16uul.jpg"},
  {id: "limonata", name: "Limonata", category: "İçecek", price: 55, image: "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768720355/kasaburger/products/exyjmazfyp4hyx2hbxsu.jpg"},
  {id: "pepsi", name: "Pepsi", category: "İçecek", price: 45, image: "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768720380/kasaburger/products/zu98squbgxxa0hppmxwn.jpg"},
  {id: "milkshake", name: "Milkshake", category: "İçecek", price: 85, image: "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768720424/kasaburger/products/uitufnzpxr7fatrttobr.jpg"},
  // TATLI
  {id: "choco-bomb", name: "Kasa Choco Bomb", category: "Tatlı", price: 200, image: "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768720355/kasaburger/products/exyjmazfyp4hyx2hbxsu.jpg"},
  {id: "churros", name: "Churros", category: "Tatlı", price: 180, image: "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768720380/kasaburger/products/zu98squbgxxa0hppmxwn.jpg"},
  {id: "oreo-dream", name: "Oreo Dream Cup", category: "Tatlı", price: 220, image: "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768720424/kasaburger/products/uitufnzpxr7fatrttobr.jpg"},
];

export const DEFAULT_CATEGORIES = [
  { id: 'Et Burger', name: 'Burger', icon: '🍔' },
  { id: 'Premium', name: 'Premium', icon: '👑' },
  { id: 'Tavuk', name: 'Tavuk', icon: '🍗' },
  { id: 'Yan Ürün', name: 'Yan Ürün', icon: '🍟' },
  { id: 'İçecek', name: 'İçecek', icon: '🥤' },
  { id: 'Tatlı', name: 'Tatlı', icon: '🍫' },
];

export const MENU_DATA = {
  categories: DEFAULT_CATEGORIES,
  products: DEFAULT_PRODUCTS
};

export const formatPrice = (amount) => `₺${amount?.toFixed?.(0) || 0}`;

export const LOGO_URL = "https://customer-assets.emergentagent.com/job_kasaburger-pos/artifacts/oruytxht_b3459348-380a-4e05-8eb6-989bd31e2066.jpeg";
