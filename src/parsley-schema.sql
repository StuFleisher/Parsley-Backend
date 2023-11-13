CREATE TABLE recipes (
    recipe_id SERIAL PRIMARY KEY,
    name VARCHAR(30) NOT NULL,
    description VARCHAR(40),
    source_url TEXT,
    source_name VARCHAR(25)
)

CREATE TABLE steps {
    step_id SERIAL PRIMARY KEY,
    recipe_id INTEGER NOT NULL REFERENCES recipes ON DELETE CASCADE,
    step_number INTEGER NOT NULL,
    instructions VARCHAR(100) NOT NULL,
}

CREATE TABLE step_ingredients {
    ingredient_id SERIAL PRIMARY KEY,
    step INTEGER NOT NULL REFERENCES steps ON DELETE CASCADE,
    amount VARCHAR(25),
    description VARCHAR(25) NOT NULL
}