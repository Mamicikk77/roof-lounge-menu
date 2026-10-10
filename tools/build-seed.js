// Eski menüden (tools/raw.json) yeni menü verisini (data/menu.json) üretir.
// Fiyatlar eski sistemden ID ile alınır; çeviri, açıklama, kalori ve alerjenler burada tanımlıdır.
// Kullanım: node tools/build-seed.js   (DİKKAT: mevcut data/menu.json üzerine yazar)
const fs = require('fs'), path = require('path');
const raw = JSON.parse(fs.readFileSync(path.join(__dirname, 'raw.json'), 'utf8'));
const byId = new Map(raw.map(r => [r.id, r]));
const out = path.join(__dirname, '..', 'data', 'menu.json');

const T = (tr, en, ru) => ({ tr, en: en || tr, ru: ru || en || tr });

const sections = [
  { id: 'food', name: T('Yiyecek', 'Food', 'Еда') },
  { id: 'drinks', name: T('İçecek', 'Drinks', 'Напитки') },
  { id: 'bar', name: T('Bar', 'Bar', 'Бар') },
  { id: 'hookah', name: T('Nargile', 'Hookah', 'Кальян') },
];

const CATS = [
  ['kahvalti', 'food', '🍳', 'Kahvaltı', 'Breakfast', 'Завтрак'],
  ['aperatif', 'food', '🍟', 'Aperatifler & Çorba', 'Starters & Soup', 'Закуски и суп'],
  ['salata', 'food', '🥗', 'Salatalar', 'Salads', 'Салаты'],
  ['tost', 'food', '🥪', 'Tost & Sandviç', 'Toasts & Sandwiches', 'Тосты и сэндвичи'],
  ['gozleme', 'food', '🫓', 'Gözlemeler', 'Gözleme', 'Гёзлеме'],
  ['burger', 'food', '🍔', 'Burgerler', 'Burgers', 'Бургеры'],
  ['durum', 'food', '🌯', 'Ekmek Arası & Wrap', 'Sandwiches & Wraps', 'Сэндвичи и роллы'],
  ['pizza', 'food', '🍕', 'Pizzalar', 'Pizzas', 'Пицца'],
  ['makarna', 'food', '🍝', 'Makarnalar', 'Pasta', 'Паста'],
  ['tavuk', 'food', '🍗', 'Tavuk Yemekleri', 'Chicken Dishes', 'Блюда из курицы'],
  ['et', 'food', '🥩', 'Et Yemekleri', 'Meat Dishes', 'Мясные блюда'],
  ['cerez', 'food', '🥜', 'Çerezler', 'Nuts & Nibbles', 'Орешки'],
  ['meyve', 'food', '🍉', 'Meyve', 'Fruit', 'Фрукты'],
  ['tatli', 'food', '🍰', 'Tatlılar', 'Desserts', 'Десерты'],
  ['dondurma', 'food', '🍨', 'Dondurma', 'Ice Cream', 'Мороженое'],
  ['soguk', 'drinks', '🥤', 'Soğuk İçecekler', 'Soft Drinks', 'Холодные напитки'],
  ['cay', 'drinks', '🫖', 'Çay & Sıcak İçecekler', 'Tea & Hot Drinks', 'Чай и горячие напитки'],
  ['turkkahve', 'drinks', '☕', 'Türk Kahvesi', 'Turkish Coffee', 'Турецкий кофе'],
  ['kahve', 'drinks', '☕', 'Kahveler', 'Coffee', 'Кофе'],
  ['sogukkahve', 'drinks', '🧋', 'Soğuk Kahve & Frappe', 'Iced Coffee & Frappé', 'Холодный кофе и фраппе'],
  ['milkshake', 'drinks', '🥛', 'Milkshake', 'Milkshakes', 'Милкшейки'],
  ['frozen', 'drinks', '🍧', 'Frozen', 'Frozen', 'Фрозен'],
  ['mocktail', 'drinks', '🍹', 'Alkolsüz Kokteyller', 'Mocktails', 'Безалкогольные коктейли'],
  ['kokteyl', 'bar', '🍸', 'Kokteyller', 'Cocktails', 'Коктейли'],
  ['alkahve', 'bar', '☕', 'Alkollü Kahveler', 'Spiked Coffee', 'Кофе с алкоголем'],
  ['bira', 'bar', '🍺', 'Biralar', 'Beers', 'Пиво'],
  ['shot', 'bar', '🥃', 'Shotlar', 'Shots', 'Шоты'],
  ['kadeh', 'bar', '🥃', 'Tek & Duble', 'By the Glass', 'Порционно'],
  ['sarap', 'bar', '🍷', 'Şarap & Şampanya', 'Wine & Champagne', 'Вино и шампанское'],
  ['viski', 'bar', '🥃', 'Viski (Şişe)', 'Whisky (Bottle)', 'Виски (бутылка)'],
  ['raki', 'bar', '🥛', 'Rakı (Şişe)', 'Rakı (Bottle)', 'Ракы (бутылка)'],
  ['votka', 'bar', '🍾', 'Votka (Şişe)', 'Vodka (Bottle)', 'Водка (бутылка)'],
  ['cin', 'bar', '🍾', 'Cin (Şişe)', 'Gin (Bottle)', 'Джин (бутылка)'],
  ['likor', 'bar', '🍾', 'Tekila & Likör (Şişe)', 'Tequila & Liqueur (Bottle)', 'Текила и ликёры (бутылка)'],
  ['nargile', 'hookah', '💨', 'Nargile', 'Hookah', 'Кальян'],
  ['mix', 'hookah', '✨', 'Special Mix', 'Signature Mixes', 'Фирменные миксы'],
];

const VL = {
  tek: T('Tek', 'Single', 'Одинарный'),
  duble: T('Duble', 'Double', 'Двойной'),
  normal: T('Normal', 'Regular', 'Обычный'),
  kafa: T('Ekstra Kafa', 'Extra Head', 'Доп. чаша'),
  kova: T("5'li Kova", 'Bucket of 5', 'Ведро (5 шт.)'),
};
const vlabel = k => VL[k] || T(k, k, k.replace('cl', 'сл'));

// R(kategori, eskiId | [[varyant, eskiId],...], tr, en, ru, kcal, porsiyon, alerjenler, etiketler, açıklama "tr|en|ru")
// Alerjen kodları (AB 14): gluten, crustaceans, eggs, fish, peanuts, soy, milk, nuts, celery, mustard, sesame, sulphites, lupin, molluscs
const AL = { g: 'gluten', c: 'crustaceans', e: 'eggs', f: 'fish', p: 'peanuts', s: 'soy', m: 'milk', n: 'nuts', ce: 'celery', mu: 'mustard', se: 'sesame', su: 'sulphites', l: 'lupin', mo: 'molluscs' };
const rows = [];
const R = (cat, ids, tr, en, ru, kcal, portion, al, tags, desc) => rows.push({ cat, ids, tr, en, ru, kcal, portion, al, tags, desc });

/* ---------------- YİYECEK ---------------- */
R('kahvalti', 238, 'Kahvaltı Tabağı', 'Breakfast Plate', 'Тарелка завтрака', 650, '', 'g,m,e', 'veg', 'Beyaz peynir, kaşar, zeytin, domates, salatalık, haşlanmış yumurta, bal, reçel, tereyağı ve sıcak ekmek|White cheese, kashar cheese, olives, tomato, cucumber, boiled egg, honey, jam, butter and warm bread|Белый сыр, сыр кашар, оливки, помидоры, огурцы, варёное яйцо, мёд, варенье, сливочное масло и тёплый хлеб');
R('kahvalti', 638, 'Serpme Kahvaltı (2 Kişilik)', 'Turkish Breakfast Spread (for 2)', 'Турецкий завтрак (на двоих)', 1600, '', 'g,m,e,n', 'popular', 'Peynir çeşitleri, zeytin, sucuklu yumurta, sigara böreği, patates, bal-kaymak, reçeller, söğüş, simit ve sınırsız çay|Assorted cheeses, olives, eggs with sucuk, cheese rolls, fries, honey & clotted cream, jams, fresh vegetables, simit and unlimited tea|Ассорти сыров, оливки, яйца с суджуком, сигара бёрек, картофель, мёд с каймаком, варенье, овощи, симит и безлимитный чай');
R('kahvalti', 239, 'Salamlı Omlet', 'Omelette with Salami', 'Омлет с салями', 420, '', 'e,m,g', '', 'Üç yumurtalı omlet, salam ve kaşar; ekmek ile|Three-egg omelette with salami and kashar cheese, served with bread|Омлет из трёх яиц с салями и сыром кашар, подаётся с хлебом');
R('kahvalti', 240, 'Karışık Omlet', 'Mixed Omelette', 'Омлет ассорти', 450, '', 'e,m,g', '', 'Sucuk, kaşar, biber ve domatesli omlet; ekmek ile|Omelette with sucuk, kashar cheese, peppers and tomato, served with bread|Омлет с суджуком, сыром кашар, перцем и помидорами, подаётся с хлебом');

R('aperatif', 606, 'Günün Çorbası', 'Soup of the Day', 'Суп дня', 180, '', 'g,m,ce', '', 'Şefin günlük taze çorbası, ekmek ile|Chef’s fresh soup of the day, served with bread|Свежий суп дня от шефа, подаётся с хлебом');
R('aperatif', 241, 'Patates Kızartması', 'French Fries', 'Картофель фри', 420, '', '', 'vegan', 'Çıtır patates kızartması, ketçap ve mayonez ile|Crispy fries with ketchup and mayonnaise|Хрустящий картофель фри с кетчупом и майонезом');
R('aperatif', 242, 'Elma Dilim Patates', 'Potato Wedges', 'Картофельные дольки', 450, '', '', 'vegan', 'Baharatlı elma dilim patates, soslarla|Seasoned potato wedges with dips|Пряные картофельные дольки с соусами');
R('aperatif', 243, 'Sigara Böreği', 'Cheese Rolls (Sigara Börek)', 'Сигара бёрек', 380, '', 'g,m,e', 'veg', 'Beyaz peynirli çıtır yufka ruloları|Crispy filo rolls filled with white cheese|Хрустящие рулетики из теста фило с белым сыром');
R('aperatif', 244, 'Bira Tabağı', 'Beer Snack Platter', 'Пивная тарелка', 950, '', 'g,m,e,mu', 'popular', 'Patates, soğan halkası, nugget, sosis ve sigara böreği; soslarla|Fries, onion rings, nuggets, sausages and cheese rolls with dips|Картофель фри, луковые кольца, наггетсы, сосиски и сигара бёрек с соусами');
R('aperatif', 245, 'Karides Tava', 'Pan-Fried Shrimp', 'Креветки на сковороде', 380, '', 'c,m', 'spicy', 'Tereyağı, sarımsak ve pul biberle tavada karides|Shrimp sautéed in butter with garlic and chili flakes|Креветки, обжаренные в сливочном масле с чесноком и перцем');
R('aperatif', 712, 'Nugget Tabağı', 'Chicken Nuggets', 'Куриные наггетсы', 520, '', 'g,e', '', 'Çıtır tavuk nugget, patates kızartması ve soslar|Crispy chicken nuggets with fries and dips|Хрустящие куриные наггетсы с картофелем фри и соусами');
R('aperatif', 630, 'Meze Tabağı', 'Meze Platter', 'Ассорти мезе', 380, '', 'm,se', 'veg', 'Günlük hazırlanan karışık mezeler|Assorted meze prepared daily|Ассорти мезе, приготовленных сегодня');
R('aperatif', 515, 'Peynir Tabağı', 'Cheese Platter', 'Сырная тарелка', 450, '', 'm', 'veg', 'Karışık peynirler, zeytin ve domates|Assorted cheeses with olives and tomato|Ассорти сыров с оливками и помидорами');
R('aperatif', 516, 'Ezine Peynir Tabağı', 'Ezine Cheese Plate', 'Тарелка сыра эзине', 320, '', 'm', 'veg', 'Ezine beyaz peyniri, kavun mevsiminde kavun ile|Ezine white cheese, with melon in season|Белый сыр эзине, в сезон — с дыней');
R('aperatif', 518, 'Kuru Cacık', 'Strained Yogurt Dip', 'Сухой джаджик', 160, '', 'm', 'veg', 'Süzme yoğurt, salatalık, sarımsak ve nane|Strained yogurt with cucumber, garlic and mint|Густой йогурт с огурцом, чесноком и мятой');
R('aperatif', 604, 'Yoğurt Tabağı', 'Yogurt Plate', 'Тарелка йогурта', 150, '', 'm', 'veg', '');
R('aperatif', 521, 'Turşu Tabağı', 'Pickle Plate', 'Ассорти солений', 40, '', 'su', 'vegan', '');

