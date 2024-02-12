import '../config';

import { BCRYPT_WORK_FACTOR } from '../config';
import prisma from '../prismaClient';

import bcrypt from "bcrypt";

import {
  NotFoundError,
  BadRequestError,
  UnauthorizedError,
} from '../utils/expressError';

type UserDataForCreate = {
  username:string,
  password:string,
  firstName:string,
  lastName:string,
  email:string,
  isAdmin:boolean,
}

type UserData = {
  userId:number,
  username:string,
  password?:string,
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
   * Returns {userId, username, firstName, lastName, email, isAdmin}
   * Throws UnauthorizedError is user not found or wrong password.
  */
  static async authenticate(username:string, password:string):Promise<UserData>{
    const fullUserData = await prisma.user.findUnique({
      where:{username:username}
    })

    if (fullUserData){
      const isValid = await bcrypt.compare(password, fullUserData.password)
      if (isValid === true){
        let user:UserData = fullUserData;
        delete user.password;
        return user;
      }
    }

    throw new UnauthorizedError("Invalid username/password")
  }


  /** Register a user with userdata
   * Returns {userId, username, firstName, lastName, email, isAdmin}
   * Throws BadRequestError on duplicates
   */
  static async register(userData:UserDataForCreate):Promise<UserData>{
    //duplicate check
    const user = await prisma.user.findUnique({
      where:{username:userData.username}
    })
    if (user) throw new BadRequestError(`Username ${user.username} already exists`)

    const hashedPassword = await bcrypt.hash(userData.password, BCRYPT_WORK_FACTOR)
    userData.password = hashedPassword;

    const savedUser = await prisma.user.create({
      data: userData
    })
    let newUser:UserData = savedUser;
    delete newUser.password;

    return newUser;
  }

  /** Returns a list of userData without passwords */
  static async findAll() {
    let users = await prisma.user.findMany();
    const response = users.map((user:UserData)=>{
      delete user.password;
      return user;
    })

    return response;
  }

  /** Fetches a User by username.
   * Returns {username, firstName, lastName, email, isAdmin}
   * Throws NotFoundError on missing record
   */
  static async getUser(username:string):Promise<UserData>{
    try{
      let fullUserData = await prisma.user.findUniqueOrThrow({
        where:{username},
        include:{recipes:true}
      })
      let user:UserData = fullUserData;
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
  static async updateUser(
    username:string, userData:updateData
  ):Promise<UserData>{
    if (userData.password) {
      userData.password = await bcrypt.hash(userData.password, BCRYPT_WORK_FACTOR);
    }

    if (!userData || !Object.keys(userData).length) {
      throw new BadRequestError("No data provided")
    }

    try{
      const updatedUser = await prisma.user.update({
        where:{
          username:username,
        },
        data:userData
      })
      let user:UserData = updatedUser;//type change
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

export default UserManager;