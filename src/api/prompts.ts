"use strict"
/**We have to use ESM syntax to handle typing and to get ts to recognize this as
 * a module instead of a script */
export {};

/**We use common js for other imports to avoid a transpiling issue related to
 * extensions and paths differing in testing and dev environments
 */
const SHORT_BASE_PROMPT =  (
    `Your job is to structure recipe data.
    I will give you the text of a recipe.  I would like you to convert it into
    structured JSON following these rules.
    1- Maintain the original text and intent of the recipe whenever possible.
    2- Keep each step simple.
    3- Ignore stray content that may have been pasted into the recipe by accident.
    4. Follow the data structure below exactly

    Here is an example of the data structure:
    Input: "Ingredients 2 (5 ounce) skinless, boneless chicken breast halves 1 medium lemon, juiced, divided salt and freshly ground black pepper to taste 1 tablespoon olive oil 1 pinch dried oregano 2 sprigs fresh parsley, chopped, for garnish Directions Place chicken in a bowl; pour 1/2 of the lemon juice over chicken and season with salt. Heat olive oil in a medium skillet over medium-low heat. Place chicken into hot oil. Add remaining lemon juice and oregano; season with black pepper. Cook chicken until golden brown and the juices run clear, 5 to 10 minutes per side. An instant-read thermometer inserted into the center should read at least 165 degrees F (74 degrees C). Garnish chicken with parsley to serve."

    Output: {
        "name": "Lemon Oregano Chicken",
        "steps": [
          {
            "stepNumber": 1,
            "instructions": "Place chicken in a bowl; pour 1/2 of the lemon juice over chicken and season with salt.",
            "ingredients": [
              {
                "amount": "2 (5 ounce)",
                "description": "skinless, boneless chicken breast halves",
                "instructionRef":"chicken"
              },
              {
                "amount": "1 medium",
                "description": "lemon, juiced, divided",
                "instructionRef": "lemon juice"
              },
              {
                "amount":"",
                "description": "salt",
                "instructionRef":""salt"
              }
            ]
          },
          {
            "stepNumber": 2,
            "instructions": "Heat olive oil in a medium skillet over medium-low heat. Place chicken into hot oil. Add remaining lemon juice and oregano; season with black pepper.",
            "ingredients": [
              {
                "amount": "1 tablespoon",
                "description": "olive oil",
                "instructionRef":"olive oil"
              },
              {
                "amount":"1 pinch",
                "description": "dried oregano",
                "instructionRef":"oregano"
              },
              {
                "amount":"",
                "description": "freshly ground black pepper",
                "instructionRef":"black pepper"
              },
            ]
          },
          {
            "stepNumber": 3,
            "instructions": "Cook chicken until golden brown and the juices run clear, 5 to 10 minutes per side. An instant-read thermometer inserted into the center should read at least 165 degrees F (74 degrees C).",
            "ingredients": []
          },
          {
            "stepNumber": 4,
            "instructions": "Garnish chicken with parsley to serve.",
            "ingredients": [
              {
                "amount":"2 sprigs",
                "description": "fresh parsley, chopped, for garnish",
                "instructionRef":"parsley"
              }
            ]
          }
        ]
      }
    `
  )


