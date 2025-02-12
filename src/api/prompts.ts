"use strict"

import generateSchema from "../schemas/recipeGenerated.json";

const SHORT_BASE_PROMPT =  (
    `Your job is to structure recipe data into JSON.
    I will give you the text of a recipe.  I would like you to convert it into
    structured JSON following these rules.
    1- Maintain the original text and intent of the recipe whenever possible.
    2- Keep each step simple, minimizing ingredients/step.
    3- Ignore existing headers and other stray content that may have been pasted into the recipe by accident.
    `
  )

const RETRY_PROMPT = (`
      That response did not match the provided format.  Please make sure to
      fit the following schema:
      ${generateSchema}
`
  )

const TEST_RECIPE_TEXT = (
  `
Prep
20minutes minutes
Cook
20minutes minutes
Ready in: 40minutes minutes
Ingredients
Spice blend
1 1/2 tsp ground coriander
1 tsp ground cumin
1/2 tsp turmeric
1/2 tsp fennel seeds, crushed in a small bag with a meat mallet
1/2 tsp ground cinnamon
1/2 tsp ground black pepper
1/4 tsp ground mustard
1/4 tsp ground cloves
Curry
2 Tbsp olive oil
1 small yellow onion, chopped (1 cup)
4 garlic cloves, minced (1 1/2 Tbsp)
1 Tbsp peeled and minced fresh ginger
1 cup low-sodium chicken broth
3/4 cup drained canned diced tomatoes or peeled, seeded, diced fresh tomatoes
Salt
Cayenne pepper, to taste
1 1/2 lbs boneless skinless chicken breasts, diced into 1 1/4-inch cubes
1 tsp cornstarch mixed with 2 tsp water (optional)
1/3 cup heavy cream
2 Tbsp chopped cilantro
Instructions
In a small mixing bowl whisk together all of the spices in the spice blend, set aside.
Heat olive oil in a 12-inch non-stick skillet over medium-high heat.
Add in onion and saute until slightly golden brown, about 4 - 6 minutes.
Add in garlic and ginger, saute 30 seconds more then add in spice blend and saute 30 seconds.
Pour in chicken broth and tomatoes and bring to a boil, then reduce heat to medium-low, cover and simmer 5 minutes.
Pour mixture into a blender then cover with lid and remove lid insert, cover opening with a clean folded kitchen rag.
Blend mixture until well pureed and smooth then return to skillet and heat skillet over medium-high heat.
Season sauce with salt and cayenne pepper (start with about 1/2 tsp salt and a few dashes cayenne then add more to taste) then add in chicken.
Bring to a simmer then reduce heat to medium-low, cover skillet with lid and simmer until chicken has cooked through, stirring occasionally, about 8 -  12 minutes.
During the last minute of cooking stir in the cornstarch and water slurry if desired, to thicken sauce slightly (or if needed thin with a little chicken broth).
Stir in cream then serve warm with cilantro over basmati rice.
  `
)

export {TEST_RECIPE_TEXT, SHORT_BASE_PROMPT, RETRY_PROMPT}