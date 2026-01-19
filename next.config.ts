import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  webpack(config, { dev }) {
    // ✅ En DEV evita devtools que usan eval (mejora compat con CSP estricta)
    if (dev) {
      config.devtool = "source-map"
    }
    return config
  },

  // (Opcional) si luego quieres controlar headers desde aquí:
  // async headers() {
  //   return [
  //     {
  //       source: "/:path*",
  //       headers: [
  //         // Ejemplo CORS (SIN credentials):
  //         // { key: "Access-Control-Allow-Origin", value: "*" },
  //       ],
  //     },
  //   ]
  // },
}

export default nextConfig
