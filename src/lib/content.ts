export const islamTopics = [
  { title: "Les 99 noms d'Allah", hint: "Choisis 3 noms, cherche leur sens et comment les vivre au quotidien." },
  { title: "La vie de Khadija (ra)", hint: "Son rôle, sa force et son soutien au Prophète ﷺ." },
  { title: "La sourate Al-Kahf", hint: "Les 4 histoires de la sourate et leurs leçons." },
  { title: "La sincérité (Ikhlas)", hint: "Ce que disent les savants sur l'intention dans les actes." },
  { title: "Le sabr (patience)", hint: "Les trois formes de patience et des versets qui en parlent." },
  { title: "Aïcha (ra), savante de l'Islam", hint: "Sa contribution à la science du hadith." },
  { title: "Les piliers de la prière", hint: "Arkan, wajibat et sunan : faire la différence." },
  { title: "La gratitude (Shukr)", hint: "Versets et hadiths sur la reconnaissance envers Allah." },
  { title: "L'histoire du prophète Yusuf (as)", hint: "La plus belle des histoires : ses leçons sur l'épreuve." },
  { title: "Les invocations du matin", hint: "Apprends-en une nouvelle et son origine." },
  { title: "La bonté envers les parents", hint: "Ce que le Coran et la Sunna enseignent sur birr al-walidayn." },
  { title: "Les nuits de Laylat al-Qadr", hint: "Ses signes, ses mérites et comment s'y préparer." },
  { title: "Maryam (as) dans le Coran", hint: "La seule femme nommée dans le Coran : son histoire." },
  { title: "Le tawakkul (confiance en Allah)", hint: "Faire les causes et s'en remettre à Allah." },
  { title: "La science des Tafsir", hint: "Découvre un tafsir connu et son auteur." },
  { title: "Les bonnes manières (Adab)", hint: "Adab de la parole, du repas et de la visite." },
];

export function topicFor(date: Date, offset: number) {
  const day = Math.floor(date.getTime() / 86400000);
  return islamTopics[(((day + offset) % islamTopics.length) + islamTopics.length) % islamTopics.length]!;
}

export type RecipeTag = "Petit-déj" | "Déjeuner" | "Dîner" | "Snack";
export type Recipe = {
  id: string;
  name: string;
  tag: RecipeTag;
  time: string;
  note: string;
  tags: string[];
  ingredients: string[];
  steps: string[];
  photo: string;
};

export const recipeCategories: readonly ("Tous" | RecipeTag)[] = ["Tous", "Petit-déj", "Déjeuner", "Dîner", "Snack"];

// Photos come from an image-generation endpoint; the UI falls back to a pastel
// placeholder if a photo fails to load, so a broken URL never breaks a card.
const photo = (prompt: string) =>
  `https://core-normal.trae.ai/api/ide/v1/text_to_image?prompt=${encodeURIComponent(
    `${prompt}, healthy food photography, soft pastel pink background, cozy minimal styling, natural light, top-down`,
  )}&image_size=landscape_4_3`;

