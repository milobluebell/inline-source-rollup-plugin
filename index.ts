
import chalk from 'chalk';
import path from 'path';
import { NormalizedOutputOptions, OutputBundle, OutputChunk, OutputAsset, EmittedAsset } from 'rollup';
import { chalkSay } from './utils'
export interface IPluginProps {
  //
  includes: string[] | RegExp;
  // it will terser bundle content
  compress?: boolean;
  // ignorations
  // such as ['async', 'defer', { key: 'type', value: 'module' }, { key: 'rel', value: 'modulepreload' }, { key: 'href', value: '//at.alicdn.com/t/font_2857489_imieufzfwmb.css'}]
  excludeAttrs?: Array<{ key: string, value: string } | string>;
  excludes?: RegExp;
  // if unmet any resource, which level of notification should this launch
  // 2 means 'error'；1 equals 'warn'；0 equals 'none'
  nonMatched?: 2 | 1 | 0 | 'error' | 'warn' | 'none';
  // should it cache remote curl contentn
  cache?: boolean
}

const DEFAULT_CONFIGS = {
  include: /\.(js|css)$/,
  compress: true,
  excludeAttrs: ['async', 'defer', { key: 'type', value: 'module' }, { key: 'rel', value: 'modulepreload' }],
  exclude: /\.(svg|jpg)$/,
  download: true,
  nonMatched: 2,
  cache: true
}
export default function inlineResource(configs?: IPluginProps) {
  const {
    includes: configIncludes = DEFAULT_CONFIGS.include,
    compress = DEFAULT_CONFIGS.compress,
    excludeAttrs = DEFAULT_CONFIGS.excludeAttrs,
    excludes: configExcludes = DEFAULT_CONFIGS.exclude,
    nonMatched = DEFAULT_CONFIGS.nonMatched,
    cache = DEFAULT_CONFIGS.cache
  } = configs || {};

  return {
    name: '@rollup/plugin-inline-resource',
    generateBundle(output: NormalizedOutputOptions, bundles: OutputBundle) {

      // valid checkings
      let configIncludeFuzzyType = Object.prototype.toString.call(configIncludes).toLowerCase();
      if (!configIncludeFuzzyType.includes(' array') && !configIncludeFuzzyType.includes(' regexp')) {
        const includeTypeErrorMsg = `@rollup/plugin-inline-resource\'s input option \'include\' should be an array or RegExp`;
        chalkSay(includeTypeErrorMsg);
        throw new Error(includeTypeErrorMsg);
      }

      // include/exclude option worked here
      const bundleNames = Object.keys(bundles);
      const includeValidationCompare = ((rule) => {
        if (configIncludeFuzzyType.includes(' array')) {
          return function (bundleName: string) {
            return (rule as string[]).includes(path.extname(bundleName).substring(1));
          }
        }
        if (configIncludeFuzzyType.includes(' regexp')) {
          return function (bundleName: string) {
            return (rule as RegExp).test(bundleName)
          }
        }
        return () => false
      })(configIncludes);

      // bundles filterd after include/exclude
      const conditionalBundleNames = bundleNames.filter((bundleName: string) => {
        let includeCondition = includeValidationCompare(bundleName);
        let excludeCondition = configExcludes.test(bundleName);
        return includeCondition && !excludeCondition && path.extname(bundleName) !== '.html';
      });

      // save origin html content
      const originHtmlContent = bundles[bundleNames.filter(name => path.extname(name) === '.html')[0]];
      console.log(originHtmlContent);

      //
      const extractSourceCode = (bundleName: string, bundleWholeInfo: any) => {
        const bundleExtName = path.extname(bundleName);
        if (bundleExtName === '.js') {
          return bundleWholeInfo.code || ' '
        }
        if (bundleExtName === '.css') {
          return bundleWholeInfo?.['source'] || ' '
        }
      }

      chalkSay('here were generateBundle content')
      chalkSay('above were generateBundle\'s content')
      conditionalBundleNames.forEach(name => {
        chalkSay(`bundle name: ${name}`, chalk.blue, false);
        console.log(extractSourceCode(name, bundles[name]));
      });
      chalkSay('Hey, here we test', chalk.bgYellow.blue);

      this.emitFile({
        type: 'asset',
        source: `<!doctype html>
          <body>
          test content
          </body>
        </html>`,
        name: 'Rollup HTML Asset',
        fileName: 'index.html'
      });


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
