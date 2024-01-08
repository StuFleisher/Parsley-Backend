"use strict";


/**We have to use ESM syntax to handle typing and to get ts to recognize this as
 * a module instead of a script */
export { };


/**We use common js for other imports to avoid a transpiling issue related to
 * extensions and paths differing in testing and dev environments
*/
const {BCRYPT_WORK_FACTOR} = require('../config'); //this loads the test database
const getPrismaClient = require('../client');
const prisma = getPrismaClient();

const bcrypt = require("bcrypt");
const {
  NotFoundError,
  BadRequestError,
  UnauthorizedError,
} = require("../utils/expressError");
const UserManager = require(`./user`);


/******************************* AUTHENTICATE ***********************/

describe("authenticate", function () {

  const userData = {
    username:"test username",
    password:"test password",
    firstName:"test firstName",
    lastName:"test lastName",
    testEmail:"test@test.com",
    isAdmin: false,
  }

  const returnedUser = {
    username:"test username",
    firstName:"test firstName",
    lastName:"test lastName",
    testEmail:"test@test.com",
    isAdmin: false,
  }

  test("works", async function () {

    const encryptedPassword = await bcrypt.hash(userData.password, BCRYPT_WORK_FACTOR);
    const storedUser = {
      ...userData,
      password:encryptedPassword
    }
    prisma.user.findUnique.mockReturnValueOnce(storedUser);

    const user = await UserManager.authenticate("test username", "test password");
    expect(user).toEqual(returnedUser);
  });

  test("unauth if no such user", async function () {
    prisma.user.findUnique.mockReturnValueOnce(undefined);
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
      password:encryptedPassword
    }
    prisma.user.findUnique.mockReturnValueOnce(storedUser);

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
    username:"test username",
    password:"test password",
    firstName:"test firstName",
    lastName:"test lastName",
    testEmail:"test@test.com",
    isAdmin: false,
  }

  const returnedUser = {
    username:"test username",
    firstName:"test firstName",
    lastName:"test lastName",
    testEmail:"test@test.com",
    isAdmin: false,
  }

  beforeEach(()=>{ jest.clearAllMocks()})

  test("works", async function () {
    const encryptedPassword = await bcrypt.hash(userData.password, BCRYPT_WORK_FACTOR);
    const storedUser = {
      ...userData,
      password:encryptedPassword
    }

    prisma.user.findUnique.mockReturnValueOnce(undefined);
    prisma.user.create.mockReturnValueOnce(storedUser);

    let user = await UserManager.register(userData);
    expect(user).toEqual(returnedUser);
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where:{username:"test username"}
    });
    expect(prisma.user.create).toHaveBeenCalledTimes(1)

  });

  test("works: adds admin", async function () {
    const encryptedPassword = await bcrypt.hash(userData.password, BCRYPT_WORK_FACTOR);
    const storedUser = {
      ...userData,
      password:encryptedPassword
    }

    prisma.user.findUnique.mockReturnValueOnce(undefined);
    prisma.user.create.mockReturnValueOnce({...storedUser, isAdmin:true});

    let user = await UserManager.register({
      ...userData,
      isAdmin: true,
    });
    expect(user).toEqual({ ...returnedUser, isAdmin: true });
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where:{username:"test username"}
    });
    expect(prisma.user.create).toHaveBeenCalledTimes(1)
  });

  test("bad request with dup data", async function () {
    const encryptedPassword = await bcrypt.hash(userData.password, BCRYPT_WORK_FACTOR);
    const storedUser = {
      ...userData,
      password:encryptedPassword
    }

    prisma.user.findUnique.mockReturnValueOnce(storedUser);


    try {
      await UserManager.register({
        ...userData,
        password: "password",
      });
      throw new Error("fail test, you shouldn't get here");
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where:{username:"test username"}
      });
      expect(prisma.user.create).toHaveBeenCalledTimes(0)
    }
  });
});

/************************************** findAll */

describe("findAll", function () {

  const userData1 = {
    username:"test username",
    password:"test password",
    firstName:"test firstName",
    lastName:"test lastName",
    testEmail:"test@test.com",
    isAdmin: false,
  }
  const userData2 = {
    username:"test username2",
    password:"test password",
    firstName:"test firstName2",
    lastName:"test lastName2",
    testEmail:"test@test.com2",
    isAdmin: false,
  }

  test("works", async function () {

    prisma.user.findMany.mockReturnValueOnce([userData1,userData2])

    const users = await UserManager.findAll();

    expect(users).toEqual([
      {
        username:"test username",
        firstName:"test firstName",
        lastName:"test lastName",
        testEmail:"test@test.com",
        isAdmin: false,
      },
      {
        username:"test username2",
        firstName:"test firstName2",
        lastName:"test lastName2",
        testEmail:"test@test.com2",
        isAdmin: false,
      }
    ]);
  });
});

/************************************** get */

describe("get", function () {

  const userData = {
    username:"test username",
    password:"test password",
    firstName:"test firstName",
    lastName:"test lastName",
    testEmail:"test@test.com",
    isAdmin: false,
  }
  const returnedUser = {
    username:"test username",
    firstName:"test firstName",
    lastName:"test lastName",
    testEmail:"test@test.com",
    isAdmin: false,
  }

  test("works", async function () {
    prisma.user.findUniqueOrThrow.mockReturnValueOnce(returnedUser)

    let user = await UserManager.getUser("test username");
    expect(user).toEqual(returnedUser);
    expect(prisma.user.findUniqueOrThrow).toHaveBeenCalledWith({
      where: {username:"test username"},
    })
  });

  test("not found if no such user", async function () {
    prisma.user.findUniqueOrThrow.mockReturnValueOnce(undefined);

    try {
      await UserManager.getUser("nope");
      throw new Error("fail test, you shouldn't get here");
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
      expect(prisma.user.findUniqueOrThrow).toHaveBeenCalledWith({
        where: {username:"nope"},
      })
    }
  });
});


/************************************** update */

describe("update", function () {
  const userData = {
    username:"test username",
    password:"test password",
    firstName:"test firstName",
    lastName:"test lastName",
    testEmail:"test@test.com",
    isAdmin: false,
  }
  const updateData = {
    password:"new password",
    firstName: "new firstName",
    lastName: "new lastName",
    email: "new@email.com",
    isAdmin: true,
  };
  const returnData = {
    username: "test username",
    firstName: "new firstName",
    lastName: "new lastName",
    email: "new@email.com",
    isAdmin: true,
  };

  test("works", async function () {
    prisma.user.update.mockReturnValueOnce({...updateData,username: "test username"})

    let user = await UserManager.updateUser("test username", updateData);
    expect(user).toEqual(returnData);
    expect(prisma.user.update).toHaveBeenCalledWith({
      where:{username:"test username"},
      data: updateData,
    })
  });

  test("works: set password", async function () {

    prisma.user.update.mockImplementationOnce((prismaArgs:any)=>{
      return {
        ...userData,
        extraPassword:prismaArgs.data.password,
      }
    })

    let user = await UserManager.updateUser("test username", {
      password: "new",
    });
    expect(user.extraPassword.startsWith("$2b$")).toEqual(true)
  });

  test("not found if no such user", async function () {
    prisma.user.update.mockImplementationOnce(()=>{throw new Error()})

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
    expect(prisma.user.delete).toHaveBeenCalledWith({where:{username:"test username"}})
  });

  test("not found if no such user", async function () {
    prisma.user.delete.mockImplementationOnce(()=>{throw new Error()})

    try {
      await UserManager.deleteUser("nope");
      throw new Error("fail test, you shouldn't get here");
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});


