
import chalk from 'chalk';
import { NormalizedOutputOptions, OutputBundle, EmittedAsset } from 'rollup';
import { chalkSay } from './utils'
export interface IPluginProps {
  // 配置那些资源需要内联
  include?: string[] | RegExp;
  // 是否压缩
  compress?: boolean;
  // 遇到哪些属性就使此插件忽略内联请求
  // 比如 ['async', 'defer', { key: 'type', value: 'module' }, { key: 'rel', value: 'modulepreload' }, { key: 'href', value: '//at.alicdn.com/t/font_2857489_imieufzfwmb.css'}]
  excludeAttrs?: Array<{ key: string, value: string } | string>;
  exclude?: RegExp;
  // 项目根目录
  root?: string;
  // 是否允许从远程获取资源？
  // 比如http://cdn.t.com/xxx.js就会去发送请求来获取资源
  download?: boolean;
  // 没有找到资源的解决策略
  // 2代表error；1代表warn；0代表none
  nonMatched?: 2 | 1 | 0 | 'error' | 'warn' | 'none';
}

const DEFAULT_CONFIGS = {
  include: /\.(js|css)$/,
  compress: true,
  excludeAttrs: ['async', 'defer', { key: 'type', value: 'module' }, { key: 'rel', value: 'modulepreload' }],
  exclude: /\.(svg|jpg)$/,
  download: true,
  nonMatched: 2
}

export default function inlineResource(configs: IPluginProps) {
  const { include, compress = DEFAULT_CONFIGS.compress, excludeAttrs = DEFAULT_CONFIGS.excludeAttrs, exclude = DEFAULT_CONFIGS.exclude, download = DEFAULT_CONFIGS.download, nonMatched = DEFAULT_CONFIGS.nonMatched } = configs;
  return {
    name: 'rollup-plugin-inline-source',
    // @ts-ignore
    async generateBundle: (output: NormalizedOutputOptions, bundles: OutputBundle) => {
      chalkSay('here were generateBundle content')
      console.log(Object.values(bundles));
      chalkSay('above were generateBundle\'s content')
      console.log(Object.keys(bundles));
      chalkSay('Hey, here we test', chalk.bgYellow.blue);


      /**
       * Main
       */
      // const scanFiles = ['index.html'];
      // const terserOption = {
      //   removeComments: true,
      //   collapseWhitespace: true,
      //   removeEmptyAttributes: true,
      // };
      // //
      // const scannedFileContent = getLocalFileSourceContent(scanFiles[0]);
      // const scriptNodeStrings = scannedFileContent.match(/\<script.+\>\<\/script\>/g);
      // const linkNodeStrings = scannedFileContent.match(/\<link.+\/?>/g);
      // const needMountNodes = [...scriptNodeStrings, ...linkNodeStrings].filter(function (nodeContent) {
      //   return checkShouldMount(nodeContent, ['async', 'defer', { key: 'rel', value: 'modulepreload' }]);
      // });
      // let result = scannedFileContent;
      // console.log('----- COMMON.baseUrl is: ' + COMMON.baseUrl);
      // console.log('Mounting resources are: ');
      // console.table(needMountNodes);
      // needMountNodes.forEach(async (nodeString) => {
      //   const absPath = path.join(COMMON.distDir, extractTargetPath(nodeString));
      //   if (fs.existsSync(absPath) || fs.existsSync(absPath.replace(COMMON.baseUrl, ''))) {
      //     new RegExp(nodeString, 'g').test(result) && console.log('⛵ Located ' + nodeString, ', whoes resource at ' + absPath);
      //     // 在dist里
      //     result = result.replace(new RegExp(nodeString, 'g'), `<${extractTagName(nodeString)} ${extractProperties(nodeString).join(' ')}>${fs.readFileSync(absPath)}</${extractTagName(nodeString)}>`);
      //     console.log('🚗 Mounting ' + nodeString, ', to inline resource, with properties settled as: ' + extractProperties(nodeString).join(' and '));
      //   } else {
      //     // 是远程的
      //     new RegExp(nodeString, 'g').test(result) && console.log('⛵ Remote requested ' + nodeString, 'at URL: ' + extractTargetPath(nodeString));
      //     const requestedContent = await getRemoteSourceContent(extractTargetPath(nodeString));
      //     const content = await minify(requestedContent, terserOption);
      //     result = result.replace(new RegExp(nodeString, 'g'), `<${extractTagName(nodeString)} ${extractProperties(nodeString).join(' ')}>${content}</${extractTagName(nodeString)}>`);
      //     console.log('🚗 Mounting ' + nodeString, ', to inline resource, with properties settled as: ' + extractProperties(nodeString).join(' and '));
      //   }
      // });

    }
  }
}
