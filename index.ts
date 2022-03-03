
import chalk from 'chalk';
import path from 'path';
import { NormalizedOutputOptions, OutputBundle, OutputChunk, OutputAsset, EmittedAsset } from 'rollup';
import { chalkSay, getDomNodeStringFromSourceProp, extractExpectedTagName, createDomNodeString, extractProperties } from './utils';
import { minify } from 'html-minifier-terser'
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
  cache?: boolean;
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

      //
      const extractSourceCode = (bundleName: string, bundleWholeInfo: any) => {
        const bundleExtName = path.extname(bundleName);
        if (bundleExtName === '.js') {
          return bundleWholeInfo.code || ' '
        }
        if (['.css', '.html', '.svg', '.jpg', '.png'].includes(bundleExtName)) {
          return bundleWholeInfo?.['source'] || ' '
        }
      }

      // save origin html content
      const htmlFileName = bundleNames.filter(name => path.extname(name) === '.html')[0]
      const htmlBundleInfo = bundles[htmlFileName];
      // @ts-ignore
      let { source: htmlFileContent } = htmlBundleInfo;

      // compress options work here
      const terserOrNot = (content: string) => {
        if (compress) {
          return minify(content, {
            removeComments: true,
            collapseWhitespace: true,
            removeEmptyAttributes: true,
          });
        } else {
          return content;
        }
      }

      chalkSay(`prepared ${conditionalBundleNames.join('、')} to embedding resources`, chalk.blue)

      conditionalBundleNames.forEach(async (name) => {
        const currentBundleContent = extractSourceCode(name, bundles[name]);
        const sourceKeyName = path.extname(name) === '.css' ? 'href' : 'src';
        const mettedDomNodeString = getDomNodeStringFromSourceProp({
          sourcePropKey: sourceKeyName,
          propValue: `/${name}`
        }, htmlFileContent);
        if (!mettedDomNodeString) {
          const unmetErrorMsg = `@rollup/plugin-inline-resource haven't matched the file named ${name}`;
          if (nonMatched === 2 || nonMatched === 'error') {
            chalkSay(unmetErrorMsg, chalk.red);
            throw new Error(unmetErrorMsg);
          }
          if (nonMatched === 1 || nonMatched === 'warn') {
            chalkSay(unmetErrorMsg, chalk.bgYellow.white);
          }
        }
        const innerHTMLContent = await terserOrNot(currentBundleContent);

        // excludeAttrs worked here
        const domNodeString = createDomNodeString(extractExpectedTagName(mettedDomNodeString), innerHTMLContent, extractProperties(mettedDomNodeString));

        chalkSay(`extract ${name} out of dom ${mettedDomNodeString} for embedding`, chalk.blue, false);
        htmlFileContent.replace(mettedDomNodeString, domNodeString);
      });

      this.emitFile({
        type: 'asset',
        source: htmlFileContent,
        name: '',
        fileName: htmlFileName
      });

    }
  }
}
