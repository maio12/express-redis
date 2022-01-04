const express = require("express");
const app = express();
const port = 3000;
const axios = require("axios");
const redis = require("redis");

// make a connection to the local instance of redis
const client = redis.createClient();

client.on("error", (error) => {
  console.error(error);
});

client
  .connect()
  .then(() => {
    app.get("/cocktail/:cocktailitem", (req, res) => {
      const cocktailitem = req.params.cocktailitem;

      client.get(cocktailitem).then((a) => {
        if (a) {
          return res.status(200).send({
            error: false,
            message: `Recipe for ${cocktailitem} from the cache`,
            data: JSON.parse(a),
          });
        } else {
          const recipe = axios.get(
            `http://www.thecocktaildb.com/api/json/v1/1/search.php?s=${cocktailitem}`
          );

          recipe.then((r) => {
            client.setEx(
              cocktailitem,
              60,
              JSON.stringify(r.data.drinks[0].strInstructions)
            );
            return res.status(200).send({
              error: false,
              message: `Recipe for ${cocktailitem} from the server`,
              data: r.data.drinks[0].strInstructions,
            });
          });
        }
      });
    });
  })
  .catch((err) => console.log(err));

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

module.exports = app;
