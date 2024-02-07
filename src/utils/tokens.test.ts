import * as jwt from "jsonwebtoken";
import { createToken } from "./tokens";
import { SECRET_KEY } from "../config";

const testUser:IUserBase = {
  username:"test",
  isAdmin:false,
  password: "test",
  firstName:"test",
  lastName:"test",
  email:"test@test.com",
}

const testAdmin:IUserBase = {
  username:"test",
  isAdmin:true,
  password: "test",
  firstName:"test",
  lastName:"test",
  email:"test@test.com",
}

describe("createToken", function () {
  test("works: not admin", function () {
    const token = createToken(testUser);
    const payload = jwt.verify(token, SECRET_KEY);
    expect(payload).toEqual({
      iat: expect.any(Number),
      username: "test",
      isAdmin: false,
    });
  });

  test("works: admin", function () {
    const token = createToken(testAdmin);
    const payload = jwt.verify(token, SECRET_KEY);
    expect(payload).toEqual({
      iat: expect.any(Number),
      username: "test",
      isAdmin: true,
    });
  });

  test("works: default no admin", function () {
    // given the security risk if this didn't work, checking this specifically
    const token = createToken(testUser);
    const payload = jwt.verify(token, SECRET_KEY);
    expect(payload).toEqual({
      iat: expect.any(Number),
      username: "test",
      isAdmin: false,
    });
  });
});
