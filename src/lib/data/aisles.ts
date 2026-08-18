/**
 * Roughly where a thing lives in a supermarket.
 *
 * A shopping list sorted alphabetically walks you past the same shelves four
 * times. Grouping it by aisle is worth doing even approximately — and this is
 * approximate on purpose: the ingredient library stores a name and an amount,
 * not a department, and asking Dean to file every ingredient would be a chore
 * that earns nothing. Worked out from the name, and only ever affects the
 * order things are listed in, so a wrong guess costs nobody anything.
 *
 * Order here is the order they are shown in, which is roughly the order a
 * shop is laid out: fresh around the edges, cupboard down the middle, frozen
 * last so it spends least time out.
 */
export const AISLES = [
  "Fruit & veg",
  "Meat & fish",
  "Dairy & eggs",
  "Bakery",
  "Cupboard",
  "Frozen",
  "Other",
] as const;

export type Aisle = (typeof AISLES)[number];

/**
 * Longest match wins, so "sweet potato" lands in fruit and veg rather than
 * being caught by "potato" somewhere else, and "coconut milk" does not end up
 * in the dairy fridge.
 */
const KEYWORDS: Array<[Aisle, string[]]> = [
  [
    "Fruit & veg",
    [
      "apple", "asparagus", "aubergine", "avocado", "banana", "basil", "beetroot", "berries",
      "blueberr", "broccoli", "cabbage", "carrot", "cauliflower", "celery", "chilli", "coriander",
      "courgette", "cucumber", "garlic", "ginger", "grape", "green bean", "kale", "leek", "lemon",
      "lettuce", "lime", "mango", "mushroom", "onion", "orange", "parsley", "parsnip", "pea",
      "pepper", "potato", "raspberr", "rocket", "salad", "spinach", "spring green", "strawberr",
      "sweetcorn", "sweet potato", "tomato",
    ],
  ],
  [
    "Meat & fish",
    [
      "bacon", "beef", "chicken", "cod", "duck", "gammon", "haddock", "ham", "lamb", "mackerel",
      "mince", "pork", "prawn", "salmon", "sardine", "sausage", "steak", "tuna", "turkey",
    ],
  ],
  [
    "Dairy & eggs",
    [
      "butter", "cheddar", "cheese", "cream", "crème fraîche", "egg", "feta", "halloumi", "milk",
      "mozzarella", "parmesan", "skyr", "yoghurt", "yogurt",
    ],
  ],
  ["Bakery", ["bagel", "baguette", "bread", "bun", "pitta", "roll", "tortilla", "wrap"]],
  [
    "Cupboard",
    [
      "almond", "bean", "cashew", "chickpea", "chocolate", "cinnamon", "cocoa", "coconut milk",
      "couscous", "cumin", "flour", "honey", "hummus", "jam", "ketchup", "lentil", "macaroni",
      "maple", "mayo", "mustard", "noodle", "oat", "oil", "olive", "paprika", "passata", "pasta",
      "peanut", "peanut butter", "almond butter", "nut butter", "penne", "pesto", "protein powder", "quinoa", "rice", "salt", "sauce", "seed",
      "soy", "spaghetti", "spice", "stock", "sugar", "tahini", "tinned", "vinegar", "walnut",
      "wholewheat", "wholemeal",
    ],
  ],
  ["Frozen", ["frozen", "ice cream", "peas frozen"]],
];

export function aisleFor(name: string): Aisle {
  const haystack = name.trim().toLowerCase();

  let best: { aisle: Aisle; length: number } | null = null;
  for (const [aisle, words] of KEYWORDS) {
    for (const word of words) {
      if (!haystack.includes(word)) continue;
      if (!best || word.length > best.length) best = { aisle, length: word.length };
    }
  }

  return best?.aisle ?? "Other";
}
