import { redirect } from "next/navigation";

// Пайдаланушылар енді админ панельде өңделеді.
export default function UsersPage() {
  redirect("/admin/users");
}
