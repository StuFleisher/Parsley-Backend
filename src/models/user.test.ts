
import '../config'; //this loads the database

import { BCRYPT_WORK_FACTOR } from '../config'; //this loads the test database
import { prismaMock as prisma } from '../prismaSingleton';

import bcrypt from "bcrypt";
import {
  NotFoundError,
  BadRequestError,
  UnauthorizedError,
} from "../utils/expressError";
import UserManager from "./user";
import { testDate } from '../test/test_common';



/******************************* AUTHENTICATE ***********************/

describe("authenticate", function () {

  const userData = {
    userId: 1,
    username: "test username",
    password: "test password",
    firstName: "test firstName",
    lastName: "test lastName",
    email: "test@test.com",
    isAdmin: false,
  };

  const returnedUser = {
    userId: 1,
    username: "test username",
    firstName: "test firstName",
    lastName: "test lastName",
    email: "test@test.com",
    isAdmin: false,
  };

  test("works", async function () {

    const encryptedPassword = await bcrypt.hash(userData.password, BCRYPT_WORK_FACTOR);
    const storedUser = {
      ...userData,
      password: encryptedPassword
    };
    prisma.user.findUnique.mockResolvedValueOnce(storedUser);

    const user = await UserManager.authenticate("test username", "test password");
    expect(user).toEqual(returnedUser);
  });

  test("unauth if no such user", async function () {
    prisma.user.findUnique.mockResolvedValueOnce(null);
    try {
      await UserManager.authenticate("nope", "password");
      throw new Error("fail test, you shouldn't get here");
    } catch (err) {
      expect(err instanceof UnauthorizedError).toBeTruthy();
    }
  });

  test("unauth if wrong password", async function () {
    const encryptedPassword = await bcrypt.hash(userData.password, BCRYPT_WORK_FACTOR);
    const storedUser = {
      ...userData,
      password: encryptedPassword
    };
    prisma.user.findUnique.mockResolvedValueOnce(storedUser);

    try {
      await UserManager.authenticate("test username", "wrong");
      throw new Error("fail test, you shouldn't get here");
    } catch (err) {
      expect(err instanceof UnauthorizedError).toBeTruthy();
    }
  });
});


/************************************** REGISTER **************************/

describe("register", function () {
  const userData = {
    userId: 1,
    username: "test username",
    password: "test password",
    firstName: "test firstName",
    lastName: "test lastName",
    email: "test@test.com",
    isAdmin: false,
  };

  const returnedUser = {
    userId: 1,
    username: "test username",
    firstName: "test firstName",
    lastName: "test lastName",
    email: "test@test.com",
    isAdmin: false,
  };

  beforeEach(() => { jest.clearAllMocks(); });

  test("works", async function () {
    const encryptedPassword = await bcrypt.hash(userData.password, BCRYPT_WORK_FACTOR);
    const storedUser = {
      ...userData,
      password: encryptedPassword
    };

    prisma.user.findUnique.mockResolvedValueOnce(null);
    prisma.user.create.mockResolvedValueOnce(storedUser);

    let user = await UserManager.register(userData);
    expect(user).toEqual(returnedUser);
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { username: "test username" }
    });
    expect(prisma.user.create).toHaveBeenCalledTimes(1);

  });

  test("works: adds admin", async function () {
    const encryptedPassword = await bcrypt.hash(userData.password, BCRYPT_WORK_FACTOR);
    const storedUser = {
      ...userData,
      password: encryptedPassword
    };

    prisma.user.findUnique.mockResolvedValueOnce(null);
    prisma.user.create.mockResolvedValueOnce({ ...storedUser, isAdmin: true });

    let user = await UserManager.register({
      ...userData,
      isAdmin: true,
    });
    expect(user).toEqual({ ...returnedUser, isAdmin: true });
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { username: "test username" }
    });
    expect(prisma.user.create).toHaveBeenCalledTimes(1);
  });

  test("bad request with dup data", async function () {
    const encryptedPassword = await bcrypt.hash(userData.password, BCRYPT_WORK_FACTOR);
    const storedUser = {
      ...userData,
      password: encryptedPassword
    };

    prisma.user.findUnique.mockResolvedValueOnce(storedUser);


    try {
      await UserManager.register({
        ...userData,
        password: "password",
      });
      throw new Error("fail test, you shouldn't get here");
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { username: "test username" }
      });
      expect(prisma.user.create).toHaveBeenCalledTimes(0);
    }
  });
});

/************************************** findAll */