R('salata', 246, 'Sezar Salata', 'Caesar Salad', 'Салат «Цезарь»', 480, '', 'g,e,m,f,mu', 'popular', 'Izgara tavuk, marul, kruton, parmesan ve sezar sos|Grilled chicken, romaine, croutons, parmesan and Caesar dressing|Курица гриль, романо, гренки, пармезан и соус «Цезарь»');
R('salata', 247, 'Ton Balıklı Salata', 'Tuna Salad', 'Салат с тунцом', 380, '', 'f,e,mu', '', 'Ton balığı, mevsim yeşillikleri, mısır, zeytin ve domates|Tuna, seasonal greens, sweetcorn, olives and tomato|Тунец, сезонная зелень, кукуруза, оливки и помидоры');
R('salata', 248, 'Yeşil Salata', 'Green Salad', 'Зелёный салат', 150, '', '', 'vegan', 'Mevsim yeşillikleri, domates, salatalık, nar ekşisi ve zeytinyağı|Seasonal greens, tomato, cucumber, pomegranate molasses and olive oil|Сезонная зелень, помидоры, огурцы, гранатовый соус и оливковое масло');

R('tost', 250, 'Kaşarlı Tost', 'Cheese Toast', 'Тост с сыром', 420, '', 'g,m', 'veg', 'Bol kaşarlı tost; patates ve yeşillik ile|Toasted sandwich with kashar cheese, served with fries and greens|Тост с сыром кашар, подаётся с картофелем и зеленью');
R('tost', 251, 'Karışık Tost', 'Mixed Toast', 'Тост ассорти', 520, '', 'g,m', '', 'Kaşar ve sucuklu tost; patates ve yeşillik ile|Toasted sandwich with kashar cheese and sucuk, served with fries and greens|Тост с сыром кашар и суджуком, подаётся с картофелем и зеленью');
R('tost', 252, 'Kavurmalı Tost', 'Braised Beef Toast', 'Тост с кавурмой', 600, '', 'g,m', '', 'Kaşar ve dana kavurmalı tost|Toasted sandwich with kashar cheese and braised beef|Тост с сыром кашар и говяжьей кавурмой');
R('tost', 633, 'Karışık Sandviç', 'Mixed Sandwich', 'Сэндвич ассорти', 480, '', 'g,m,e,mu', '', '');

R('gozleme', 253, 'Kaşarlı Gözleme', 'Cheese Gözleme', 'Гёзлеме с сыром', 520, '', 'g,m', 'veg', 'İnce yufkada, sacda pişen kaşarlı gözleme|Thin hand-rolled flatbread filled with kashar cheese, cooked on the griddle|Тонкая лепёшка с сыром кашар, приготовленная на садже');
R('gozleme', 254, 'Patatesli Gözleme', 'Potato Gözleme', 'Гёзлеме с картофелем', 480, '', 'g,m', 'veg', 'Baharatlı patatesli sac gözlemesi|Griddle flatbread with spiced potato filling|Лепёшка с пряной картофельной начинкой');
R('gozleme', 255, 'Karışık Gözleme', 'Mixed Gözleme', 'Гёзлеме ассорти', 600, '', 'g,m', '', 'Kaşar, sucuk ve patatesli gözleme|Flatbread filled with kashar cheese, sucuk and potato|Лепёшка с сыром кашар, суджуком и картофелем');

R('burger', 256, 'Hamburger', 'Hamburger', 'Гамбургер', 750, '150 g', 'g,e,s,mu,se', '', '150 gr dana köfte, marul, domates, turşu ve özel sos; patates ile|150 g beef patty, lettuce, tomato, pickles and house sauce, served with fries|Говяжья котлета 150 г, салат, помидор, огурцы и фирменный соус, с картофелем фри');
R('burger', 257, 'Cheeseburger', 'Cheeseburger', 'Чизбургер', 820, '150 g', 'g,e,m,s,mu,se', '', '150 gr dana köfte, cheddar, marul, domates, turşu ve özel sos; patates ile|150 g beef patty, cheddar, lettuce, tomato, pickles and house sauce, with fries|Говяжья котлета 150 г, чеддер, салат, помидор, огурцы и фирменный соус, с картофелем фри');
R('burger', 258, 'Duble Burger', 'Double Burger', 'Двойной бургер', 1150, '300 g', 'g,e,m,s,mu,se', '', 'İki adet 150 gr dana köfte ve çift cheddar; patates ile|Two 150 g beef patties with double cheddar, served with fries|Две говяжьи котлеты по 150 г и двойной чеддер, с картофелем фри');
R('burger', 259, 'Roof Burger', 'Roof Burger', 'Roof бургер', 1100, '180 g', 'g,e,m,s,mu,se', 'chef', 'Şefin imza burgeri: dana köfte, cheddar, karamelize soğan ve barbekü sos; patates ile|Chef’s signature burger: beef patty, cheddar, caramelised onion and BBQ sauce, with fries|Фирменный бургер шефа: говяжья котлета, чеддер, карамелизированный лук и соус барбекю, с картофелем фри');
R('burger', 838, 'Hamburger Menü', 'Burger Combo', 'Бургер-комбо', 1050, '', 'g,e,s,mu,se', '', 'Hamburger + patates + meşrubat|Hamburger + fries + soft drink|Гамбургер + картофель фри + напиток');
R('burger', 839, 'Wrap Menü', 'Wrap Combo', 'Ролл-комбо', 950, '', 'g,e,m,mu', '', 'Tavuk wrap + patates + meşrubat|Chicken wrap + fries + soft drink|Ролл с курицей + картофель фри + напиток');

R('durum', 260, 'Ekmek Arası Köfte', 'Meatball Sandwich', 'Сэндвич с кёфте', 650, '', 'g,e,mu', '', 'Izgara köfte, yeşillik ve domates; patates ile|Grilled meatballs with greens and tomato, served with fries|Котлеты на гриле с зеленью и помидорами, с картофелем фри');
R('durum', 261, 'Ekmek Arası Tavuk', 'Chicken Sandwich', 'Сэндвич с курицей', 580, '', 'g,e,mu', '', 'Izgara tavuk, yeşillik ve sos; patates ile|Grilled chicken with greens and sauce, served with fries|Курица гриль с зеленью и соусом, с картофелем фри');
R('durum', 262, 'Tavuk Wrap', 'Chicken Wrap', 'Ролл с курицей', 620, '', 'g,m,e,mu', 'popular', 'Lavaşta ızgara tavuk, cheddar, yeşillik ve sos; patates ile|Grilled chicken, cheddar, greens and sauce in lavash, served with fries|Курица гриль, чеддер, зелень и соус в лаваше, с картофелем фри');
R('durum', 263, 'Bonfile Wrap', 'Beef Tenderloin Wrap', 'Ролл с говяжьей вырезкой', 700, '', 'g,m,mu', '', 'Lavaşta sotelenmiş bonfile, biber, soğan ve sos; patates ile|Sautéed beef tenderloin, peppers, onion and sauce in lavash, with fries|Обжаренная говяжья вырезка, перец, лук и соус в лаваше, с картофелем фри');

R('pizza', 264, 'Pizza Margarita', 'Margherita Pizza', 'Пицца «Маргарита»', 850, '', 'g,m', 'veg', 'Domates sos, mozzarella ve fesleğen|Tomato sauce, mozzarella and basil|Томатный соус, моцарелла и базилик');
R('pizza', 265, 'Ton Balıklı Pizza', 'Tuna Pizza', 'Пицца с тунцом', 900, '', 'g,m,f', '', 'Domates sos, mozzarella, ton balığı, mısır ve soğan|Tomato sauce, mozzarella, tuna, sweetcorn and onion|Томатный соус, моцарелла, тунец, кукуруза и лук');
R('pizza', 266, 'Vejetaryen Pizza', 'Vegetarian Pizza', 'Вегетарианская пицца', 820, '', 'g,m', 'veg', 'Mantar, biber, mısır, zeytin ve domates|Mushrooms, peppers, sweetcorn, olives and tomato|Грибы, перец, кукуруза, оливки и помидоры');
R('pizza', 267, 'Tavuklu Pizza', 'Chicken Pizza', 'Пицца с курицей', 950, '', 'g,m', '', 'Domates sos, mozzarella, tavuk, mantar ve biber|Tomato sauce, mozzarella, chicken, mushrooms and peppers|Томатный соус, моцарелла, курица, грибы и перец');
R('pizza', 268, 'Karışık Pizza', 'Mixed Pizza', 'Пицца ассорти', 1050, '', 'g,m', 'popular', 'Sucuk, salam, sosis, mantar, biber ve zeytin|Sucuk, salami, sausage, mushrooms, peppers and olives|Суджук, салями, сосиски, грибы, перец и оливки');
R('pizza', 269, 'Meksikan Pizza', 'Mexican Pizza', 'Мексиканская пицца', 1000, '', 'g,m', 'spicy', 'Acılı tavuk, jalapeño, mısır ve renkli biberler|Spicy chicken, jalapeño, sweetcorn and bell peppers|Острая курица, халапеньо, кукуруза и сладкий перец');
R('pizza', 270, 'Deniz Ürünleri Pizza', 'Seafood Pizza', 'Пицца с морепродуктами', 900, '', 'g,m,c,mo,f', '', 'Karides, kalamar ve mozzarella|Shrimp, calamari and mozzarella|Креветки, кальмары и моцарелла');
R('pizza', 837, 'Pizza Menü', 'Pizza Combo', 'Пицца-комбо', 1150, '', 'g,m', '', 'Pizza + patates + meşrubat|Pizza + fries + soft drink|Пицца + картофель фри + напиток');

R('makarna', 271, 'Spagetti Bolonez', 'Spaghetti Bolognese', 'Спагетти болоньезе', 750, '', 'g,m,ce', '', 'Kıymalı domates sos ve parmesan|Beef ragù and parmesan|Мясной соус рагу и пармезан');
R('makarna', 272, 'Tavuklu Penne', 'Chicken Penne', 'Пенне с курицей', 800, '', 'g,m', '', 'Kremalı mantar sosunda tavuk ve penne|Penne with chicken in creamy mushroom sauce|Пенне с курицей в сливочно-грибном соусе');
R('makarna', 273, 'Etli Penne', 'Beef Penne', 'Пенне с говядиной', 850, '', 'g,m', '', 'Sotelenmiş dana eti, domates sos ve parmesan|Sautéed beef, tomato sauce and parmesan|Обжаренная говядина, томатный соус и пармезан');

