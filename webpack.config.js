const path = require("path")

module.exports = {
  entry: "./octoprint_onedrive_backup/static/src/onedrive.js",
  output: {
    filename: "onedrive_backup.js",
    path: path.resolve(__dirname, "octoprint_onedrive_backup/static/dist")
  },
  module: {
    rules: [
      {
        test: /\.m?js$/,
        exclude: /(node_modules|bower_components)/,
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
