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

export type Recipe = { name: string; tag: "Petit-déj" | "Déjeuner" | "Dîner" | "Snack"; time: string; ingredients: string };
export const recipes: Recipe[] = [
  { name: "Overnight oats fruits rouges", tag: "Petit-déj", time: "5 min", ingredients: "Flocons d'avoine, lait, yaourt, chia, fruits rouges, miel" },
  { name: "Toast avocat & œuf", tag: "Petit-déj", time: "10 min", ingredients: "Pain complet, avocat, œuf, citron, graines de sésame" },
  { name: "Smoothie bowl banane", tag: "Petit-déj", time: "5 min", ingredients: "Banane congelée, lait d'amande, granola, kiwi" },
  { name: "Bowl quinoa poulet", tag: "Déjeuner", time: "20 min", ingredients: "Quinoa, poulet grillé, concombre, tomates, feta, huile d'olive" },
  { name: "Salade de lentilles", tag: "Déjeuner", time: "15 min", ingredients: "Lentilles, carotte, persil, oignon rouge, cumin, citron" },
  { name: "Wrap thon & crudités", tag: "Déjeuner", time: "10 min", ingredients: "Tortilla complète, thon, salade, maïs, yaourt citronné" },
  { name: "Saumon au four & légumes", tag: "Dîner", time: "25 min", ingredients: "Saumon, brocoli, patate douce, ail, paprika" },
  { name: "Soupe harira légère", tag: "Dîner", time: "35 min", ingredients: "Pois chiches, lentilles, tomates, céleri, coriandre, épices" },
  { name: "Omelette aux épinards", tag: "Dîner", time: "10 min", ingredients: "Œufs, épinards, champignons, fromage frais" },
  { name: "Dattes fourrées amandes", tag: "Snack", time: "5 min", ingredients: "Dattes, amandes, cannelle" },
  { name: "Yaourt grec & noix", tag: "Snack", time: "2 min", ingredients: "Yaourt grec, noix, miel, cannelle" },
  { name: "Houmous & bâtonnets", tag: "Snack", time: "10 min", ingredients: "Pois chiches, tahini, citron, carottes, concombre" },
];
