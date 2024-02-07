import '../config'; //this loads the test database
import request from 'supertest';
import app from '../app';
import UserManager from '../models/user';
import { commonBeforeEach } from '../test/test_common';


beforeEach(commonBeforeEach);


/************************************** POST /auth/token */

describe("POST /auth/token", function () {

  const mockAuthenticate = jest.spyOn(UserManager,"authenticate")

  test("works", async function () {

    mockAuthenticate.mockResolvedValueOnce({
      username: "u1",
      firstName: "First-new",
      lastName: "Last-newL",
      email: "new@email.com",
      isAdmin: false,
    })

    const resp = await request(app)
        .post("/auth/token")
        .send({
          username: "u1",
          password: "password1",
        });
    expect(resp.body).toEqual({
      "token": expect.any(String),
    });
  });

  test("unauth with non-existent user", async function () {
    const resp = await request(app)
        .post("/auth/token")
        .send({
          username: "no-such-user",
          password: "password1",
        });
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth with wrong password", async function () {
    const resp = await request(app)
        .post("/auth/token")
        .send({
          username: "u1",
          password: "nope",
        });
    expect(resp.statusCode).toEqual(401);
  });

  test("bad request with missing data", async function () {
    const resp = await request(app)
        .post("/auth/token")
        .send({
          username: "u1",
        });
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request with invalid data", async function () {
    const resp = await request(app)
        .post("/auth/token")
        .send({
          username: 42,
          password: "above-is-a-number",
        });
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** POST /auth/register */

describe("POST /auth/register", function () {

  const mockRegister = jest.spyOn(UserManager,"register")


  test("works for anon", async function () {

    mockRegister.mockResolvedValueOnce({
      userId: 1,
      username: "u1",
      firstName: "first",
      lastName: "last",
      email: "new@email.com",
      isAdmin: false,
    })

    const resp = await request(app)
        .post("/auth/register")
        .send({
          userId:1,
          username: "new",
          firstName: "first",
          lastName: "last",
          password: "password",
          email: "new@email.com",
        });
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      "token": expect.any(String),
    });
    expect(mockRegister).toHaveBeenCalledWith({
      username: "new",
      firstName: "first",
      lastName: "last",
      password: "password",
      email: "new@email.com",
      isAdmin: false,
    })
  });

  test("bad request with missing fields", async function () {
    const resp = await request(app)
        .post("/auth/register")
        .send({
          username: "new",
        });
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request with invalid data", async function () {
    const resp = await request(app)
        .post("/auth/register")
        .send({
          username: "new",
          firstName: "first",
          lastName: "last",
          password: "password",
          email: "not-an-email",
        });
    expect(resp.statusCode).toEqual(400);
  });
});