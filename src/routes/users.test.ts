import '../config'; //this loads the test database
import request from 'supertest';
import app from '../app';
import UserManager from '../models/user';
import { adminToken, u1Token, u2Token, commonBeforeEach } from '../test/test_common';
import { NotFoundError } from '../utils/expressError';

beforeEach(commonBeforeEach);

/************************************** POST /users */

describe("POST /users", function () {

  const mockedRegister = jest.spyOn(UserManager, "register")

  test("works for admins: create non-admin", async function () {

    mockedRegister.mockResolvedValueOnce({
      userId:1,
      username: "u-new",
      password:"hashedPass",
      firstName: "First-new",
      lastName: "Last-newL",
      email: "new@email.com",
      isAdmin: false,
    })

    const resp = await request(app)
        .post("/users")
        .send({
          username: "u-new",
          firstName: "First-new",
          lastName: "Last-newL",
          password: "password-new",
          email: "new@email.com",
          isAdmin: false,
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      user: {
        username: "u-new",
        firstName: "First-new",
        lastName: "Last-newL",
        email: "new@email.com",
        isAdmin: false,
      }, token: expect.any(String),
    });
  });

  test("works for admins: create admin", async function () {

    mockedRegister.mockResolvedValueOnce({
      userId:1,
      username: "u-new",
      password:"hashedPass",
      firstName: "First-new",
      lastName: "Last-newL",
      email: "new@email.com",
      isAdmin: false,
    })

    const resp = await request(app)
        .post("/users")
        .send({
          username: "u-new",
          firstName: "First-new",
          lastName: "Last-newL",
          password: "password-new",
          email: "new@email.com",
          isAdmin: true,
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      user: {
        username: "u-new",
        firstName: "First-new",
        lastName: "Last-newL",
        email: "new@email.com",
        isAdmin: true,
      }, token: expect.any(String),
    });
  });

  test("unauth for users", async function () {

    const resp = await request(app)
        .post("/users")
        .send({
          username: "u-new",
          firstName: "First-new",
          lastName: "Last-newL",
          password: "password-new",
          email: "new@email.com",
          isAdmin: true,
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {

    const resp = await request(app)
        .post("/users")
        .send({
          username: "u-new",
          firstName: "First-new",
          lastName: "Last-newL",
          password: "password-new",
          email: "new@email.com",
          isAdmin: true,
        });
    expect(resp.statusCode).toEqual(401);
  });

  test("bad request if missing data", async function () {
    const resp = await request(app)
        .post("/users")
        .send({
          username: "u-new",
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request if invalid data - admin", async function () {
    const resp = await request(app)
        .post("/users")
        .send({
          username: "u-new",
          firstName: "First-new",
          lastName: "Last-newL",
          password: "password-new",
          email: "not-an-email",
          isAdmin: true,
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("unauth if invalid data - non-admin", async function () {
    const resp = await request(app)
        .post("/users")
        .send({
          username: "u-new",
          firstName: "First-new",
          lastName: "Last-newL",
          password: "password-new",
          email: "not-an-email",
          isAdmin: true,
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth if invalid data - anon", async function () {
    const resp = await request(app)
        .post("/users")
        .send({
          username: "u-new",
          firstName: "First-new",
          lastName: "Last-newL",
          password: "password-new",
          email: "not-an-email",
          isAdmin: true,
        });
    expect(resp.statusCode).toEqual(401);
  });
});


/************************************** GET /users */

describe("GET /users", function () {

  const mockedFindAll = jest.spyOn(UserManager, "findAll")

  test("works for admins", async function () {

    mockedFindAll.mockResolvedValueOnce([
    {
      userId:1,
      username: "u1",
      firstName: "U1F",
      lastName: "U1L",
      email: "user1@user.com",
      isAdmin: false,
    },
    {
      userId:2,
      username: "u2",
      firstName: "U2F",
      lastName: "U2L",
      email: "user2@user.com",
      isAdmin: false,
    },
    {
      userId:3,
      username: "u3",
      firstName: "U3F",
      lastName: "U3L",
      email: "user3@user.com",
      isAdmin: false,
    }])

    const resp = await request(app)
        .get("/users")
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({
      users: [
        {
          userId:1,
          username: "u1",
          firstName: "U1F",
          lastName: "U1L",
          email: "user1@user.com",
          isAdmin: false,
        },
        {
          userId:2,
          username: "u2",
          firstName: "U2F",
          lastName: "U2L",
          email: "user2@user.com",
          isAdmin: false,
        },
        {
          userId:3,
          username: "u3",
          firstName: "U3F",
          lastName: "U3L",
          email: "user3@user.com",
          isAdmin: false,
        },
      ],
    });
  });

  test("unauth for non-admin users", async function () {
    const resp = await request(app)
        .get("/users")
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
        .get("/users");
    expect(resp.statusCode).toEqual(401);
  });
});


/************************************** GET /users/:username */

describe("GET /users/:username", function () {

  const mockedGet = jest.spyOn(UserManager, "getUser")

  test("works for admin", async function () {

    mockedGet.mockResolvedValueOnce({
      userId:1,
      username: "u1",
      firstName: "U1F",
      lastName: "U1L",
      email: "user1@user.com",
      isAdmin: false,
    })

    const resp = await request(app)
        .get(`/users/u1`)
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({
      user: {
        userId:1,
        username: "u1",
        firstName: "U1F",
        lastName: "U1L",
        email: "user1@user.com",
        isAdmin: false,
      },
    });
  });

  test("works for same user", async function () {

    mockedGet.mockResolvedValueOnce({
      userId:1,
      username: "u1",
      firstName: "U1F",
      lastName: "U1L",
      email: "user1@user.com",
      isAdmin: false,
    })

    const resp = await request(app)
        .get(`/users/u1`)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({
      user: {
        userId:1,
        username: "u1",
        firstName: "U1F",
        lastName: "U1L",
        email: "user1@user.com",
        isAdmin: false,
      },
    });
  });

  test("unauth for other users", async function () {
    const resp = await request(app)
        .get(`/users/u1`)
        .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
        .get(`/users/u1`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found if user not found - admin", async function () {
    const resp = await request(app)
        .get(`/users/nope`)
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("unauth if user not found - non-admin", async function () {
    const resp = await request(app)
        .get(`/users/nope`)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth if user not found - anon", async function () {
    const resp = await request(app).get(`/users/nope`);
    expect(resp.statusCode).toEqual(401);
  });
});


/************************************** PATCH /users/:username */

describe("PATCH /users/:username", () => {

  const mockUpdateUser = jest.spyOn(UserManager,"updateUser")

  test("works for admins", async function () {

    mockUpdateUser.mockResolvedValueOnce({
        userId:1,
        username: "u1",
        firstName: "New",
        lastName: "U1L",
        email: "user1@user.com",
        isAdmin: false,
    })

    const resp = await request(app)
        .patch(`/users/u1`)
        .send({
          firstName: "New",
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({
      user: {
        userId:1,
        username: "u1",
        firstName: "New",
        lastName: "U1L",
        email: "user1@user.com",
        isAdmin: false,
      },
    });
  });

  test("works for same user", async function () {

    mockUpdateUser.mockResolvedValueOnce({
      userId:1,
      username: "u1",
      firstName: "New",
      lastName: "U1L",
      email: "user1@user.com",
      isAdmin: false,
    })

    const resp = await request(app)
        .patch(`/users/u1`)
        .send({
          firstName: "New",
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({
      user: {
        userId:1,
        username: "u1",
        firstName: "New",
        lastName: "U1L",
        email: "user1@user.com",
        isAdmin: false,
      },
    });
  });

  test("unauth if not same user", async function () {
    const resp = await request(app)
        .patch(`/users/u1`)
        .send({
          firstName: "New",
        })
        .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
        .patch(`/users/u1`)
        .send({
          firstName: "New",
        });
    expect(resp.statusCode).toEqual(401);
  });

  test("not found if no such user", async function () {
    const resp = await request(app)
        .patch(`/users/nope`)
        .send({
          firstName: "Nope",
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("bad request if invalid data - admin", async function () {
    const resp = await request(app)
        .patch(`/users/u1`)
        .send({
          firstName: 42,
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("unauth if invalid data - non-admin diff user", async function () {
    const resp = await request(app)
        .patch(`/users/u1`)
        .send({
          firstName: 42,
        })
        .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth if invalid data - anon", async function () {
    const resp = await request(app)
        .patch(`/users/u1`)
        .send({
          firstName: 42,
        });
    expect(resp.statusCode).toEqual(401);
  });

});

/************************************** DELETE /users/:username */

describe("DELETE /users/:username", function () {

  const mockDeleteUser = jest.spyOn(UserManager,"deleteUser")

  test("works for admin", async function () {
    const resp = await request(app)
        .delete(`/users/u1`)
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({ deleted: "u1" });
    expect(mockDeleteUser).toHaveBeenCalledWith("u1")
  });

  test("works for same user", async function () {
    const resp = await request(app)
        .delete(`/users/u1`)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({ deleted: "u1" });
    expect(mockDeleteUser).toHaveBeenCalledWith("u1")
  });

  test("unauth if not same user", async function () {
    const resp = await request(app)
        .delete(`/users/u1`)
        .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
        .delete(`/users/u1`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found if user missing - admin", async function () {

    mockDeleteUser.mockImplementationOnce(()=>{
      throw new NotFoundError();
    })

    const resp = await request(app)
        .delete(`/users/nope`)
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("unauth if user missing - non-admin", async function () {
    const resp = await request(app)
        .delete(`/users/nope`)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth if user missing - anon", async function () {
    const resp = await request(app).delete(`/users/nope`);
    expect(resp.statusCode).toEqual(401);
  });
});