const garnish = 'Pilav, patates ve salata ile|Served with rice, fries and salad|Подаётся с рисом, картофелем и салатом';
R('tavuk', 274, 'Tavuk Sote', 'Chicken Sauté', 'Куриное соте', 550, '', '', '', 'Biber, domates ve soğanla sotelenmiş tavuk; pilav ile|Chicken sautéed with peppers, tomato and onion, served with rice|Курица, обжаренная с перцем, помидорами и луком, с рисом');
R('tavuk', 275, 'Köri Soslu Tavuk', 'Curry Chicken', 'Курица карри', 650, '', 'm', '', 'Kremalı köri sosunda tavuk; pilav ile|Chicken in creamy curry sauce, served with rice|Курица в сливочном соусе карри, с рисом');
R('tavuk', 276, 'Mantar Soslu Tavuk', 'Chicken with Mushroom Sauce', 'Курица в грибном соусе', 680, '', 'm', '', 'Kremalı mantar sosunda tavuk; pilav ile|Chicken in creamy mushroom sauce, served with rice|Курица в сливочно-грибном соусе, с рисом');
R('tavuk', 277, 'Çıtır Tavuk', 'Crispy Chicken', 'Хрустящая курица', 780, '', 'g,e', 'popular', 'Panelenmiş çıtır tavuk; patates ve soslarla|Breaded crispy chicken with fries and dips|Курица в хрустящей панировке с картофелем и соусами');
R('tavuk', 278, 'Tavuk Fajita', 'Chicken Fajita', 'Фахитас с курицей', 700, '', 'g,m', 'spicy', 'Cızırdayan tavada biberli tavuk, lavaş ve soslar|Sizzling chicken with peppers, served with tortillas and sauces|Шкворчащая курица с перцем, лепёшки и соусы');
R('tavuk', 279, 'Izgara Tavuk', 'Grilled Chicken', 'Курица на гриле', 520, '', '', '', garnish);
R('tavuk', 280, 'Tavuk Şinitzel', 'Chicken Schnitzel', 'Куриный шницель', 800, '', 'g,e', '', garnish);
R('tavuk', 281, 'Tavuk Şiş', 'Chicken Skewers', 'Куриный шашлык', 540, '', 'm', '', garnish);
R('tavuk', 282, 'Tavuk Kavurma', 'Pan-Roasted Chicken', 'Куриная кавурма', 600, '', '', '', 'Tereyağında kavrulmuş tavuk; pilav ile|Chicken pan-roasted in butter, served with rice|Курица, обжаренная на сливочном масле, с рисом');
R('tavuk', 840, 'Şinitzel Menü', 'Schnitzel Combo', 'Шницель-комбо', 1100, '', 'g,e', '', 'Tavuk şinitzel + patates + meşrubat|Chicken schnitzel + fries + soft drink|Куриный шницель + картофель фри + напиток');

R('et', 283, 'Steak', 'Steak', 'Стейк', 750, '', '', '', 'Izgara dana steak; sebze ve patates ile|Grilled beef steak with vegetables and potatoes|Говяжий стейк на гриле с овощами и картофелем');
R('et', 284, 'Mantar Soslu Steak', 'Steak with Mushroom Sauce', 'Стейк в грибном соусе', 850, '', 'm', '', 'Kremalı mantar soslu dana steak|Beef steak with creamy mushroom sauce|Говяжий стейк со сливочно-грибным соусом');
R('et', 285, 'Bonfile (500 g)', 'Beef Tenderloin (500 g)', 'Говяжья вырезка (500 г)', 1100, '500 g', '', '', 'Izgara dana bonfile; sebze ve patates ile|Grilled beef tenderloin with vegetables and potatoes|Говяжья вырезка на гриле с овощами и картофелем');
R('et', 286, 'Bonfile (1000 g)', 'Beef Tenderloin (1000 g)', 'Говяжья вырезка (1000 г)', 2200, '1000 g', '', '', 'Paylaşımlık ızgara bonfile; sebze ve patates ile|Grilled beef tenderloin to share, with vegetables and potatoes|Вырезка на гриле на компанию, с овощами и картофелем');
R('et', 287, 'Karışık Izgara', 'Mixed Grill', 'Мясное ассорти на гриле', 1200, '', 'g,e', 'popular', 'Köfte, tavuk şiş, kuzu pirzola ve bonfile|Meatballs, chicken skewer, lamb chops and beef tenderloin|Кёфте, куриный шашлык, бараньи рёбрышки и говяжья вырезка');
R('et', 288, 'Kuzu Pirzola', 'Lamb Chops', 'Бараньи рёбрышки', 900, '', '', '', garnish);
R('et', 289, 'Köfte', 'Grilled Meatballs', 'Кёфте на гриле', 700, '', 'g,e', '', garnish);
R('et', 290, 'Et Güveç', 'Beef Güveç', 'Говядина гювеч', 750, '', '', '', 'Güveçte sebzelerle pişmiş dana eti; pilav ile|Beef slow-cooked with vegetables in a clay pot, served with rice|Говядина, томлёная с овощами в глиняном горшочке, с рисом');
R('et', 291, 'Et Kavurma', 'Pan-Roasted Beef', 'Говяжья кавурма', 800, '', '', '', 'Tereyağında kavrulmuş dana eti; pilav ile|Beef pan-roasted in butter, served with rice|Говядина, обжаренная на сливочном масле, с рисом');
R('et', 292, 'Saç Kavurma', 'Sizzling Beef Saç', 'Сач-кавурма', 850, '', '', '', 'Saç tavada biber, domates ve soğanla kavrulmuş et|Beef sizzled on a saç pan with peppers, tomato and onion|Мясо на сковороде-садж с перцем, помидорами и луком');
R('et', 293, 'Çoban Kavurma', 'Shepherd’s Beef Sauté', 'Чобан-кавурма', 800, '', '', '', 'Sebzelerle sotelenmiş kuşbaşı et|Diced beef sautéed with vegetables|Говядина кубиками, обжаренная с овощами');
R('et', 294, 'Et Fajita', 'Beef Fajita', 'Фахитас с говядиной', 850, '', 'g,m', 'spicy', 'Cızırdayan tavada biberli dana eti, lavaş ve soslar|Sizzling beef with peppers, served with tortillas and sauces|Шкворчащая говядина с перцем, лепёшки и соусы');
R('et', 295, 'Karışık Fajita', 'Mixed Fajita', 'Фахитас ассорти', 820, '', 'g,m', 'spicy', 'Dana eti ve tavuk; lavaş ve soslarla|Beef and chicken with tortillas and sauces|Говядина и курица с лепёшками и соусами');
R('et', 844, 'Kremalı Etli', 'Creamy Beef', 'Говядина в сливочном соусе', 900, '', 'm', '', 'Kremalı sosta dana eti; pilav ile|Beef in creamy sauce, served with rice|Говядина в сливочном соусе, с рисом');

R('cerez', 133, 'Karışık Çerez', 'Mixed Nuts', 'Ассорти орехов', 600, '100 g', 'n,p', 'vegan', '');
R('cerez', 443, 'Antep Fıstığı Tabağı', 'Pistachios', 'Фисташки', 560, '100 g', 'n', 'vegan', '');
R('cerez', 444, 'Fındık Tabağı', 'Hazelnuts', 'Фундук', 620, '100 g', 'n', 'vegan', '');
R('cerez', 639, 'Kaju Tabağı', 'Cashews', 'Кешью', 550, '100 g', 'n', 'vegan', '');
R('cerez', 645, 'Badem Tabağı', 'Almonds', 'Миндаль', 580, '100 g', 'n', 'vegan', '');
R('cerez', 442, 'Tuzlu Fıstık Tabağı', 'Salted Peanuts', 'Солёный арахис', 550, '100 g', 'p', 'vegan', '');
R('cerez', 773, 'Yer Fıstığı', 'Peanuts in Shell', 'Арахис в скорлупе', 550, '100 g', 'p', 'vegan', '');
R('cerez', 514, 'Mini Doritos Cips', 'Mini Doritos', 'Мини Doritos', 250, '50 g', 'm', 'veg', '');

R('meyve', 297, 'Meyve Tabağı', 'Fruit Plate', 'Фруктовая тарелка', 250, '', '', 'vegan', 'Mevsim meyveleri|Seasonal fruit|Сезонные фрукты');
R('meyve', 298, 'Duble Meyve Tabağı', 'Large Fruit Plate', 'Большая фруктовая тарелка', 450, '', '', 'vegan', 'Mevsim meyveleri, 2–3 kişilik|Seasonal fruit for 2–3 people|Сезонные фрукты на 2–3 человека');
R('meyve', 299, 'Serpme Meyve', 'Fruit Platter', 'Фруктовое ассорти', 700, '', '', 'vegan', 'Masaya serpme mevsim meyveleri, kalabalık gruplar için|Generous seasonal fruit platter for groups|Большое ассорти сезонных фруктов для компании');

