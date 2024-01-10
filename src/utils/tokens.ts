"use strict";


/**We have to use ESM syntax to handle typing and to get ts to recognize this as
 * a module instead of a script */
export { };

const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");

/** return signed JWT {username, isAdmin} from user data. */

function createToken(user:IUserBase) {
  console.assert(user.isAdmin !== undefined,
      "createToken passed user without isAdmin property");

  let payload = {
    username: user.username,
    isAdmin: user.isAdmin || false,
  };

  return jwt.sign(payload, SECRET_KEY);
}

module.exports = { createToken };