export const recipes: Recipe[] = [
  {
    id: "overnight-oats",
    name: "Overnight oats fruits rouges",
    tag: "Petit-déj",
    time: "5 min",
    note: "À préparer la veille, prêt au réveil ♡",
    tags: ["végétarien", "fibres", "meal-prep"],
    ingredients: ["50 g flocons d'avoine", "150 ml lait ou lait d'amande", "2 c. à s. yaourt nature", "1 c. à c. graines de chia", "1 poignée de fruits rouges", "1 c. à c. miel"],
    steps: ["Mélange l'avoine, le lait, le yaourt et le chia dans un bocal.", "Couvre et laisse reposer au frais toute la nuit.", "Le matin, ajoute les fruits rouges et un filet de miel."],
    photo: photo("overnight oats with fresh berries in a glass jar"),
  },
  {
    id: "toast-avocat-oeuf",
    name: "Toast avocat & œuf",
    tag: "Petit-déj",
    time: "10 min",
    note: "Protéines et bonnes graisses pour bien démarrer.",
    tags: ["végétarien", "protéiné", "rapide"],
    ingredients: ["1 tranche de pain complet", "1/2 avocat mûr", "1 œuf", "Quelques gouttes de citron", "Graines de sésame", "Sel, poivre"],
    steps: ["Toaste le pain.", "Écrase l'avocat avec le citron, le sel et le poivre.", "Cuis l'œuf (poché ou à la poêle) et pose-le sur l'avocat.", "Parsème de graines de sésame."],
    photo: photo("avocado toast with a soft egg on sourdough"),
  },
  {
    id: "smoothie-bowl-banane",
    name: "Smoothie bowl banane",
    tag: "Petit-déj",
    time: "5 min",
    note: "Frais et rapide, parfait après le sport.",
    tags: ["végétarien", "sans gluten", "rapide"],
    ingredients: ["1 banane congelée", "150 ml lait d'amande", "2 c. à s. granola", "1 kiwi", "Graines (chia, courge)"],
    steps: ["Mixe la banane congelée avec le lait d'amande jusqu'à une crème épaisse.", "Verse dans un bol.", "Garnis de granola, de kiwi et de graines."],
    photo: photo("banana smoothie bowl topped with granola and kiwi slices"),
  },
  {
    id: "bowl-quinoa-poulet",
    name: "Bowl quinoa poulet",
    tag: "Déjeuner",
    time: "20 min",
    note: "Un bol complet et coloré, idéal à emporter.",
    tags: ["protéiné", "équilibré"],
    ingredients: ["100 g quinoa cuit", "1 filet de poulet grillé", "1/2 concombre", "Tomates cerises", "Feta", "Huile d'olive, citron"],
    steps: ["Fais cuire le quinoa et laisse tiédir.", "Grille le poulet et coupe-le en lamelles.", "Assemble légumes, quinoa et poulet dans un bol.", "Ajoute la feta et assaisonne d'huile d'olive et de citron."],
    photo: photo("quinoa bowl with grilled chicken, feta and fresh vegetables"),
  },
  {
    id: "salade-lentilles",
    name: "Salade de lentilles",
    tag: "Déjeuner",
    time: "15 min",
    note: "Riche en fibres, se garde deux jours au frais.",
    tags: ["végétarien", "fibres", "protéiné"],
    ingredients: ["200 g lentilles cuites", "1 carotte râpée", "Persil frais", "1/2 oignon rouge", "Cumin, citron, huile d'olive"],
    steps: ["Rince et égoutte les lentilles.", "Ajoute la carotte râpée, l'oignon et le persil.", "Assaisonne de cumin, citron et huile d'olive.", "Laisse mariner 10 min avant de servir."],
    photo: photo("lentil salad with carrot and herbs in a ceramic bowl"),
  },
  {
    id: "wrap-thon-crudites",
    name: "Wrap thon & crudités",
    tag: "Déjeuner",
    time: "10 min",
    note: "Le déjeuner express du placard.",
    tags: ["rapide", "protéiné"],
    ingredients: ["1 tortilla complète", "1 boîte de thon", "Salade verte", "Maïs", "Sauce yaourt citronné"],
    steps: ["Mélange le thon avec la sauce yaourt citronné.", "Garnis la tortilla de salade, de maïs et de thon.", "Roule serré et coupe en deux."],
    photo: photo("tuna wrap with fresh greens on a pastel plate"),
  },
  {
    id: "saumon-four-legumes",
    name: "Saumon au four & légumes",
    tag: "Dîner",
    time: "25 min",
    note: "Une seule plaque, zéro vaisselle, riche en oméga-3.",
    tags: ["protéiné", "oméga-3", "sans gluten"],
    ingredients: ["1 pavé de saumon", "Brocoli", "1 patate douce", "1 gousse d'ail", "Paprika, huile d'olive"],
    steps: ["Préchauffe le four à 200 °C.", "Coupe les légumes et dispose-les sur une plaque.", "Ajoute le saumon, l'ail, le paprika et un filet d'huile.", "Enfourne 18 à 20 min."],
    photo: photo("baked salmon with broccoli and sweet potato on a sheet pan"),
  },
  {
    id: "harira-legere",
    name: "Soupe harira légère",
    tag: "Dîner",
    time: "35 min",
    note: "Chaleur et réconfort pour les soirs frais.",
    tags: ["végétarien", "réconfort", "fibres"],
    ingredients: ["Pois chiches cuits", "Lentilles", "Tomates concassées", "Céleri, coriandre", "Épices (cumin, gingembre)"],
    steps: ["Fais revenir le céleri et les épices.", "Ajoute les tomates, les lentilles et les pois chiches.", "Couvre d'eau et laisse mijoter 25 min.", "Parsème de coriandre fraîche."],
    photo: photo("bowl of tomato lentil harira soup with fresh coriander"),
  },
  {
    id: "omelette-epinards",
    name: "Omelette aux épinards",
    tag: "Dîner",
    time: "10 min",
    note: "Un dîner léger et protéiné en quelques minutes.",
    tags: ["végétarien", "protéiné", "rapide"],
    ingredients: ["3 œufs", "1 poignée d'épinards", "Champignons", "Fromage frais", "Sel, poivre"],
    steps: ["Bats les œufs avec le sel et le poivre.", "Fais revenir les épinards et les champignons.", "Verse les œufs et cuis à feu doux.", "Ajoute le fromage frais et plie l'omelette."],
    photo: photo("spinach and mushroom omelette on a pastel plate"),
  },
  {
    id: "dattes-amandes",
    name: "Dattes fourrées amandes",
    tag: "Snack",
    time: "5 min",
    note: "L'encas sucré naturel, sans cuisson.",
    tags: ["végétarien", "sans cuisson", "énergie"],
    ingredients: ["8 dattes Medjool", "8 amandes", "Cannelle"],
    steps: ["Ouvre les dattes et retire le noyau.", "Glisse une amande à l'intérieur.", "Saupoudre d'une pincée de cannelle."],
    photo: photo("medjool dates stuffed with almonds on a small dish"),
  },
  {
    id: "yaourt-noix",
    name: "Yaourt grec & noix",
    tag: "Snack",
    time: "2 min",
    note: "Protéines et bonnes graisses en deux minutes.",
    tags: ["végétarien", "protéiné", "rapide"],
    ingredients: ["1 pot de yaourt grec", "Une poignée de noix", "1 c. à c. miel", "Cannelle"],
    steps: ["Verse le yaourt dans un bol.", "Ajoute les noix, le miel et la cannelle."],
    photo: photo("greek yogurt bowl with walnuts and honey"),
  },
  {
    id: "houmous-batonnets",
    name: "Houmous & bâtonnets",
    tag: "Snack",
    time: "10 min",
    note: "À tremper sans culpabilité ♡",
    tags: ["végétarien", "fibres", "meal-prep"],
    ingredients: ["200 g pois chiches", "1 c. à s. tahini", "Jus de citron", "1 gousse d'ail", "Carottes, concombre"],
    steps: ["Mixe les pois chiches, le tahini, le citron et l'ail.", "Ajuste avec un peu d'eau pour une texture crémeuse.", "Coupe les légumes en bâtonnets et sers en trempette."],
    photo: photo("hummus with fresh vegetable sticks on a pastel board"),
  },
];
