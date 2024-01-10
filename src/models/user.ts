"use strict"

import { Prisma } from "@prisma/client";
import { error } from "console";

/**We have to use ESM syntax to handle typing and to get ts to recognize this as
 * a module instead of a script */
export { };


/**We use common js for other imports to avoid a transpiling issue related to
 * extensions and paths differing in testing and dev environments
*/
const { DATABASE_URL, BCRYPT_WORK_FACTOR } = require('../config');
const getPrismaClient = require('../client');
const prisma = getPrismaClient();


const bcrypt = require("bcrypt");
const {
  NotFoundError,
  BadRequestError,
  UnauthorizedError,
} = require("../utils/expressError");

type userData = {
  username:string,
  password:string,
  firstName:string,
  lastName:string,
  email:string,
  isAdmin:boolean,
}
type updateData = {
  password?:string,
  firstName?:string,
  lastName?:string,
  email?:string,
  isAdmin?:boolean,
}


class UserManager {

  /**Authenticate a user with username/password
   * Returns {username, firstName, lastName, email, isAdmin}
   * Throws UnauthorizedError is user not found or wrong password.
  */
  static async authenticate(username:string, password:string){
    const user = await prisma.user.findUnique({
      where:{username:username}
    })

    if (user){
      const isValid = await bcrypt.compare(password, user.password)
      if (isValid === true){
        delete user.password;
        return user;
      }
    }

    throw new UnauthorizedError("Invalid username/password")
  }


  /** Register a user with userdata
   * Returns {username, firstName, lastName, email, isAdmin}
   * Throws BadRequestError on duplicates
   */
  static async register(userData:userData){
    //duplicate check
    const user = await prisma.user.findUnique({
      where:{username:userData.username}
    })
    if (user) throw new BadRequestError(`Username ${user} already exists`)

    const hashedPassword = await bcrypt.hash(userData.password, BCRYPT_WORK_FACTOR)
    userData.password = hashedPassword;

    console.log(userData)

    const newUser = await prisma.user.create({
      data: userData
    })
    delete newUser.password;

    return newUser;
  }

  /** Returns a list of userData without passwords */
  static async findAll() {
    let users = await prisma.user.findMany();
    const response = users.map((user:userData)=>{
      delete user.password;
      return user;
    })

    return response;
  }

  /** Fetches a User by username.
   * Returns {username, firstName, lastName, email, isAdmin}
   * Throws NotFoundError on missing record
   */
  static async getUser(username:string){
    try{
      let user = prisma.user.findUniqueOrThrow({
        where:{username}
      })
      delete user.password;
      return user;
    } catch(err){
      throw new NotFoundError("User not found")
    }
  }


  /** Update user data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain
   * all the fields; this only changes provided ones.
   *
   * Data can include:
   *   { firstName, lastName, password, email, isAdmin }
   *
   * Returns { username, firstName, lastName, email, isAdmin }
   *
   * Throws NotFoundError if not found.
   *
   * WARNING: this function can set a new password or make a user an admin.
   * Callers of this function must be certain they have validated inputs to this
   * or a serious security risks are opened.
   */
  static async updateUser(username:string, userData:updateData){
    if (userData.password) {
      userData.password = await bcrypt.hash(userData.password, BCRYPT_WORK_FACTOR);
    }

    if (!userData || !Object.keys(userData).length) {
      throw new BadRequestError("No data provided")
    }

    try{
      const user = prisma.user.update({
        where:{
          username:username,
        },
        data:userData
      })
      delete user.password;
      return user;
    } catch(err){
      console.log(err)
      throw new NotFoundError('User not found');
    }
  }

  /** Delete given user from database; returns undefined. */
  static async deleteUser(username:string){
    try{
      prisma.user.delete({
        where:{username}
      })
    } catch(err){
      throw new NotFoundError("User not found")
    }
  }

}

module.exports = UserManager;