const RECIPE_CONVERSION_BASE_PROMPT = (
  `I will give you the text of a recipe.  I would like you to convert it into structured JSON following these rules.  1- Maintain the original text and intent of the recipe whenever possible. 2- Keep each step simple. 3-Ignore stray content that may have been copy pasted into the recipe by accident. 4. Follow the data structure below exactly

  Below is an example of how a recipe should be converted.
  2 teaspoons canola oil
  1 cup sliced mushrooms
  ½ cup chopped red bell pepper
  4 teaspoons minced peeled fresh ginger
  4 garlic cloves, minced
  1 (3-inch) stalk lemongrass, halved lengthwise
  2 teaspoons sambal oelek (ground fresh chile paste)
  3 cups Chicken stock or reduced-sodium chicken broth
  1 ¼ cups light coconut milk
  4 teaspoons fish sauce
  1 tablespoon sugar
  2 cups shredded cooked chicken breast (about 8 ounces)
  ½ cup green onion strips
  3 tablespoons chopped fresh cilantro
  2 tablespoons fresh lime juice
  Local Offers
  Atlanta, GA 30310 Change
  Kroger Logo
   FEATURED PRODUCTS
  Offer for Smidge & Spoon™ Granulated Sugar
  Smidge & Spoon™ Granulated Sugar
  All-purpose sugar ideal for table use & baking
  ORDER NOW
  Buy all 15 ingredients from this recipe for $36.92
  Add toKroger Logocart
  Advertisement
  Directions
  Spicy Thai Coconut Chicken Soup image
  ANTONIS ACHILLEOS; FOOD STYLING: RISHON HANNERS; PROP STYLING: MISSIE CRAWFORD
  Heat a Dutch oven over medium heat. Add oil to pan; swirl to coat. Add mushrooms, bell pepper, ginger, garlic and lemongrass; cook 3 minutes, stirring occasionally. Add chile paste; cook 1 minute. Add chicken stock, coconut milk, fish sauce and sugar; bring to a simmer. Reduce heat to low; simmer for 10 minutes. Add chicken to pan; cook 1 minute or until thoroughly heated. Discard lemongrass. Top with onions, cilantro and juice.
  Originally appeared: Cooking Light

  Should convert to:
  {
      "name":"Spicy Thai Coconut Chicken Soup",
      "steps":[
        {
          "stepNumber":1,
          "instructions":"Heat a Dutch oven over medium heat. Add oil to coat the pan. Then add mushrooms, bell pepper, ginger, garlic, and lemongrass; cook for 3 minutes, stirring occasionally.",
          "ingredients": [
            {
              "amount":"2 teaspoons",
              "description":"canola oil"
            },
            {
              "amount":"1 cup",
              "description":"sliced mushrooms"
            },
            {
              "amount":"1/2 cup",
              "description":"chopped red bell pepper"
            },
            {
              "amount":"4 teaspoons",
              "description":"minced peeled fresh ginger"
            },
            {
              "amount":"4 cloves",
              "description":"garlic, minced"
            },
            {
              "amount":"1 (3-inch) stalk",
              "description":"lemongrass, halved lengthwise"
            }
          ]
        },
        {
          "stepNumber":2,
          "instructions":"Add chile paste to the pan; cook for 1 minute, stirring continuously.",
          "ingredients": [
            {
              "amount":"2 teaspoons",
              "description":"sambal oelek (ground fresh chile paste)"
            }
          ]
        },
        {
          "stepNumber":3,
          "instructions":"Add chicken stock, coconut milk, fish sauce, and sugar to the pan; bring to a simmer. Then reduce heat to low and simmer for 10 minutes.",
          "ingredients": [
            {
              "amount":"3 cups",
              "description":"chicken stock or reduced-sodium chicken broth"
            },
            {
              "amount":"1 ¼ cups",
              "description":"light coconut milk"
            },
            {
              "amount":"4 teaspoons",
              "description":"fish sauce"
            },
            {
              "amount":"1 tablespoon",
              "description":"sugar"
            }
          ]
        },
        {
          "stepNumber":4,
          "instructions":"Add chicken to the pan and cook for 1 minute or until thoroughly heated.",
          "ingredients": [
            {
              "amount":"2 cups",
              "description":"shredded cooked chicken breast"
            }
          ]
        },
        {
          "stepNumber":5,
          "instructions":"Discard lemongrass. Top the soup with green onions, cilantro, and lime juice before serving.",
          "ingredients": [
            {
              "amount":"1/2 cup",
              "description":" ½ cup green onion strips"
            },
            {
              "amount":"3 tablespoons",
              "description":"chopped fresh cilantro"
            },
            {
              "amount":"2 tablespoons",
              "description":"fresh lime juice"
            }
          ]
        }
      ]
    }

  DO NOT OMIT ANY PROPERTIES IN YOUR RESPONSE!

  If the text below can't be made into a recipe, please return {error:"Invalid recipe input"}. Here is the recipe to convert:
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

module.exports = {RECIPE_CONVERSION_BASE_PROMPT, TEST_RECIPE_TEXT, SHORT_BASE_PROMPT}