R('tatli', 727, 'San Sebastian Cheesecake', 'San Sebastián Cheesecake', 'Чизкейк Сан-Себастьян', 450, '', 'g,e,m', 'popular', 'Yanık yüzlü, akışkan kıvamlı cheesecake|Burnt Basque cheesecake with a creamy centre|Баскский «жжёный» чизкейк с кремовой серединой');
R('tatli', 759, 'Tiramisu', 'Tiramisu', 'Тирамису', 420, '', 'g,e,m', '', 'Mascarpone, espresso ve kakao|Mascarpone, espresso and cocoa|Маскарпоне, эспрессо и какао');
R('tatli', 454, 'Molten Kek', 'Molten Lava Cake', 'Шоколадный фондан', 480, '', 'g,e,m', '', 'Akışkan çikolatalı sıcak kek, dondurma ile|Warm chocolate cake with a molten centre, with ice cream|Тёплый шоколадный кекс с жидкой серединой, с мороженым');
R('tatli', 510, 'Waffle', 'Waffle', 'Вафли', 650, '', 'g,e,m,n', '', 'Çikolata sos, muz, çilek ve fındık ile|With chocolate sauce, banana, strawberry and hazelnuts|С шоколадным соусом, бананом, клубникой и фундуком');
R('tatli', 333, 'Browni', 'Brownie', 'Брауни', 450, '', 'g,e,m', '', 'Yoğun çikolatalı browni|Rich chocolate brownie|Насыщенный шоколадный брауни');
R('tatli', 728, 'Lotus', 'Lotus Biscoff Cake', 'Торт Lotus', 450, '', 'g,e,m,s', '', 'Lotus bisküvili kremalı pasta|Creamy cake with Lotus Biscoff|Сливочный торт с печеньем Lotus');
R('tatli', 734, 'Limonlu Cheesecake', 'Lemon Cheesecake', 'Лимонный чизкейк', 420, '', 'g,e,m', '', '');
R('tatli', 593, 'Fıstık Rüyası', 'Pistachio Dream', 'Фисташковая мечта', 450, '', 'g,e,m,n', '', 'Antep fıstıklı kremalı pasta|Creamy cake with Antep pistachios|Сливочный торт с фисташками');
R('tatli', 452, 'Bal Ceviz Pasta (Marlenka)', 'Honey Walnut Cake (Marlenka)', 'Медовый торт «Марленка»', 420, '', 'g,e,m,n', '', '');
R('tatli', 594, 'Kremalı Havuçlu Kek', 'Carrot Cake', 'Морковный торт', 420, '', 'g,e,m,n', '', '');
R('tatli', 808, 'Kremalı Tarçınlı Kek', 'Cinnamon Cream Cake', 'Коричный торт со сливками', 420, '', 'g,e,m', '', '');
R('tatli', 635, 'Magnolia', 'Magnolia Pudding', 'Магнолия', 400, '', 'g,e,m', '', 'Bisküvi, krema ve meyveli kup tatlı|Layered cup of biscuit, cream and fruit|Десерт в стакане из печенья, крема и фруктов');
R('tatli', 688, 'Beyaz Rüya Pastası', 'White Dream Cake', 'Торт «Белая мечта»', 420, '', 'g,e,m', '', '');
R('tatli', 805, 'Latte Pasta', 'Latte Cake', 'Торт «Латте»', 400, '', 'g,e,m', '', '');
R('tatli', 789, 'Cocostar', 'Cocostar', 'Кокостар', 450, '', 'g,e,m', '', '');
R('tatli', 793, 'Cocostar Kek', 'Cocostar Cake', 'Торт «Кокостар»', 430, '', 'g,e,m', '', '');
R('tatli', 807, 'Soğuk Baklava', 'Cold Milk Baklava', 'Холодная пахлава', 520, '', 'g,m,n', 'popular', 'Sütlü şerbetli, kakaolu soğuk baklava|Chilled baklava soaked in milk syrup, dusted with cocoa|Охлаждённая пахлава с молочным сиропом и какао');
R('tatli', 857, 'Kadayıf', 'Kadayıf', 'Кадаиф', 500, '', 'g,m,n', '', 'Şerbetli tel kadayıf, fıstık ile|Shredded pastry in syrup with pistachios|Тесто-кадаиф в сиропе с фисташками');
R('tatli', 453, 'Sütlaç', 'Rice Pudding', 'Рисовый пудинг', 300, '', 'm', 'veg', 'Fırında sütlaç|Baked rice pudding|Запечённый рисовый пудинг');
R('tatli', 672, 'Fındıklı Sütlaç', 'Rice Pudding with Hazelnuts', 'Рисовый пудинг с фундуком', 340, '', 'm,n', 'veg', '');
R('tatli', 673, 'Antep Fıstıklı Sütlaç', 'Rice Pudding with Pistachios', 'Рисовый пудинг с фисташками', 350, '', 'm,n', 'veg', '');
R('tatli', 736, 'Kabak Tatlısı', 'Candied Pumpkin', 'Тыквенный десерт', 320, '', 'n,se', 'vegan', 'Tahin ve cevizli kabak tatlısı|Candied pumpkin with tahini and walnuts|Тыква в сиропе с тахини и грецкими орехами');
R('tatli', 811, 'Kahve + Tatlı Kampanyası', 'Coffee & Dessert Deal', 'Кофе + десерт (акция)', 500, '', 'g,e,m', '', 'Seçeceğiniz kahve ve günün tatlısı|A coffee of your choice with the dessert of the day|Кофе на выбор и десерт дня');
R('tatli', 817, 'Tatlı Kahve', 'Sweet Coffee Treat', 'Сладкий кофе', 450, '', 'g,e,m', '', '');

R('dondurma', 640, 'Karışık Dondurma', 'Mixed Ice Cream', 'Ассорти мороженого', 350, '3 top', 'm,n', 'veg', 'Üç top karışık dondurma, sos ile|Three mixed scoops with sauce|Три шарика ассорти с соусом');
R('dondurma', 300, 'Çikolatalı Dondurma (1 Top)', 'Chocolate Ice Cream (1 scoop)', 'Шоколадное мороженое (1 шарик)', 130, '', 'm', 'veg', '');
R('dondurma', 301, 'Vanilyalı Dondurma (1 Top)', 'Vanilla Ice Cream (1 scoop)', 'Ванильное мороженое (1 шарик)', 120, '', 'm', 'veg', '');
R('dondurma', 302, 'Antep Fıstıklı Dondurma (1 Top)', 'Pistachio Ice Cream (1 scoop)', 'Фисташковое мороженое (1 шарик)', 140, '', 'm,n', 'veg', '');
R('dondurma', 305, 'Karamelli Dondurma (1 Top)', 'Caramel Ice Cream (1 scoop)', 'Карамельное мороженое (1 шарик)', 130, '', 'm', 'veg', '');
R('dondurma', 306, 'Çilekli Dondurma (1 Top)', 'Strawberry Ice Cream (1 scoop)', 'Клубничное мороженое (1 шарик)', 110, '', 'm', 'veg', '');
R('dondurma', 304, 'Muzlu Dondurma (1 Top)', 'Banana Ice Cream (1 scoop)', 'Банановое мороженое (1 шарик)', 110, '', 'm', 'veg', '');
R('dondurma', 303, 'Limonlu Dondurma (1 Top)', 'Lemon Sorbet (1 scoop)', 'Лимонный сорбет (1 шарик)', 90, '', '', 'vegan', '');

/* ---------------- İÇECEK ---------------- */
R('soguk', 81, 'Taze Portakal Suyu', 'Fresh Orange Juice', 'Свежевыжатый апельсиновый сок', 170, '330 ml', '', 'vegan', 'Günlük sıkılmış portakal|Freshly squeezed oranges|Свежевыжатые апельсины');
R('soguk', 619, 'Vitamin Bar', 'Vitamin Bar', 'Витаминный бар', 200, '330 ml', '', 'vegan', 'Taze sıkılmış karışık meyve suyu|Freshly squeezed mixed fruit juice|Свежевыжатый фруктовый микс');
R('soguk', 804, 'Zencefil Shot', 'Ginger Shot', 'Имбирный шот', 30, '50 ml', '', 'vegan', 'Zencefil, limon ve bal|Ginger, lemon and honey|Имбирь, лимон и мёд');
R('soguk', 20, 'Limonata', 'Lemonade', 'Лимонад', 180, '400 ml', '', 'vegan', 'Ev yapımı limonata|Homemade lemonade|Домашний лимонад');
R('soguk', 631, 'Naneli Limonata', 'Mint Lemonade', 'Мятный лимонад', 180, '400 ml', '', 'vegan', '');
R('soguk', 21, 'Çilekli Limonata', 'Strawberry Lemonade', 'Клубничный лимонад', 200, '400 ml', '', 'vegan', '');
R('soguk', 624, 'Yeşil Elmalı Limonata', 'Green Apple Lemonade', 'Лимонад с зелёным яблоком', 190, '400 ml', '', 'vegan', '');
R('soguk', 22, 'Dondurmalı Limonata', 'Lemonade with Ice Cream', 'Лимонад с мороженым', 320, '400 ml', 'm', 'veg', '');
R('soguk', 455, 'Bubble Tea', 'Bubble Tea', 'Бабл ти', 300, '500 ml', 'm', 'veg', 'Meyveli çay ve patlayan boba topları|Fruit tea with popping boba pearls|Фруктовый чай с лопающимися шариками бобы');
R('soguk', 1, 'Coca-Cola', 'Coca-Cola', 'Coca-Cola', 139, '330 ml', '', 'vegan', '');
R('soguk', 2, 'Coca-Cola Zero', 'Coca-Cola Zero', 'Coca-Cola Zero', 1, '330 ml', '', 'vegan', '');
R('soguk', 3, 'Fanta', 'Fanta', 'Fanta', 125, '330 ml', '', 'vegan', '');
R('soguk', 4, 'Sprite', 'Sprite', 'Sprite', 130, '330 ml', '', 'vegan', '');
R('soguk', 25, 'Uludağ Gazoz', 'Uludağ Lemon Soda', 'Газировка Uludağ', 110, '250 ml', '', 'vegan', '');
R('soguk', 5, 'Red Bull', 'Red Bull', 'Red Bull', 110, '250 ml', '', 'vegan', '');
R('soguk', 572, 'Red Bull Organics', 'Red Bull Organics', 'Red Bull Organics', 110, '250 ml', '', 'vegan', '');
R('soguk', 6, 'Cappy Şeftali', 'Cappy Peach Juice', 'Сок Cappy персик', 110, '200 ml', '', 'vegan', '');
R('soguk', 7, 'Cappy Vişne', 'Cappy Sour Cherry Juice', 'Сок Cappy вишня', 115, '200 ml', '', 'vegan', '');
R('soguk', 8, 'Cappy Kayısı', 'Cappy Apricot Juice', 'Сок Cappy абрикос', 110, '200 ml', '', 'vegan', '');
R('soguk', 9, 'Cappy Karışık', 'Cappy Mixed Fruit Juice', 'Сок Cappy мультифрукт', 105, '200 ml', '', 'vegan', '');
R('soguk', 328, 'Cappy Portakal (1 L)', 'Cappy Orange Juice (1 L)', 'Сок Cappy апельсин (1 л)', 450, '1 L', '', 'vegan', '');
R('soguk', 330, 'Cappy Ananas (1 L)', 'Cappy Pineapple Juice (1 L)', 'Сок Cappy ананас (1 л)', 500, '1 L', '', 'vegan', '');
R('soguk', 561, 'Cappy Vişne (1 L)', 'Cappy Sour Cherry Juice (1 L)', 'Сок Cappy вишня (1 л)', 560, '1 L', '', 'vegan', '');
R('soguk', 562, 'Cappy Elma (1 L)', 'Cappy Apple Juice (1 L)', 'Сок Cappy яблоко (1 л)', 460, '1 L', '', 'vegan', '');
R('soguk', 856, 'Ananas Suyu', 'Pineapple Juice', 'Ананасовый сок', 130, '250 ml', '', 'vegan', '');
R('soguk', 10, 'Fuse Tea Şeftali', 'Fuse Tea Peach', 'Fuse Tea персик', 90, '330 ml', '', 'vegan', '');
R('soguk', 11, 'Fuse Tea Limon', 'Fuse Tea Lemon', 'Fuse Tea лимон', 90, '330 ml', '', 'vegan', '');
R('soguk', 12, 'Fuse Tea Mango Ananas', 'Fuse Tea Mango Pineapple', 'Fuse Tea манго-ананас', 90, '330 ml', '', 'vegan', '');
R('soguk', 14, 'Fuse Tea Karpuz', 'Fuse Tea Watermelon', 'Fuse Tea арбуз', 90, '330 ml', '', 'vegan', '');
R('soguk', 29, 'Su', 'Still Water', 'Вода', 0, '500 ml', '', 'vegan', '');
R('soguk', 555, 'Büyük Su', 'Large Still Water', 'Большая вода', 0, '1.5 L', '', 'vegan', '');
R('soguk', 15, 'Soda', 'Sparkling Mineral Water', 'Минеральная вода', 0, '200 ml', '', 'vegan', '');
R('soguk', 16, 'Meyveli Soda Limon', 'Lemon Flavoured Soda', 'Минералка со вкусом лимона', 50, '200 ml', '', 'vegan', '');
R('soguk', 17, 'Meyveli Soda Elma', 'Apple Flavoured Soda', 'Минералка со вкусом яблока', 50, '200 ml', '', 'vegan', '');
R('soguk', 18, 'Meyveli Soda Nar', 'Pomegranate Flavoured Soda', 'Минералка со вкусом граната', 50, '200 ml', '', 'vegan', '');
R('soguk', 19, 'Meyveli Soda Karpuz Çilek', 'Watermelon-Strawberry Soda', 'Минералка арбуз-клубника', 50, '200 ml', '', 'vegan', '');
R('soguk', 28, 'Churchill', 'Churchill', 'Черчилль', 15, '300 ml', '', 'vegan', 'Soda, taze limon ve tuz|Sparkling water, fresh lemon and salt|Минеральная вода, свежий лимон и соль');
R('soguk', 26, 'Ayran', 'Ayran (Yogurt Drink)', 'Айран', 90, '250 ml', 'm', 'veg', '');
R('soguk', 27, 'Naneli Ayran', 'Mint Ayran', 'Айран с мятой', 95, '250 ml', 'm', 'veg', '');
R('soguk', 626, 'Şalgam', 'Turnip Juice (Şalgam)', 'Шалгам', 20, '300 ml', '', 'vegan,spicy', 'Acılı ya da acısız|Spicy or mild|Острый или неострый');
R('soguk', 625, 'Şalgam (1 L)', 'Turnip Juice (1 L)', 'Шалгам (1 л)', 60, '1 L', '', 'vegan', '');
R('soguk', 571, 'Schweppes Tonik', 'Schweppes Tonic', 'Тоник Schweppes', 90, '250 ml', '', 'vegan', '');
R('soguk', 557, 'Schweppes Tonik (1 L)', 'Schweppes Tonic (1 L)', 'Тоник Schweppes (1 л)', 340, '1 L', '', 'vegan', '');

