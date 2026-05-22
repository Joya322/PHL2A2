// types of signup body
export interface IUserSignUp {
  name: string;
  email: string;
  password: string;
  role: string;
}

// types of login body
export interface IUserLogin {
  email: string;
  password: string;
}
