/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        // Rewrite MS Graph identification/verification
        source: "/.well-known/microsoft-identity-association.json",
        destination: '/api/ms-identity'
      }
    ]
  }
}