R('cay', 43, 'Çay', 'Turkish Tea', 'Турецкий чай', 2, '', '', 'vegan', 'İnce belli bardakta demlik çay|Brewed black tea in a traditional tulip glass|Заварной чёрный чай в традиционном стаканчике');
R('cay', 44, 'Fincan Çay', 'Tea (Cup)', 'Чай (чашка)', 4, '', '', 'vegan', '');
R('cay', 642, 'Ballı Çay', 'Tea with Honey', 'Чай с мёдом', 60, '', '', 'veg', '');
R('cay', 613, 'Atom Çayı', 'Atom Tea', 'Чай «Атом»', 10, '', '', 'vegan', 'Zencefil, tarçın, karanfil ve bitki karışımı|Blend of ginger, cinnamon, clove and herbs|Смесь имбиря, корицы, гвоздики и трав');
R('cay', 52, 'Roof Kış Çayı', 'Roof Winter Tea', 'Зимний чай Roof', 40, '', '', 'vegan,chef', 'Roof’un imza kış çayı karışımı|Roof’s signature winter tea blend|Фирменный зимний чай Roof');
R('cay', 51, 'Kış Çayı', 'Winter Tea', 'Зимний чай', 40, '', '', 'vegan', 'Kuşburnu, ıhlamur, tarçın ve karanfil|Rosehip, linden, cinnamon and clove|Шиповник, липа, корица и гвоздика');
R('cay', 50, 'Yeşil Çay', 'Green Tea', 'Зелёный чай', 2, '', '', 'vegan', '');
R('cay', 45, 'Nane Limon', 'Mint & Lemon Tea', 'Чай с мятой и лимоном', 5, '', '', 'vegan', '');
R('cay', 46, 'Ihlamur', 'Linden Tea', 'Липовый чай', 5, '', '', 'vegan', '');
R('cay', 47, 'Ada Çayı', 'Sage Tea', 'Шалфейный чай', 5, '', '', 'vegan', '');
R('cay', 809, 'Bitki Çayı', 'Herbal Tea', 'Травяной чай', 5, '', '', 'vegan', '');
R('cay', [['normal', 48], ['duble', 450]], 'Kuşburnu', 'Rosehip Tea', 'Чай из шиповника', 10, '', '', 'vegan', '');
R('cay', [['normal', 49], ['duble', 449]], 'Elma Çayı', 'Apple Tea', 'Яблочный чай', 70, '', '', 'vegan', '');
R('cay', [['normal', 53], ['duble', 448]], 'Kivi Çayı', 'Kiwi Tea', 'Чай с киви', 70, '', '', 'vegan', '');
R('cay', [['normal', 54], ['duble', 451]], 'Oralet', 'Oralet (Orange Instant Tea)', 'Оралет (апельсиновый чай)', 70, '', '', 'vegan', '');
R('cay', 456, 'Sahlep', 'Salep', 'Салеп', 280, '250 ml', 'm', 'veg', 'Sıcak sütlü sahlep, tarçın ile|Hot milky salep with cinnamon|Горячий молочный салеп с корицей');
R('cay', 457, 'Ballı Süt', 'Milk with Honey', 'Молоко с мёдом', 220, '250 ml', 'm', 'veg', '');
R('cay', 537, 'Sıcak Çikolata', 'Hot Chocolate', 'Горячий шоколад', 340, '250 ml', 'm', 'veg', '');
R('cay', 69, 'Fındıklı Sıcak Çikolata', 'Hot Chocolate with Hazelnut', 'Горячий шоколад с фундуком', 380, '250 ml', 'm,n', 'veg', '');
R('cay', 459, 'Sıcak Beyaz Çikolata', 'Hot White Chocolate', 'Горячий белый шоколад', 360, '250 ml', 'm', 'veg', '');
R('cay', 70, 'Çilekli Sıcak Beyaz Çikolata', 'Hot White Chocolate with Strawberry', 'Горячий белый шоколад с клубникой', 380, '250 ml', 'm', 'veg', '');
R('cay', 71, 'Muzlu Sıcak Beyaz Çikolata', 'Hot White Chocolate with Banana', 'Горячий белый шоколад с бананом', 380, '250 ml', 'm', 'veg', '');
R('cay', 353, 'Bal (Porsiyon)', 'Honey (Portion)', 'Мёд (порция)', 45, '15 g', '', 'veg', '');

R('turkkahve', [['tek', 55], ['duble', 523]], 'Türk Kahvesi', 'Turkish Coffee', 'Турецкий кофе', 10, '', '', 'vegan,popular', 'Sade, az şekerli, orta veya şekerli; lokum ile|Plain, little sugar, medium or sweet; served with Turkish delight|Без сахара, мало, средне или сладкий; подаётся с лукумом');
R('turkkahve', [['tek', 58], ['duble', 527]], 'Damla Sakızlı Türk Kahvesi', 'Mastic Turkish Coffee', 'Турецкий кофе с мастикой', 10, '', '', 'vegan', 'Sakız aromalı Türk kahvesi; şeker tercihine göre|Turkish coffee with mastic; sweetness to your taste|Турецкий кофе с мастикой; сладость на выбор');
R('turkkahve', [['tek', 60], ['duble', 531]], 'Menengiç Kahvesi', 'Menengiç (Terebinth) Coffee', 'Кофе менгенич', 90, '', 'm', 'veg', 'Kafeinsiz, sütle pişen yabani fıstık kahvesi|Caffeine-free terebinth coffee cooked with milk|Кофе без кофеина из фисташки теребинт на молоке');
R('turkkahve', 59, 'Dibek Osmanlı Kahvesi', 'Ottoman Dibek Coffee', 'Османский кофе «Дибек»', 40, '', 'm', 'veg', 'Taş dibekte dövülmüş, yumuşak içimli kahve|Stone-ground, smooth Ottoman-style coffee|Мягкий кофе из жерновой ступки по-османски');
R('turkkahve', 341, 'Kahve Çikolatası (Adet)', 'Coffee Chocolate (Piece)', 'Шоколадка к кофе (шт.)', 50, '10 g', 'm,s', 'veg', '');

R('kahve', [['tek', 63], ['duble', 64]], 'Espresso', 'Espresso', 'Эспрессо', 3, '', '', 'vegan', '');
R('kahve', 73, 'Americano', 'Americano', 'Американо', 10, '300 ml', '', 'vegan', '');
R('kahve', 66, 'Cappuccino', 'Cappuccino', 'Капучино', 130, '250 ml', 'm', 'veg', '');
R('kahve', 65, 'Latte', 'Caffè Latte', 'Латте', 180, '300 ml', 'm', 'veg', '');
R('kahve', 67, 'Mocha', 'Mocha', 'Мокко', 290, '300 ml', 'm', 'veg', '');
R('kahve', 68, 'White Mocha', 'White Mocha', 'Белый мокко', 330, '300 ml', 'm', 'veg', '');
R('kahve', 72, 'Filtre Kahve', 'Filter Coffee', 'Фильтр-кофе', 5, '300 ml', '', 'vegan', '');
R('kahve', 61, 'Nescafé', 'Instant Coffee', 'Растворимый кофе', 5, '', '', 'vegan', '');
R('kahve', 62, 'Sütlü Nescafé', 'Instant Coffee with Milk', 'Растворимый кофе с молоком', 70, '', 'm', 'veg', '');

R('sogukkahve', 36, 'Ice Americano', 'Iced Americano', 'Айс американо', 10, '400 ml', '', 'vegan', '');
R('sogukkahve', 37, 'Ice Latte', 'Iced Latte', 'Айс латте', 150, '400 ml', 'm', 'veg', '');
R('sogukkahve', 38, 'Dondurmalı Ice Latte', 'Iced Latte with Ice Cream', 'Айс латте с мороженым', 280, '400 ml', 'm', 'veg', '');
R('sogukkahve', 34, 'Ice Mocha', 'Iced Mocha', 'Айс мокко', 280, '400 ml', 'm', 'veg', '');
R('sogukkahve', 35, 'Ice White Mocha', 'Iced White Mocha', 'Айс белый мокко', 320, '400 ml', 'm', 'veg', '');
R('sogukkahve', 39, 'Ice Chocolate', 'Iced Chocolate', 'Айс шоколад', 300, '400 ml', 'm', 'veg', '');
R('sogukkahve', 40, 'Ice White Chocolate', 'Iced White Chocolate', 'Айс белый шоколад', 330, '400 ml', 'm', 'veg', '');
R('sogukkahve', 41, 'Brownili Ice Chocolate', 'Iced Chocolate with Brownie', 'Айс шоколад с брауни', 450, '400 ml', 'g,e,m', 'veg', '');
R('sogukkahve', 42, 'Ice Cocostar', 'Iced Cocostar', 'Айс кокостар', 400, '400 ml', 'm', 'veg', '');
R('sogukkahve', 30, 'Frappe Karamel', 'Caramel Frappé', 'Фраппе карамель', 350, '400 ml', 'm', 'veg', '');
R('sogukkahve', 31, 'Frappe Çikolata', 'Chocolate Frappé', 'Фраппе шоколад', 350, '400 ml', 'm', 'veg', '');
R('sogukkahve', 32, 'Frappe Vanilya', 'Vanilla Frappé', 'Фраппе ваниль', 340, '400 ml', 'm', 'veg', '');
R('sogukkahve', 33, 'Frappe Muz', 'Banana Frappé', 'Фраппе банан', 340, '400 ml', 'm', 'veg', '');
R('sogukkahve', 621, 'Dondurmalı Frappe', 'Frappé with Ice Cream', 'Фраппе с мороженым', 420, '400 ml', 'm', 'veg', '');
R('sogukkahve', 729, 'Lotus Frappe', 'Lotus Biscoff Frappé', 'Фраппе Lotus', 450, '400 ml', 'g,m,s', 'veg,popular', '');