describe("findAll", function () {

  const userData1 = {
    userId: 1,
    username: "test username",
    password: "test password",
    firstName: "test firstName",
    lastName: "test lastName",
    email: "test@test.com",
    isAdmin: false,
  };
  const userData2 = {
    userId: 2,
    username: "test username2",
    password: "test password",
    firstName: "test firstName2",
    lastName: "test lastName2",
    email: "test@test.com2",
    isAdmin: false,
  };

  test("works", async function () {

    prisma.user.findMany.mockResolvedValueOnce([userData1, userData2]);

    const users = await UserManager.findAll();

    expect(users).toEqual([
      {
        userId: 1,
        username: "test username",
        firstName: "test firstName",
        lastName: "test lastName",
        email: "test@test.com",
        isAdmin: false,
      },
      {
        userId: 2,
        username: "test username2",
        firstName: "test firstName2",
        lastName: "test lastName2",
        email: "test@test.com2",
        isAdmin: false,
      }
    ]);
  });
});

/************************************** get */

describe("get", function () {

  const userData = {
    userId: 1,
    username: "test username",
    password: "test password",
    firstName: "test firstName",
    lastName: "test lastName",
    email: "test@test.com",
    isAdmin: false,
    recipes: [],
  };
  const returnedUser = {
    userId: 1,
    username: "test username",
    firstName: "test firstName",
    lastName: "test lastName",
    email: "test@test.com",
    isAdmin: false,
    recipes: [],
  };

  test("works", async function () {
    prisma.user.findUniqueOrThrow.mockResolvedValueOnce(userData);

    let user = await UserManager.getUser("test username");
    expect(user).toEqual(returnedUser);
    expect(prisma.user.findUniqueOrThrow).toHaveBeenCalledWith({
      where: { username: "test username" },
      include: {
        recipes: true,
        cookbook: true,
      },
    });
  });

  test("not found if no such user", async function () {
    prisma.user.findUniqueOrThrow.mockImplementationOnce(
      () => { throw new Error("error"); }
    );

    try {
      await UserManager.getUser("nope");
      throw new Error("fail test, you shouldn't get here");
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
      expect(prisma.user.findUniqueOrThrow).toHaveBeenCalledWith({
        where: { username: "nope" },
        include: {
          recipes: true,
          cookbook: true,
        },
      });
    }
  });
});


/************************************** update */

describe("getUserCookbook", function () {

  test("works", async function () {

    prisma.recipe.findMany.mockResolvedValueOnce([{
      recipeId: 1,
      "name": "R1Name",
      "description": "R1Description",
      "sourceUrl": "http://R1SourceUrl.com",
      "sourceName": "R1SourceName",
      imageSm: "http://R1ImageUrl.com/sm",
      imageMd: "http://R1ImageUrl.com/md",
      imageLg: "http://R1ImageUrl.com/lg",
      "owner": "u1",
      createdTime: testDate,
    }]);

    const cookbook = await UserManager.getUserCookbook("u1");

    expect(prisma.recipe.findMany).toHaveBeenCalledWith({
      where: {
        cookbooks: {
          some: {
            user: {
              username: "u1"
            }
          }
        }
      }
    });

    expect(cookbook).toEqual([{
      recipeId: 1,
      "name": "R1Name",
      "description": "R1Description",
      "sourceUrl": "http://R1SourceUrl.com",
      "sourceName": "R1SourceName",
      "imageUrl": "http://R1ImageUrl.com",
      "owner": "u1",
      "createdTime": testDate,
    }]);


  });
});


/************************************** update */

describe("update", function () {
  const userData = {
    userId: 1,
    username: "test username",
    password: "test password",
    firstName: "test firstName",
    lastName: "test lastName",
    email: "test@test.com",
    isAdmin: false,
  };
  const updateData = {
    userId: 1,
    password: "new password",
    firstName: "new firstName",
    lastName: "new lastName",
    email: "new@email.com",
    isAdmin: true,
  };
  const returnData = {
    userId: 1,
    username: "test username",
    firstName: "new firstName",
    lastName: "new lastName",
    email: "new@email.com",
    isAdmin: true,
  };

  test("works", async function () {
    prisma.user.update.mockResolvedValueOnce({ ...updateData, username: "test username" });

    let user = await UserManager.updateUser("test username", updateData);
    expect(user).toEqual(returnData);
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { username: "test username" },
      data: updateData,
    });
  });

  test("not found if no such user", async function () {
    prisma.user.update.mockImplementationOnce(() => { throw new Error(); });

    try {
      await UserManager.updateUser("nope", {
        firstName: "test",
      });
      throw new Error("fail test, you shouldn't get here");
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("bad request if no data", async function () {

    try {
      await UserManager.updateUser("c1", {});
      throw new Error("fail test, you shouldn't get here");
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** DELETE *******************************/

describe("remove", function () {
  test("works", async function () {
    await UserManager.deleteUser("test username");
    expect(prisma.user.delete).toHaveBeenCalledWith({ where: { username: "test username" } });
  });

  test("not found if no such user", async function () {
    prisma.user.delete.mockImplementationOnce(() => { throw new Error(); });

    try {
      await UserManager.deleteUser("nope");
      throw new Error("fail test, you shouldn't get here");
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});


