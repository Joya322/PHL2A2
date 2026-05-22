import type { IUser } from "../user/user.interface";

// signup user | create user into DB
const signupUserIntoDB = async (payload: IUser) => {
  const result = 0;

  return result;
};

// login user into DB
const loginUserIntoDB = async (payload: IUser) => {
  const result = 0;

  return result;
};

export const authService = {
  signupUserIntoDB,
  loginUserIntoDB,
};