R('milkshake', 80, 'Roofshake', 'Roofshake', 'Roofshake', 520, '400 ml', 'm', 'veg,chef', 'Roof’un imza milkshake’i|Roof’s signature milkshake|Фирменный милкшейк Roof');
R('milkshake', 722, 'Roof Bomba', 'Roof Bomb', 'Roof Бомба', 600, '400 ml', 'g,m,n', 'veg,chef', '');
R('milkshake', 79, 'Antep Fıstıklı Atom Milkshake', 'Pistachio Atom Milkshake', 'Атом-милкшейк с фисташкой', 600, '400 ml', 'm,n', 'veg', '');
R('milkshake', 721, 'Çikolatalı Atom Milkshake', 'Chocolate Atom Milkshake', 'Атом-милкшейк шоколадный', 600, '400 ml', 'm', 'veg', '');
R('milkshake', 74, 'Çilekli Milkshake', 'Strawberry Milkshake', 'Клубничный милкшейк', 450, '400 ml', 'm', 'veg', '');
R('milkshake', 75, 'Çikolatalı Milkshake', 'Chocolate Milkshake', 'Шоколадный милкшейк', 500, '400 ml', 'm', 'veg', '');
R('milkshake', 76, 'Vanilyalı Milkshake', 'Vanilla Milkshake', 'Ванильный милкшейк', 460, '400 ml', 'm', 'veg', '');
R('milkshake', 77, 'Muzlu Milkshake', 'Banana Milkshake', 'Банановый милкшейк', 470, '400 ml', 'm', 'veg', '');
R('milkshake', 78, 'Karamelli Milkshake', 'Caramel Milkshake', 'Карамельный милкшейк', 500, '400 ml', 'm', 'veg', '');
R('milkshake', 405, 'Oreolu Milkshake', 'Oreo Milkshake', 'Милкшейк с Oreo', 550, '400 ml', 'g,m,s', 'veg', '');

R('frozen', 90, 'Roof Frozen', 'Roof Frozen', 'Roof фрозен', 230, '400 ml', '', 'vegan,chef', 'Roof’un imza meyveli frozen’ı|Roof’s signature fruit frozen|Фирменный фруктовый фрозен Roof');
R('frozen', 89, 'Mango Frozen', 'Mango Frozen', 'Фрозен манго', 220, '400 ml', '', 'vegan', '');
R('frozen', 85, 'Çilek Frozen', 'Strawberry Frozen', 'Фрозен клубника', 210, '400 ml', '', 'vegan', '');
R('frozen', 84, 'Kivi Frozen', 'Kiwi Frozen', 'Фрозен киви', 210, '400 ml', '', 'vegan', '');
R('frozen', 86, 'Karpuz Frozen', 'Watermelon Frozen', 'Фрозен арбуз', 190, '400 ml', '', 'vegan', '');
R('frozen', 87, 'Kavun Frozen', 'Melon Frozen', 'Фрозен дыня', 190, '400 ml', '', 'vegan', '');
R('frozen', 88, 'Nane Limon Frozen', 'Mint Lemon Frozen', 'Фрозен мята-лимон', 200, '400 ml', '', 'vegan', '');
R('frozen', 641, 'Karamelli Frozen', 'Caramel Frozen', 'Карамельный фрозен', 280, '400 ml', 'm', 'veg', '');

R('mocktail', 99, 'Roof Special (Alkolsüz)', 'Roof Special (Non-Alcoholic)', 'Roof Special (б/а)', 180, '400 ml', '', 'vegan,chef', '');
R('mocktail', 91, 'Mojito (Alkolsüz)', 'Virgin Mojito', 'Мохито (б/а)', 120, '400 ml', '', 'vegan', 'Lime, taze nane, esmer şeker ve soda|Lime, fresh mint, brown sugar and soda|Лайм, свежая мята, тростниковый сахар и содовая');
R('mocktail', 92, 'Red Bull Mojito (Alkolsüz)', 'Red Bull Virgin Mojito', 'Мохито с Red Bull (б/а)', 180, '400 ml', '', 'vegan', 'Lime, taze nane ve Red Bull|Lime, fresh mint and Red Bull|Лайм, свежая мята и Red Bull');
R('mocktail', 93, 'Piña Colada (Alkolsüz)', 'Virgin Piña Colada', 'Пина колада (б/а)', 250, '400 ml', '', 'vegan', 'Ananas ve hindistan cevizi kreması|Pineapple and coconut cream|Ананас и кокосовые сливки');
R('mocktail', 94, 'Sex on the Beach (Alkolsüz)', 'Virgin Sex on the Beach', 'Секс он зе бич (б/а)', 170, '400 ml', '', 'vegan', 'Şeftali, portakal ve kızılcık|Peach, orange and cranberry|Персик, апельсин и клюква');
R('mocktail', 95, 'Tequila Sunrise (Alkolsüz)', 'Virgin Sunrise', 'Санрайз (б/а)', 160, '400 ml', '', 'vegan', 'Portakal suyu ve grenadin|Orange juice and grenadine|Апельсиновый сок и гренадин');
R('mocktail', 96, 'Green Taste (Alkolsüz)', 'Green Taste (Non-Alcoholic)', 'Green Taste (б/а)', 170, '400 ml', '', 'vegan', '');
R('mocktail', 97, 'Blue Hawaii (Alkolsüz)', 'Virgin Blue Hawaii', 'Блю Гавайи (б/а)', 200, '400 ml', '', 'vegan', 'Blue curaçao şurubu, ananas ve hindistan cevizi|Blue curaçao syrup, pineapple and coconut|Сироп блю кюрасао, ананас и кокос');
R('mocktail', 98, 'Strawberry Daiquiri (Alkolsüz)', 'Virgin Strawberry Daiquiri', 'Клубничный дайкири (б/а)', 160, '400 ml', '', 'vegan', 'Çilek, lime ve buz|Strawberry, lime and crushed ice|Клубника, лайм и колотый лёд');

/* ---------------- BAR ---------------- */
R('kokteyl', 117, 'Mystery of Roof', 'Mystery of Roof', 'Mystery of Roof', 260, '', '', 'alc,chef', 'Roof’un gizemli imza kokteyli – barmeninize sorun|Roof’s mysterious signature cocktail – ask your bartender|Загадочный фирменный коктейль Roof – спросите бармена');
R('kokteyl', 855, 'Barmen Special', 'Bartender’s Special', 'Спешл от бармена', 250, '', '', 'alc,chef', 'Barmenin damak zevkinize göre hazırladığı özel kokteyl|A bespoke cocktail made to your taste by our bartender|Индивидуальный коктейль от бармена под ваш вкус');
R('kokteyl', 100, 'Aperol Spritz', 'Aperol Spritz', 'Апероль шприц', 170, '', 'su', 'alc,popular', 'Aperol, prosecco ve soda|Aperol, prosecco and soda|Апероль, просекко и содовая');
R('kokteyl', 106, 'Mojito', 'Mojito', 'Мохито', 200, '', '', 'alc,popular', 'Beyaz rom, lime, taze nane, esmer şeker ve soda|White rum, lime, fresh mint, brown sugar and soda|Белый ром, лайм, свежая мята, тростниковый сахар и содовая');
R('kokteyl', 101, 'Long Island Ice Tea', 'Long Island Iced Tea', 'Лонг-Айленд', 280, '', '', 'alc', 'Votka, cin, rom, tekila, triple sec, limon ve kola|Vodka, gin, rum, tequila, triple sec, lemon and cola|Водка, джин, ром, текила, трипл-сек, лимон и кола');
R('kokteyl', 379, 'Long Island (Coca-Cola)', 'Long Island (Coca-Cola)', 'Лонг-Айленд (Coca-Cola)', 290, '', '', 'alc', '');
R('kokteyl', 102, 'Piña Colada', 'Piña Colada', 'Пина колада', 300, '', '', 'alc', 'Rom, hindistan cevizi kreması ve ananas|Rum, coconut cream and pineapple|Ром, кокосовые сливки и ананас');
R('kokteyl', 103, 'Sex on the Beach', 'Sex on the Beach', 'Секс он зе бич', 230, '', '', 'alc', 'Votka, şeftali likörü, portakal ve kızılcık|Vodka, peach liqueur, orange and cranberry|Водка, персиковый ликёр, апельсин и клюква');
R('kokteyl', 104, 'Tequila Sunrise', 'Tequila Sunrise', 'Текила санрайз', 230, '', '', 'alc', 'Tekila, portakal suyu ve grenadin|Tequila, orange juice and grenadine|Текила, апельсиновый сок и гренадин');
R('kokteyl', 105, 'Strawberry Daiquiri', 'Strawberry Daiquiri', 'Клубничный дайкири', 220, '', '', 'alc', 'Rom, çilek ve lime|Rum, strawberry and lime|Ром, клубника и лайм');
R('kokteyl', 107, 'Blue Hawaii', 'Blue Hawaii', 'Блю Гавайи', 280, '', '', 'alc', 'Rom, blue curaçao, ananas ve hindistan cevizi|Rum, blue curaçao, pineapple and coconut|Ром, блю кюрасао, ананас и кокос');
R('kokteyl', 112, 'Espresso Martini', 'Espresso Martini', 'Эспрессо мартини', 220, '', '', 'alc', 'Votka, kahve likörü ve taze espresso|Vodka, coffee liqueur and fresh espresso|Водка, кофейный ликёр и свежий эспрессо');
R('kokteyl', 813, 'Pornstar Martini', 'Pornstar Martini', 'Порнстар мартини', 230, '', '', 'alc', 'Vanilyalı votka, çarkıfelek meyvesi ve prosecco|Vanilla vodka, passion fruit and prosecco|Ванильная водка, маракуйя и просекко');
R('kokteyl', 110, 'Whiskey Sour', 'Whiskey Sour', 'Виски сауэр', 200, '', 'e', 'alc', 'Burbon, taze limon, şeker ve yumurta beyazı|Bourbon, fresh lemon, sugar and egg white|Бурбон, свежий лимон, сахар и яичный белок');
R('kokteyl', 111, 'Grapefruit Margarita', 'Grapefruit Margarita', 'Грейпфрутовая маргарита', 210, '', '', 'alc', 'Tekila, triple sec, greyfurt ve lime|Tequila, triple sec, grapefruit and lime|Текила, трипл-сек, грейпфрут и лайм');
R('kokteyl', 115, 'Martini Dry', 'Dry Martini', 'Драй мартини', 180, '', 'su', 'alc', 'Cin ve kuru vermut, zeytin ile|Gin and dry vermouth with an olive|Джин и сухой вермут с оливкой');
R('kokteyl', 114, 'Votka Collins', 'Vodka Collins', 'Водка коллинз', 170, '', '', 'alc', 'Votka, limon, şeker ve soda|Vodka, lemon, sugar and soda|Водка, лимон, сахар и содовая');
R('kokteyl', 108, 'Billy the Kid', 'Billy the Kid', 'Билли Кид', 220, '', '', 'alc', '');
R('kokteyl', 109, 'Mandarin Fizz', 'Mandarin Fizz', 'Мандарин физз', 200, '', '', 'alc', '');
R('kokteyl', 113, 'Jäger Monster', 'Jäger Monster', 'Егерь Монстр', 250, '', '', 'alc', '');
R('kokteyl', 116, 'Green Taste', 'Green Taste', 'Green Taste', 210, '', '', 'alc', '');
R('kokteyl', 814, 'İnfüze Cin', 'Infused Gin', 'Настоянный джин', 180, '', '', 'alc', 'Ev yapımı meyve-bitki infüzyonlu cin|House-infused gin with fruit and botanicals|Джин, настоянный на фруктах и травах');
R('kokteyl', 815, 'İnfüze Votka', 'Infused Vodka', 'Настоянная водка', 180, '', '', 'alc', 'Ev yapımı meyve infüzyonlu votka|House-infused fruit vodka|Водка, настоянная на фруктах');
R('kokteyl', 816, 'Vanilya İnfüze', 'Vanilla Infusion', 'Ванильная настойка', 190, '', '', 'alc', '');
R('kokteyl', 828, 'Viski İnfüze', 'Infused Whisky', 'Настоянный виски', 190, '', '', 'alc', '');

