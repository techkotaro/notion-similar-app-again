// const { defineConfig } = require('@vue/cli-service')
// module.exports = defineConfig({
//   transpileDependencies: true
// })

module.exports = {
  devServer: {
    port: 8081,
    allowedHosts: 'all',
    host: 'localhost',
  },
  pages: {
    index: {
      entry: "src/main.js",
      title: "TechpitNotion",
    }
  },
};
