import path from "path";
import dotenv from "dotenv";

let backendEnvLoaded = false;

function loadBackendEnv() {
  if (backendEnvLoaded) return;
  dotenv.config({ path: path.resolve(process.cwd(), "server/.env") });
  backendEnvLoaded = true;
}

export function getAdminCredentials() {
  loadBackendEnv();
  return {
    username: process.env.ADMIN_USERNAME,
    password: process.env.ADMIN_PASSWORD,
  };
}
