import { Outlet } from "react-router";

export function AuthLayout() {
  return (
    <div
      className="min-h-screen flex items-center justify-center font-sans"
      style={{ background: "linear-gradient(150deg, #F0F2F8 0%, #ECEEF5 100%)" }}
    >
      <Outlet />
    </div>
  );
}
