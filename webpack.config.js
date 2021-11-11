const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");

const environment = process.env.NODE_ENV || "development";

module.exports = {
  mode: environment,
  devtool: "inline-source-map",

  entry: {
    content: "./src/app/content.ts",
    kinDraw: "./src/app/kinDraw.ts",
  },

  output: {
    path: path.resolve(__dirname, "dist"),
    publicPath: "",
    filename: "js/[name].js",
  },

  resolve: {
    extensions: [".ts", ".tsx", ".js"],
  },

  plugins: [
    new CopyPlugin({
      patterns: [
        { from: "src/icons/", to: "icons" },
        { from: "src/css/", to: "css" },
      ],
    }),
  ],

  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: "ts-loader",
      },
      {
        test: /\/manifest\.json$/,
        use: [
          {
            loader: "file-loader",
            options: {
              name: "[name].[ext]",
            },
          },
          "extract-loader",
          {
            loader: "chrome-manifest-loader",
            options: {
              mapVersion: true,
            },
          },
        ],
        type: "javascript/auto",
      },
    ],
  },
};
