var path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')

const config = (mode) => ({
  mode,
  optimization: {
    sideEffects: true,
  },
  entry: path.resolve(__dirname, 'index.ts'),
  output: {
    path: path.resolve(__dirname, '/dist'),
    filename: 'bundle.js',
  },
  devServer: {
    contentBase: path.resolve(__dirname, 'public'),
    port: 8000,
    publicPath: '/',
  },
  plugins: [
    new HtmlWebpackPlugin({
      inject: true,
      template: path.resolve(__dirname, 'public/index.html'),
    }),
  ],
  resolve: { extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'] },
  module: {
    rules: [
      { test: /\.tsx?$/, exclude: /node_modules/, use: ['ts-loader'] },
      {
        test: /(\.css)$/,
        exclude: /node_modules/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  devtool: mode === 'development' ? 'source-map' : false,
})

module.exports = (env, argv) => config(argv.mode)
