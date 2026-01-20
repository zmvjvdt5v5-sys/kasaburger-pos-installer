// KioskAdmin Constants
export const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export const DEFAULT_CATEGORIES = [
  { id: 'et-burger', name: 'Et Burger', icon: '🍔' },
  { id: 'premium', name: 'Premium', icon: '👑' },
  { id: 'tavuk', name: 'Tavuk', icon: '🍗' },
  { id: 'atistirmalik', name: 'Yan Ürün', icon: '🍟' },
  { id: 'icecek', name: 'İçecek', icon: '🥤' },
  { id: 'tatli', name: 'Tatlı', icon: '🍫' },
];

export const DEFAULT_PRODUCTS = [
  // ET BURGER
  {id: "kasa-classic", name: "Kasa Classic Burger", category: "et-burger", price: 460, image: "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768719627/kasaburger/products/lxmwj2opjfgpn5wfyvni.jpg", is_active: true, description: "150 gr. özel baharatlı dana köfte, taze yeşillik, Kasa Gizli Sos"},
  {id: "golden-burger", name: "Golden Burger", category: "et-burger", price: 1190, image: "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768719644/kasaburger/products/etnwv98b4qqa3dhs7j5w.jpg", is_active: true, is_premium: true, description: "150 gr. Dry-Aged köfte, brioche ekmek, yenilebilir altın kaplama, trüf sos, double cheddar"},
  {id: "cheese-lover", name: "Cheese Lover Burger", category: "et-burger", price: 560, image: "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768719667/kasaburger/products/c2kdofwltpm4xsrcheuu.jpg", is_active: true, description: "150 gr. dana köfte, çift cheddar + erimiş peynir sosu, karamelize soğan"},
  {id: "no7-burger", name: "No:7 Burger", category: "et-burger", price: 540, image: "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768719690/kasaburger/products/dvqjrymmcqtfjxiuc29z.jpg", is_active: true, description: "150 gr. dana köfte, double cheddar, jalapeno, acılı kasa sos, çıtır soğan"},
  {id: "hirsiz-polis", name: "Hırsız & Polis Burger", category: "et-burger", price: 490, image: "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768719731/kasaburger/products/zo9ysvxshviqu7pbqztq.jpg", is_active: true, description: "2x150 gr. dana köfte, Polis sos (tatlı), Hırsız (acı), cheddar"},
  // PREMIUM GOURMET
  {id: "viking-burger", name: "Viking Burger", category: "premium", price: 430, image: "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768719764/kasaburger/products/fojwkaq08bwngprupkgt.jpg", is_active: true, is_premium: true, description: "150 gr. dana köfte, 20 gr. cheddar peyniri, çıtır soğan, viking sos"},
  {id: "milano-burger", name: "Milano Burger", category: "premium", price: 440, image: "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768719790/kasaburger/products/oybw8jxjs53wleejjeen.jpg", is_active: true, is_premium: true, description: "150gr. dana köfte, mozzarella, kuru domates, pesto mayo, roka"},
  {id: "kasa-double-xl", name: "Kasa Double XL", category: "premium", price: 640, image: "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768719837/kasaburger/products/e5erpcna8ufgyl4roxhh.jpg", is_active: true, is_premium: true, description: "300 gr. dana köfte, 40 gr. cheddar, karamelize soğan, kasa özel sos"},
  {id: "smoky-bbq", name: "Smoky BBQ Burger", category: "premium", price: 560, image: "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768719856/kasaburger/products/zx1kw1d23traidkigrdv.jpg", is_active: true, is_premium: true, description: "150 gr. dana köfte, 20 gr. cheddar, kızartılmış pastırma, bbq sos"},
  {id: "animal-style", name: "Animal Style Burger", category: "premium", price: 550, image: "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768719882/kasaburger/products/sdgw0vm1iicwkjvvkeee.jpg", is_active: true, is_premium: true, description: "150 gr. dana köfte, cheddar peynir, karamelize soğan, animal sos"},
  // TAVUK BURGER
  {id: "crispy-chicken", name: "Crispy Chicken Burger", category: "tavuk", price: 360, image: "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768719954/kasaburger/products/xobrshlgrwd4opojrmum.jpg", is_active: true, description: "Çıtır paneli tavuk göğsü, taze yeşillik, turşu, mayonez"},
  {id: "double-crispy", name: "Double Crispy Chicken", category: "tavuk", price: 410, image: "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768719978/kasaburger/products/ronl4qic10vbgjictclt.jpg", is_active: true, description: "Double tavuk, cheddar, taze yeşillik, acılı kasa sos, turşu"},
  {id: "animal-chicken", name: "Animal Style Chicken", category: "tavuk", price: 430, image: "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768720009/kasaburger/products/lpmkvz6bhfewl5pgskic.jpg", is_active: true, description: "Çıtır paneli tavuk göğsü, karamelize soğan, double cheddar, animal sos"},
  {id: "spicy-hirsiz", name: "(Spicy) Hırsız Burger", category: "tavuk", price: 420, image: "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768720039/kasaburger/products/bvxcrizznvjaqjvxlucu.jpg", is_active: true, description: "Acı marinasyonlu çıtır tavuk, cheddar, acılı kasa mayonez, jalapeno"},
  {id: "sweet-polis", name: "(Sweet) Polis Burger", category: "tavuk", price: 420, image: "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768720071/kasaburger/products/w50qmsz041zi7h4pjkwu.jpg", is_active: true, description: "Tatlı marinasyonlu çıtır tavuk, tatlı kasa sos, taze yeşillik, mozzarella"},
  {id: "milano-chicken", name: "Milano Chicken Burger", category: "tavuk", price: 440, image: "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768720100/kasaburger/products/tfrehnmtr9juqankalhj.jpg", is_active: true, description: "İnce paneli çıtır tavuk, pesto mayo, kurutulmuş domates, mozzarella"},
  {id: "viking-chicken", name: "Viking Chicken Burger", category: "tavuk", price: 430, image: "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768720128/kasaburger/products/qwg6eqpyimd8dpn9nr1v.jpg", is_active: true, description: "Viking sos, çıtır tavuk, cheddar, kornişon turşu, çıtır soğan"},
  // ATISTIRMALIKLAR
  {id: "mozarella-sticks", name: "Mozarella Sticks", category: "atistirmalik", price: 210, image: "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768720187/kasaburger/products/kvsrbiutiqdqhoolov8z.jpg", is_active: true, description: "6 adet (yarım porsiyon patates ile)"},
  {id: "sogan-halkasi", name: "Soğan Halkası", category: "atistirmalik", price: 180, image: "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768720212/kasaburger/products/ujatmwdny3it8dzcikkn.jpg", is_active: true, description: "8 adet (yarım porsiyon patates ile)"},
  {id: "cheese-fries", name: "Prison Cheese Lover Fries", category: "atistirmalik", price: 150, image: "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768720240/kasaburger/products/dzxb0lv41xafeybynhri.jpg", is_active: true, description: "Cheddar soslu patates"},
  {id: "truffle-fries", name: "Prison Truffle Fries", category: "atistirmalik", price: 175, image: "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768720258/kasaburger/products/cj3px5epr92okzergc7c.jpg", is_active: true, description: "Trüf soslu patates"},
  {id: "cajun-fries", name: "Prison Hot Lockdown Fries", category: "atistirmalik", price: 160, image: "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768720282/kasaburger/products/csdwzqwozldfxxt7pkpr.jpg", is_active: true, description: "Cajun baharatlı patates"},
  // İÇECEKLER
  {id: "ayran", name: "Ayran", category: "icecek", price: 35, image: "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768720311/kasaburger/products/xgrn8fvph9jaeh1bqwat.jpg", is_active: true},
  {id: "su", name: "Su", category: "icecek", price: 20, image: "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768720333/kasaburger/products/jl2q8smtq7de6lh16uul.jpg", is_active: true},
  {id: "limonata", name: "Limonata", category: "icecek", price: 55, image: "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768720355/kasaburger/products/exyjmazfyp4hyx2hbxsu.jpg", is_active: true},
  {id: "pepsi", name: "Pepsi", category: "icecek", price: 45, image: "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768720380/kasaburger/products/zu98squbgxxa0hppmxwn.jpg", is_active: true},
  {id: "milkshake", name: "Milkshake", category: "icecek", price: 85, image: "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768720424/kasaburger/products/uitufnzpxr7fatrttobr.jpg", is_active: true},
  // TATLILAR
  {id: "choco-bomb", name: "Kasa Choco Bomb", category: "tatli", price: 200, image: "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768687930/kasaburger/products/ohr3dgedrnaz53p8p26t.jpg", is_active: true},
  {id: "churros", name: "Churros", category: "tatli", price: 180, image: "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768686916/kasaburger/products/yveoyknzrq0w0kuwxxvq.jpg", is_active: true},
  {id: "oreo-dream", name: "Oreo Dream Cup", category: "tatli", price: 220, image: "https://res.cloudinary.com/dgxiovaqv/image/upload/v1768686685/kasaburger/products/ktej7vqaqnm2qt5fjnce.jpg", is_active: true},
];

export const EMOJI_OPTIONS = ['🍔', '👑', '🍗', '🍟', '🥤', '🍫', '🥗', '🌮', '🍕', '🍜', '🥪', '🧀', '🍦', '☕', '🍰'];
