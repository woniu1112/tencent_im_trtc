import babel from 'rollup-plugin-babel';
// import { terser } from 'rollup-plugin-terser';
import ignore from 'rollup-plugin-ignore';
import commonjs from '@rollup/plugin-commonjs';
import replace from 'rollup-plugin-replace';
import aliasPlugin from '@rollup/plugin-alias';
import resolve from '@rollup/plugin-node-resolve';
import json from '@rollup/plugin-json'; // 可以引用json文件

const env = process.env.NODE_ENV;

export default {
  input: 'src/index.js', // 入口文件
  output: {
    file: 'lib/index.js', // 输出文件
    format: 'umd', // 输出格式 (通用模块定义)
    name: 'jkyTRTC', // 生成的全局变量名
    sourcemap: true, // 生成 sourcemap00..
  },
  plugins: [
    aliasPlugin({
      entries: [{ find: '@', replacement: __dirname + '/src' }],
    }),
    resolve({ mainFields: ['jsnext', 'preferBuiltins', 'browser'] }),
    ignore(['**/*.min.js']),
    commonjs(),
    babel({
      exclude: 'node_modules/**', // 排除 node_modules
      // presets: ['@babel/preset-env'], // 使用 Babel 预设
    }),
    replace({
      'process.env.NODE_ENV': JSON.stringify(env),
    }),
    json(),
    // terser(), // 压缩代码
  ],
};
