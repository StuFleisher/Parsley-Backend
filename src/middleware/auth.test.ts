
import * as jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { UnauthorizedError } from "../utils/expressError";
import {
  authenticateJWT,
  ensureLoggedIn,
  ensureAdmin,
  ensureCorrectUserOrAdmin,
  ensureCorrectUserInBodyOrAdmin,
} from "./auth";


const { SECRET_KEY } = require("../config");
const testJwt = jwt.sign({ username: "test", isAdmin: false }, SECRET_KEY);
const badJwt = jwt.sign({ username: "test", isAdmin: false }, "wrong");

const next = function(err:Error) {
  if (err) throw new Error("Got error from middleware");
} as NextFunction


describe("authenticateJWT", function () {
  test("works: via header", function () {
    const req = { headers: { authorization: `Bearer ${testJwt}` } } as Request;
    const res = { locals: {} } as Response;
    authenticateJWT(req, res, next);
    expect(res.locals).toEqual({
      user: {
        iat: expect.any(Number),
        username: "test",
        isAdmin: false,
      },
    });
  });

  test("works: no header", function () {
    const req = {} as Request;
    const res = { locals: {} } as Response;
    authenticateJWT(req, res, next);
    expect(res.locals).toEqual({});
  });

  test("works: invalid token", function () {
    const req = { headers: { authorization: `Bearer ${badJwt}` } } as Request;;
    const res = { locals: {} } as Response;
    authenticateJWT(req, res, next);
    expect(res.locals).toEqual({});
  });
});


describe("ensureLoggedIn", function () {
  test("works", function () {
    const req = {} as Request;
    const res = { locals: { user: { username: "test" } } } as unknown as Response;
    ensureLoggedIn(req, res, next);
  });

  test("unauth if no login", function () {
    const req = {} as Request;
    const res = { locals: {} } as unknown as Response;
    expect(() => ensureLoggedIn(req, res, next))
        .toThrow(UnauthorizedError);
  });

  test("unauth if no valid login", function () {
    const req = {} as Request;
    const res = { locals: { user: { } } } as unknown as Response;
    expect(() => ensureLoggedIn(req, res, next))
        .toThrow(UnauthorizedError);
  });
});


describe("ensureAdmin", function () {
  test("works", function () {
    const req = {} as Request;
    const res = { locals: { user: { username: "test", isAdmin: true } } } as unknown as Response;
    ensureAdmin(req, res, next);
  });

  test("unauth if not admin", function () {
    const req = {} as Request;
    const res = { locals: { user: { username: "test", isAdmin: false } } } as unknown as Response;
    expect(() => ensureAdmin(req, res, next))
        .toThrow(UnauthorizedError);
  });

  test("unauth if not admin (invalid isAdmin)", function () {
    const req = {} as Request;
    const res = { locals: { user: { username: "test", isAdmin: "true" } } } as unknown as Response;
    expect(() => ensureAdmin(req, res, next))
        .toThrow(UnauthorizedError);
  });

  test("unauth if anon", function () {
    const req = {} as Request;
    const res = { locals: {} } as unknown as Response;
    expect(() => ensureAdmin(req, res, next))
        .toThrow(UnauthorizedError);
  });
});


describe("ensureCorrectUserOrAdmin", function () {
  test("works: admin", function () {
    const req = { params: { username: "test" } } as unknown as Request;
    const res = { locals: { user: { username: "admin", isAdmin: true } } } as unknown as Response;
    ensureCorrectUserOrAdmin(req, res, next);
  });

  test("works: same user", function () {
    const req = { params: { username: "test" } } as unknown as Request;
    const res = { locals: { user: { username: "test", isAdmin: false } } } as unknown as Response;
    ensureCorrectUserOrAdmin(req, res, next);
  });

  test("unauth: mismatch", function () {
    const req = { params: { username: "wrong" } } as unknown as Request;
    const res = { locals: { user: { username: "test", isAdmin: false } } } as unknown as Response;
    expect(() => ensureCorrectUserOrAdmin(req, res, next))
        .toThrow(UnauthorizedError);
  });

  test("unauth: mismatch (invalid isAdmin)", function () {
    const req = { params: { username: "wrong" } } as unknown as Request;
    const res = { locals: { user: { username: "test", isAdmin: "true" } } } as unknown as Response;
    expect(() => ensureCorrectUserOrAdmin(req, res, next))
        .toThrow(UnauthorizedError);
  });

  test("unauth: if anon", function () {
    const req = { params: { username: "test" } } as unknown as Request;
    const res = { locals: {} } as unknown as Response;
    expect(() => ensureCorrectUserOrAdmin(req, res, next))
        .toThrow(UnauthorizedError);
  });
});

describe("ensureCorrectUserInBodyOrAdmin", function () {
  test("works: admin", function () {
    const req = { body: { username: "test" } } as unknown as Request;
    const res = { locals: { user: { username: "admin", isAdmin: true } } } as unknown as Response;
    ensureCorrectUserInBodyOrAdmin(req, res, next);
  });

  test("works: same user", function () {
    const req = { body: { username: "test" } } as unknown as Request;
    const res = { locals: { user: { username: "test", isAdmin: false } } } as unknown as Response;
    ensureCorrectUserInBodyOrAdmin(req, res, next);
  });

  test("unauth: mismatch", function () {
    const req = { body: { username: "wrong" } } as unknown as Request;
    const res = { locals: { user: { username: "test", isAdmin: false } } } as unknown as Response;
    expect(() => ensureCorrectUserInBodyOrAdmin(req, res, next))
        .toThrow(UnauthorizedError);
  });

  test("unauth: mismatch (invalid isAdmin)", function () {
    const req = { body: { username: "wrong" } } as unknown as Request;
    const res = { locals: { user: { username: "test", isAdmin: "true" } } } as unknown as Response;
    expect(() => ensureCorrectUserInBodyOrAdmin(req, res, next))
        .toThrow(UnauthorizedError);
  });

  test("unauth: if anon", function () {
    const req = { body: { username: "test" } } as unknown as Request;
    const res = { locals: {} } as unknown as Response;
    expect(() => ensureCorrectUserInBodyOrAdmin(req, res, next))
        .toThrow(UnauthorizedError);
  });
})