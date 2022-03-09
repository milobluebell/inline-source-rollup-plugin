#!/usr/bin/env node
import path from 'path';
import fs from 'fs';
import request from 'request';
import chalk from 'chalk';
import { IPluginProps } from '.';

const COMMON = {
  rootPath: path.resolve(process.cwd(), '.'),
  distDir: path.resolve(process.cwd(), './dist'),
  baseUrl: `https://${process.env.Tencent_COS_Bucket}.file.myqcloud.com`,
};


/**
 *
 * @param url remote url address
 * @returns Promise<unknown>
 *
 * 'curl' a remote url, and resolved contenFt out
 */
export function getRemoteSourceContent(url: URL['href']) {
  const $url = /^http(s)?\/\/.+/.test(url) ? url : `https:${url}`;
  return new Promise((rsl, rej) => {
    request($url, function (err, response, body) {
      if (!err && [200, 204].includes(response.statusCode)) {
        rsl(body);
      } else {
        rej(err);
      }
    });
  });
}


/**
 *
 * @param relativeLocFromDist relatived file location compared to ${dist folder}
 * @returns Promise<string>
 *
 * touch a local file, and resolved content out
 */
export function getLocalSourceContent(relativeLocFromDist: string) {
  const absPath = path.join(COMMON.distDir, relativeLocFromDist);
  if (fs.statSync(absPath) && fs.statSync(absPath).isFile()) {
    return new Promise((rsl, rej) => {
      fs.readFile(absPath, 'utf-8', (err, data) => {
        if (err) {
          rej(err);
        } else {
          rsl(String(data));
        }
      });
    });
  } else {
    throw new Error('no file matched')
  }
}


/**
 *
 * @param elementString a stringified dom node content
 * @param warnningLevel
 * @returns string
 *
 * extract src/href attribute from a stringified dom node content
 *
 * @samples
 * extractTargetPath('<script src="http://www.gov.cn" />'); // 'http://www.gov.cn'
 */
export function extractSourceLocation(elementString: string, warnningLevel?: IPluginProps['nonMatched']) {
  const firstMatching = elementString!.match(/(src|href)\=(\"|\').+(\"|\')/g)?.[0];
  if (!firstMatching) {
    //
    const errorMsg = `@rollup/plugin-inline-source can not match any resources by src/href attribute specified to ${firstMatching}, is that correct?`;
    if (warnningLevel === 2 || warnningLevel === 'error') {
      chalkSay(errorMsg, chalk.bgRed.white, true);
      throw new Error(errorMsg);
    }
    if (warnningLevel === 1 || warnningLevel === 'warn') {
      chalkSay(errorMsg, chalk.yellow, true);
    }
  } else {
    return firstMatching.match(/\".+\"/g)?.[0]?.replace(/\"/g, '').replace(COMMON.baseUrl, '');
  }
}


/**
 *
 * @param elementString a stringified dom node content
 * @returns string
 *
 * extract tag name from a stringified dom node content
 *
 * @samples
 * extractTagName('<script src="http://www.gov.cn" />'); // 'script'
 * extractTagName('<link href="http://www.gov.cn" />'); // 'style'
 *
 */
export function extractExpectedTagName(elementString: string) {
  const result = elementString.substring(1, elementString.indexOf(' '));
  return result === 'link' ? 'style' : result;
}


export function createEmbededDomNode(tagName: string, innerHTMLContent?: string, attrs?: string[], extra?: {
  name: string,
  base: IPluginProps['base'],
  mettedDomNodeString: string,
  bundleNames: string[],
}) {
  const { name, mettedDomNodeString } = extra || {};
  (name && mettedDomNodeString) && chalkSay(`extracted ${name} and embedding into ${mettedDomNodeString}`, chalk.blue, false);
  return `<${tagName} ${attrs?.join(' ')}>${innerHTMLContent}</${tagName}>`;
}


/**
 *
 * @param elementString a stringified dom node content
 * @returns Array<string>
 *
 * extract attributes from a stringified dom node content
 *
 * @samples
 * extractProperties('<div class="cols-4 bg-gray" data-winner="RUSSIA" class="" id="testet" >123</div>'); // [ ' class="cols-4 bg-gray" data-winner="RUSSIA" class="" id="testet"' ]
 *
 */
export function extractProperties(elementString: string) {
  let result: (string[] | null) = elementString.match(/\s?(\w|\-|\_)+(\=(\".*\"))+/g);
  // 去除掉src/href
  result = result ? result?.map(r => {
    return r.replace(/(src|href)=\".+\"/g, '');
  }) : [];

  return result
}


/**
 *
 * @param elementString  a stringified dom node content
 * @param determiningUnmountProperties the props who cause this plugin skip its transformation while they were detected
 * @returns boolean
 */
export function checkShouldMount(elementString: string, determiningUnmountProperties = ['async', 'defer', { key: 'type', value: 'module' }, { key: 'rel', value: 'modulepreload' }]) {
  // 判断是否有src/href
  if (!/(src|href)\=(\"|\').+(\"|\')/g.test(elementString)) {
    return false;
  }
  // 如果有，则判断是否在dist文件中有或为链接
  const fileTarget = extractSourceLocation(elementString) || '';
  const absPath = path.join(COMMON.distDir, fileTarget);
  if (!fs.existsSync(absPath) && !/(http|https|):\/\//g.test(fileTarget)) {
    return false;
  }

  // 根据属性进行最后筛选
  if (
    determiningUnmountProperties.some(function (prop) {
      if (typeof prop === 'string') {
        return new RegExp(`${prop}`, 'g').test(elementString);
      } else {
        const { key, value } = prop;
        return new RegExp(`${key}\=\"${value}\"`, 'g').test(elementString);
      }
    })
  ) {
    return false;
  }


  return true;
}

/**
 *
 * @param matchRuleOpt
 * @param htmlContent
 * @returns string
 */
export function getDomNodeStringFromSourceProp(propValue: string, htmlContent: string) {
  const regexpRule = new RegExp(`\<.+(src|href)=\"\/?${propValue}\".+`, 'g');
  return htmlContent.match(regexpRule)?.[0] || ''
}


/**
 *
 * @param remoteUrl remote url of a resource
 * @param forceRefresh force refresh cache even if they have been cached
 */
export function cacheRemoteContent(remoteUrl: URL['href'], forceRefresh = false) {

}

/**
 *
 * @param content
 * @param chalkInstance
 * @param withBreaklines
 * @returns void
 */
export function chalkSay(content: string, chalkInstance = chalk.green, withBreaklines = true) {
  withBreaklines && console.log(' ');
  console.log(chalkInstance(content));
  withBreaklines && console.log(' ');
}
