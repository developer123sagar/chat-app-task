import { Prisma } from "@prisma/client";

export type AuthFormValues = {
  name?: string;
  email: string;
  password: string;
};

export type UserData = Prisma.UserGetPayload<{
  select: {
    id: true;
    email: true;
    name: true;
    avatar: true;
  };
}>;

export type UsersDataList = UserData[];