R('alkahve', 146, 'Baileys Coffee', 'Baileys Coffee', 'Кофе с Baileys', 250, '', 'm', 'alc', 'Sıcak kahve, Baileys ve krema|Hot coffee, Baileys and cream|Горячий кофе, Baileys и сливки');
R('alkahve', 147, 'Irish Coffee', 'Irish Coffee', 'Ирландский кофе', 230, '', 'm', 'alc', 'Sıcak kahve, İrlanda viskisi, esmer şeker ve krema|Hot coffee, Irish whiskey, brown sugar and cream|Горячий кофе, ирландский виски, тростниковый сахар и сливки');

const beerKcal = 210;
R('bira', [['50 cl', 118], ['kova', 820]], 'Efes Pilsen', 'Efes Pilsen', 'Efes Pilsen', beerKcal, '50 cl', 'g', 'alc', '');
R('bira', 119, 'Efes Malt', 'Efes Malt', 'Efes Malt', 220, '50 cl', 'g', 'alc', '');
R('bira', [['50 cl', 120], ['kova', 819]], 'Tuborg Gold', 'Tuborg Gold', 'Tuborg Gold', 215, '50 cl', 'g', 'alc', '');
R('bira', [['50 cl', 758], ['kova', 818]], 'Carlsberg', 'Carlsberg', 'Carlsberg', 210, '50 cl', 'g', 'alc', '');
R('bira', [['50 cl', 121], ['kova', 824]], 'Bomonti Filtresiz', 'Bomonti Unfiltered', 'Bomonti нефильтрованное', 220, '50 cl', 'g', 'alc', '');
R('bira', 125, 'Heineken', 'Heineken', 'Heineken', 140, '33 cl', 'g', 'alc', '');
R('bira', [['33 cl', 126], ['kova', 822]], 'Blanc', 'Blanc', 'Blanc', 150, '33 cl', 'g', 'alc', '');
R('bira', [['33 cl', 127], ['kova', 826]], 'Corona', 'Corona', 'Corona', 150, '33 cl', 'g', 'alc', '');
R('bira', [['33 cl', 538], ['kova', 823]], 'Miller', 'Miller', 'Miller', 140, '33 cl', 'g', 'alc', '');
R('bira', 539, "Beck's", "Beck's", "Beck's", 140, '33 cl', 'g', 'alc', '');
R('bira', 123, 'Guinness', 'Guinness', 'Guinness', 180, '44 cl', 'g', 'alc', '');
R('bira', 128, 'Weihenstephaner', 'Weihenstephaner', 'Weihenstephaner', 160, '33 cl', 'g', 'alc', '');
R('bira', 129, 'Weihenstephaner Vitus', 'Weihenstephaner Vitus', 'Weihenstephaner Vitus', 250, '33 cl', 'g', 'alc', '');
R('bira', 827, 'Mix Kova', 'Mixed Beer Bucket', 'Ведро пива ассорти', 750, '', 'g', 'alc', '5 adet karışık bira|5 assorted beers|5 бутылок пива ассорти');
R('bira', 843, 'Peja Alkolsüz', 'Peja Non-Alcoholic', 'Peja безалкогольное', 70, '33 cl', 'g', '', '');

R('shot', 130, 'Tekila', 'Tequila', 'Текила', 100, '4 cl', '', 'alc', 'Tuz ve limon ile|With salt and lime|С солью и лаймом');
R('shot', 131, 'Jägermeister', 'Jägermeister', 'Егермейстер', 105, '4 cl', '', 'alc', '');
R('shot', 132, 'B-52', 'B-52', 'B-52', 150, '4 cl', 'm', 'alc', 'Kahve likörü, Baileys ve Grand Marnier|Coffee liqueur, Baileys and Grand Marnier|Кофейный ликёр, Baileys и Grand Marnier');
R('shot', 622, 'Smirnoff Votka Shot', 'Smirnoff Vodka Shot', 'Шот водки Smirnoff', 95, '4 cl', '', 'alc', '');

const tk = 'kadeh', tkA = 'alc';
R(tk, [['tek', 545], ['duble', 134]], "Jack Daniel's", "Jack Daniel's", "Jack Daniel's", 100, '4 / 8 cl', '', tkA, '');
R(tk, [['tek', 135], ['duble', 577]], 'Chivas Regal 12', 'Chivas Regal 12', 'Chivas Regal 12', 100, '4 / 8 cl', '', tkA, '');
R(tk, [['tek', 831], ['duble', 832]], 'Chivas Regal 18', 'Chivas Regal 18', 'Chivas Regal 18', 100, '4 / 8 cl', '', tkA, '');
R(tk, [['tek', 136], ['duble', 578]], 'J.W. Black Label', 'J.W. Black Label', 'J.W. Black Label', 100, '4 / 8 cl', '', tkA, '');
R(tk, [['tek', 579], ['duble', 137]], 'J.W. Red Label', 'J.W. Red Label', 'J.W. Red Label', 100, '4 / 8 cl', '', tkA, '');
R(tk, 585, 'Jack Honey (Duble)', 'Jack Honey (Double)', 'Jack Honey (двойной)', 230, '8 cl', '', tkA, '');
R(tk, 584, 'Jack Apple (Duble)', 'Jack Apple (Double)', 'Jack Apple (двойной)', 230, '8 cl', '', tkA, '');
R(tk, 586, 'Jack Fire (Duble)', 'Jack Fire (Double)', 'Jack Fire (двойной)', 230, '8 cl', '', tkA, '');
R(tk, [['tek', 138], ['duble', 139]], 'Yeni Rakı', 'Yeni Rakı', 'Yeni Rakı', 115, '4 / 8 cl', '', tkA, 'Su, buz ve beyaz peynir ile|With water, ice and white cheese|С водой, льдом и белым сыром');
R(tk, 587, 'Beylerbeyi (Duble)', 'Beylerbeyi Rakı (Double)', 'Ракы Beylerbeyi (двойной)', 230, '8 cl', '', tkA, '');
R(tk, [['tek', 719], ['duble', 140]], 'Smirnoff Votka', 'Smirnoff Vodka', 'Водка Smirnoff', 95, '4 / 8 cl', '', tkA, '');
R(tk, [['tek', 720], ['duble', 581]], 'Absolut Votka', 'Absolut Vodka', 'Водка Absolut', 95, '4 / 8 cl', '', tkA, '');
R(tk, 643, 'Belvedere (Duble)', 'Belvedere (Double)', 'Belvedere (двойной)', 190, '8 cl', '', tkA, '');
R(tk, 628, 'Smirnoff Votkabull', 'Smirnoff Vodka Red Bull', 'Водка Smirnoff с Red Bull', 300, '', '', tkA, 'Duble Smirnoff votka ve Red Bull|Double Smirnoff vodka with Red Bull|Двойная водка Smirnoff с Red Bull');
R(tk, [['tek', 740], ['duble', 141]], "Gordon's Gin", "Gordon's Gin", "Джин Gordon's", 95, '4 / 8 cl', '', tkA, '');
R(tk, 620, "Gordon's Cin Tonik (Duble)", "Gordon's Gin & Tonic (Double)", "Джин-тоник Gordon's (двойной)", 280, '', '', tkA, '');
R(tk, [['tek', 684], ['duble', 683]], "Hendrick's Gin", "Hendrick's Gin", "Джин Hendrick's", 100, '4 / 8 cl', '', tkA, '');
R(tk, 580, 'Tanqueray Gin (Duble)', 'Tanqueray Gin (Double)', 'Джин Tanqueray (двойной)', 190, '8 cl', '', tkA, '');
R(tk, 583, 'Beefeater Gin (Duble)', 'Beefeater Gin (Double)', 'Джин Beefeater (двойной)', 190, '8 cl', '', tkA, '');
R(tk, 576, 'Captain Morgan (Duble)', 'Captain Morgan (Double)', 'Captain Morgan (двойной)', 190, '8 cl', '', tkA, '');
R(tk, 582, 'Jägermeister (Duble)', 'Jägermeister (Double)', 'Егермейстер (двойной)', 210, '8 cl', '', tkA, '');
R(tk, 142, 'Baileys (Duble)', 'Baileys (Double)', 'Baileys (двойной)', 260, '8 cl', 'm', tkA, '');

R('sarap', 144, 'Kırmızı Şarap (Kadeh)', 'Red Wine (Glass)', 'Красное вино (бокал)', 125, '150 ml', 'su', 'alc', '');
R('sarap', 143, 'Beyaz Şarap (Kadeh)', 'White Wine (Glass)', 'Белое вино (бокал)', 120, '150 ml', 'su', 'alc', '');
R('sarap', 145, 'Roze Şarap (Kadeh)', 'Rosé Wine (Glass)', 'Розовое вино (бокал)', 120, '150 ml', 'su', 'alc', '');
R('sarap', 836, 'Şampanya', 'Champagne', 'Шампанское', 120, '150 ml', 'su', 'alc', 'Şişe|Bottle|Бутылка');
R('sarap', 235, 'Kavaklıdere Selection Kırmızı', 'Kavaklıdere Selection Red', 'Kavaklıdere Selection красное', 125, '150 ml', 'su', 'alc', 'Şişe, 75 cl|Bottle, 75 cl|Бутылка, 75 сл');
R('sarap', 236, 'Kavaklıdere Selection Beyaz', 'Kavaklıdere Selection White', 'Kavaklıdere Selection белое', 120, '150 ml', 'su', 'alc', 'Şişe, 75 cl|Bottle, 75 cl|Бутылка, 75 сл');
R('sarap', 237, 'Kavaklıdere Selection Roze', 'Kavaklıdere Selection Rosé', 'Kavaklıdere Selection розовое', 120, '150 ml', 'su', 'alc', 'Şişe, 75 cl|Bottle, 75 cl|Бутылка, 75 сл');
R('sarap', 407, 'Angora Kırmızı', 'Angora Red', 'Angora красное', 125, '150 ml', 'su', 'alc', 'Şişe, 75 cl|Bottle, 75 cl|Бутылка, 75 сл');
R('sarap', 409, 'Angora Beyaz', 'Angora White', 'Angora белое', 120, '150 ml', 'su', 'alc', 'Şişe, 75 cl|Bottle, 75 cl|Бутылка, 75 сл');
R('sarap', 408, 'Angora Roze', 'Angora Rosé', 'Angora розовое', 120, '150 ml', 'su', 'alc', 'Şişe, 75 cl|Bottle, 75 cl|Бутылка, 75 сл');
R('sarap', 549, 'Egeo Kırmızı', 'Egeo Red', 'Egeo красное', 125, '150 ml', 'su', 'alc', 'Şişe, 75 cl|Bottle, 75 cl|Бутылка, 75 сл');
R('sarap', 550, 'Egeo Beyaz', 'Egeo White', 'Egeo белое', 120, '150 ml', 'su', 'alc', 'Şişe, 75 cl|Bottle, 75 cl|Бутылка, 75 сл');
R('sarap', 551, 'Egeo Roze', 'Egeo Rosé', 'Egeo розовое', 120, '150 ml', 'su', 'alc', 'Şişe, 75 cl|Bottle, 75 cl|Бутылка, 75 сл');
R('sarap', 552, 'Kavaklıdere Yakut', 'Kavaklıdere Yakut', 'Kavaklıdere Yakut', 125, '150 ml', 'su', 'alc', 'Şişe, 75 cl|Bottle, 75 cl|Бутылка, 75 сл');
R('sarap', 553, 'Kavaklıdere Lal', 'Kavaklıdere Lal', 'Kavaklıdere Lal', 120, '150 ml', 'su', 'alc', 'Şişe, 75 cl|Bottle, 75 cl|Бутылка, 75 сл');

