const path = require("path")

module.exports = {
  entry: "./octoprint_onedrive_backup/static/src/onedrive.tsx",
  output: {
    filename: "onedrive_backup.js",
    path: path.resolve(__dirname, "octoprint_onedrive_backup/static/dist")
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js"]
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/, loader: "ts-loader"
      },
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env", "@babel/preset-react"]
          }
        }
      }
    ]
  }
}
