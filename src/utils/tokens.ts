import * as jwt from "jsonwebtoken";
import { SECRET_KEY } from "../config";

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

export { createToken };