const sz = (...pairs) => pairs.map(([s, id]) => [s + ' cl', id]);
R('viski', sz([35, 148], [50, 149], [70, 150], [100, 151]), 'J.W. Black Label', 'J.W. Black Label', 'J.W. Black Label', 100, '4 cl', '', 'alc', '');
R('viski', sz([35, 152], [50, 153], [70, 154], [100, 155]), 'J.W. Red Label', 'J.W. Red Label', 'J.W. Red Label', 100, '4 cl', '', 'alc', '');
R('viski', sz([70, 158]), 'J.W. Blue Label', 'J.W. Blue Label', 'J.W. Blue Label', 100, '4 cl', '', 'alc', '');
R('viski', sz([35, 160], [50, 161], [70, 162], [100, 163]), 'Chivas Regal 12', 'Chivas Regal 12', 'Chivas Regal 12', 100, '4 cl', '', 'alc', '');
R('viski', sz([70, 166]), 'Chivas Regal 18', 'Chivas Regal 18', 'Chivas Regal 18', 100, '4 cl', '', 'alc', '');
R('viski', sz([35, 171], [50, 172], [70, 173], [100, 174]), "Jack Daniel's", "Jack Daniel's", "Jack Daniel's", 100, '4 cl', '', 'alc', '');
R('viski', sz([70, 177]), "Jack Daniel's Honey", "Jack Daniel's Honey", "Jack Daniel's Honey", 115, '4 cl', '', 'alc', '');
R('viski', sz([70, 563]), "Jack Daniel's Fire", "Jack Daniel's Fire", "Jack Daniel's Fire", 115, '4 cl', '', 'alc', '');
R('viski', sz([70, 564]), "Jack Daniel's Apple", "Jack Daniel's Apple", "Jack Daniel's Apple", 115, '4 cl', '', 'alc', '');
R('viski', sz([35, 179], [50, 180], [70, 181], [100, 182]), "Ballantine's", "Ballantine's", "Ballantine's", 100, '4 cl', '', 'alc', '');
R('viski', sz([70, 565]), 'Woodford Reserve', 'Woodford Reserve', 'Woodford Reserve', 105, '4 cl', '', 'alc', '');
R('viski', sz([70, 358]), 'Jameson', 'Jameson', 'Jameson', 100, '4 cl', '', 'alc', '');

R('raki', sz([35, 211], [50, 212], [70, 213], [100, 214]), 'Yeni Rakı', 'Yeni Rakı', 'Yeni Rakı', 115, '4 cl', '', 'alc,popular', '');
R('raki', 623, 'Yeni Rakı Yeni Seri', 'Yeni Rakı New Series', 'Yeni Rakı Новая серия', 115, '4 cl', '', 'alc', '');
R('raki', sz([35, 215], [50, 216], [70, 217], [100, 218]), 'Tekirdağ Altın Seri', 'Tekirdağ Gold Series', 'Tekirdağ Золотая серия', 115, '4 cl', '', 'alc', '');
R('raki', sz([35, 219], [50, 220], [70, 221], [100, 222]), 'Efe Gold', 'Efe Gold', 'Efe Gold', 115, '4 cl', '', 'alc', '');
R('raki', sz([35, 223], [50, 224], [70, 225], [100, 226]), 'Beylerbeyi Göbek', 'Beylerbeyi Göbek', 'Beylerbeyi Göbek', 115, '4 cl', '', 'alc', '');
R('raki', 568, 'Beylerbeyi Teragold', 'Beylerbeyi Teragold', 'Beylerbeyi Teragold', 115, '4 cl', '', 'alc', '');

R('votka', sz([35, 183], [50, 184], [70, 185], [100, 186]), 'Absolut', 'Absolut', 'Absolut', 95, '4 cl', '', 'alc', '');
R('votka', sz([70, 189], [100, 190]), 'Smirnoff', 'Smirnoff', 'Smirnoff', 95, '4 cl', '', 'alc', '');
R('votka', sz([70, 193]), 'Grey Goose', 'Grey Goose', 'Grey Goose', 95, '4 cl', '', 'alc', '');
R('votka', sz([70, 197]), 'Belvedere', 'Belvedere', 'Belvedere', 95, '4 cl', '', 'alc', '');

R('cin', sz([35, 199], [70, 201], [100, 202]), "Gordon's", "Gordon's", "Gordon's", 95, '4 cl', '', 'alc', '');
R('cin', sz([70, 573]), "Gordon's Pink", "Gordon's Pink", "Gordon's Pink", 100, '4 cl', '', 'alc', '');
R('cin', sz([70, 205]), 'Tanqueray', 'Tanqueray', 'Tanqueray', 95, '4 cl', '', 'alc', '');
R('cin', sz([70, 209]), "Hendrick's", "Hendrick's", "Hendrick's", 100, '4 cl', '', 'alc', '');
R('cin', sz([100, 554]), 'Beefeater', 'Beefeater', 'Beefeater', 95, '4 cl', '', 'alc', '');
R('cin', 845, 'Beefeater Pink', 'Beefeater Pink', 'Beefeater Pink', 100, '4 cl', '', 'alc', '');

R('likor', sz([35, 227], [50, 228], [70, 229], [100, 230]), 'Olmeca Tekila', 'Olmeca Tequila', 'Текила Olmeca', 100, '4 cl', '', 'alc', '');
R('likor', sz([35, 231], [50, 232], [70, 233], [100, 234]), 'Jägermeister', 'Jägermeister', 'Егермейстер', 105, '4 cl', '', 'alc', '');
R('likor', sz([70, 320]), 'Baileys', 'Baileys', 'Baileys', 130, '4 cl', 'm', 'alc', '');

/* ---------------- NARGİLE ---------------- */
const nk = (a, b) => [['normal', a], ['kafa', b]];
const ND = 'Çeşitli meyve aromaları – garsonunuza sorun|Various fruit flavours – ask your waiter|Разные фруктовые вкусы – уточните у официанта';
R('nargile', nk(410, 411), 'Adalya', 'Adalya', 'Adalya', null, '', '', '', ND);
R('nargile', nk(412, 413), 'Y. Adalya', 'Y. Adalya', 'Y. Adalya', null, '', '', '', ND);
R('nargile', nk(420, 434), 'Nakhla', 'Nakhla', 'Nakhla', null, '', '', '', ND);
R('nargile', nk(421, 435), 'Y. Nakhla', 'Y. Nakhla', 'Y. Nakhla', null, '', '', '', ND);
R('nargile', nk(414, 415), 'El Fakir', 'El Fakir', 'El Fakir', null, '', '', '', ND);
R('nargile', nk(416, 417), 'Y. El Fakir', 'Y. El Fakir', 'Y. El Fakir', null, '', '', '', ND);
R('nargile', nk(418, 627), 'Starbuzz', 'Starbuzz', 'Starbuzz', null, '', '', 'popular', ND);
R('nargile', nk(440, 703), 'Darkside', 'Darkside', 'Darkside', null, '', '', '', ND);
R('nargile', nk(423, 704), 'Social Smoke', 'Social Smoke', 'Social Smoke', null, '', '', '', ND);
R('nargile', 636, 'Buzlu Marpuç', 'Ice Hose', 'Ледяной мундштук', null, '', '', '', 'Ekstra serinlik için buzlu marpuç|Ice-cooled hose for a smoother draw|Охлаждённый мундштук для более мягкой затяжки');
R('mix', 433, 'Roof Chef Special', 'Roof Chef Special', 'Roof Chef Special', null, '', '', 'chef', 'Şefin özel karışımı|Chef’s special blend|Особый микс от шефа');
R('mix', 431, 'Original Fruit', 'Original Fruit', 'Original Fruit', null, '', '', 'popular', 'Taze meyve kafa ile servis edilir|Served in a fresh fruit head|Подаётся на свежем фрукте');
R('mix', 425, 'Roof Esintisi', 'Roof Breeze', 'Бриз Roof', null, '', '', '', '');
R('mix', 426, 'Roof Aşkı', 'Roof Love', 'Любовь Roof', null, '', '', '', '');
R('mix', 427, 'Roof Tutkusu', 'Roof Passion', 'Страсть Roof', null, '', '', '', '');
R('mix', 429, 'Breeze of Roof', 'Breeze of Roof', 'Breeze of Roof', null, '', '', '', '');
R('mix', 430, 'Love of Roof', 'Love of Roof', 'Love of Roof', null, '', '', '', '');
R('mix', 432, 'Passion of Roof', 'Passion of Roof', 'Passion of Roof', null, '', '', '', '');

/* ---------------- ÜRET ---------------- */
const price = id => { const r = byId.get(id); if (!r) throw new Error('Eski ID bulunamadı: ' + id); return r.price; };
const imgOf = ids => { for (const id of ids) { const r = byId.get(id); if (r && r.img) return '/uploads/' + r.img; } return ''; };
const used = new Set();
const order = {};
const products = rows.map((r, i) => {
  const isVar = Array.isArray(r.ids);
  const idList = isVar ? r.ids.map(v => v[1]) : [r.ids];
  idList.forEach(id => { if (used.has(id)) throw new Error('Tekrarlanan ID: ' + id); used.add(id); });
  const variants = isVar ? r.ids.map(([k, id]) => ({ label: vlabel(k), price: price(id) })) : [];
  const [dtr = '', den = '', dru = ''] = (r.desc || '').split('|');
  order[r.cat] = (order[r.cat] || 0) + 1;
  return {
    id: 'p' + idList[0],
    category: r.cat,
    name: T(r.tr, r.en, r.ru),
    desc: { tr: dtr, en: den || dtr, ru: dru || den || dtr },
    price: isVar ? variants[0].price : price(r.ids),
    variants,
    kcal: r.kcal,
    portion: r.portion || '',
    allergens: (r.al ? r.al.split(',') : []).map(a => AL[a]),
    tags: r.tags ? r.tags.split(',') : [],
    image: imgOf(idList),
    active: true,
    soldOut: false,
    order: order[r.cat],
  };
});

const categories = CATS.map(([id, section, icon, tr, en, ru], i) => ({ id, section, icon, name: T(tr, en, ru), active: true, order: i + 1 }));

const menu = {
  settings: {
    name: 'Roof Lounge Cafe',
    city: 'Alanya',
    tagline: T('Alanya’nın çatısında lezzet ve manzara', 'Taste & views on the rooftop of Alanya', 'Вкус и вид на крыше Алании'),
    notice: T('Fiyatlarımıza KDV dahildir. Kalori değerleri ortalama tahmini değerlerdir; alerjen bilgisi için lütfen personelimize danışın.', 'All prices include VAT. Calorie values are average estimates; please ask our staff about allergens.', 'Цены включают НДС. Калорийность указана приблизительно; об аллергенах уточняйте у персонала.'),
    phone: '', address: 'Alanya / Antalya', instagram: '', wifiName: '', wifiPass: '', hours: '',
    currency: '₺',
  },
  sections, categories, products,
};

// Kullanılmayan, fiyatlı eski ürünleri raporla (gözden kaçmasın diye)
const skipped = raw.filter(r => !used.has(r.id) && r.price > 0);
fs.writeFileSync(out, JSON.stringify(menu, null, 1));
console.log(products.length, 'ürün,', categories.length, 'kategori yazıldı →', out);
console.log('Fotoğraflı ürün:', products.filter(p => p.image).length);
console.log('Menüye alınmayan fiyatlı eski kalemler:', skipped.map(s => `${s.id}:${s.name}`).join(', ') || '-');
