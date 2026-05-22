import type { AppLocale, RoleOption, UserRole } from "./types";

export const roleOptions: RoleOption[] = [
  {
    role: "ADMIN",
    title: "Admin Koperasi",
    description: "Daftarkan anggota, isi saldo, dan reset status kartu.",
    defaultMode: "station",
    allowedModes: ["station"],
  },
  {
    role: "GATE",
    title: "Petugas Pintu Masuk",
    description: "Melakukan check-in anggota.",
    defaultMode: "gate",
    allowedModes: ["gate"],
  },
  {
    role: "TERMINAL",
    title: "Petugas Pintu Keluar",
    description: "Melakukan check-out dan pemotongan saldo.",
    defaultMode: "terminal",
    allowedModes: ["terminal"],
  },
  {
    role: "MEMBER",
    title: "Anggota Koperasi",
    description: "Melihat isi kartu pribadi.",
    defaultMode: "scout",
    allowedModes: ["scout"],
  },
];

const roleContent: Record<
  AppLocale,
  Record<UserRole, { title: string; description: string }>
> = {
  id: {
    ADMIN: {
      title: "Admin Koperasi",
      description: "Daftarkan anggota, isi saldo, dan reset status kartu.",
    },
    GATE: {
      title: "Petugas Pintu Masuk",
      description: "Melakukan check-in anggota.",
    },
    TERMINAL: {
      title: "Petugas Pintu Keluar",
      description: "Melakukan check-out dan pemotongan saldo.",
    },
    MEMBER: {
      title: "Anggota Koperasi",
      description: "Melihat isi kartu pribadi.",
    },
  },
  en: {
    ADMIN: {
      title: "Cooperative Admin",
      description: "Register members, add balance, and reset card status.",
    },
    GATE: {
      title: "Entry Gate Officer",
      description: "Check members in.",
    },
    TERMINAL: {
      title: "Exit Gate Officer",
      description: "Check members out and deduct balance.",
    },
    MEMBER: {
      title: "Cooperative Member",
      description: "View personal card information.",
    },
  },
};

export function roleTitle(role: UserRole, locale: AppLocale) {
  return roleContent[locale][role].title;
}

export function roleDescription(role: UserRole, locale: AppLocale) {
  return roleContent[locale][role].description;
}
