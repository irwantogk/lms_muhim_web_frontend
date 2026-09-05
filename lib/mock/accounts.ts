import type { Role } from "../types.ts";

export interface DemoAccount {
  role: Role;
  name: string;
  email: string;
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    role: "admin",
    name: "Dewi Anggraini",
    email: "admin@cendekia.sch.id",
  },
  {
    role: "guru",
    name: "Budi Santoso",
    email: "budi.santoso@cendekia.sch.id",
  },
  {
    role: "murid",
    name: "Rani Aulia",
    email: "rani.aulia@cendekia.sch.id",
  },
  {
    role: "orang_tua",
    name: "Siti Rahayu",
    email: "siti.rahayu@mail.com",
  },
];
