import type { ROLES } from "../../types";

// types of signup body
export interface IUserSignUp {
  name: string;
  email: string;
  password: string;
  role?: ROLES;
}

// types of login body
export interface IUserLogin {
  email: string;
  password: string;
}
