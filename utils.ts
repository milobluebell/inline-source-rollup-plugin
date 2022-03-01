#!/usr/bin/env node
import path from 'path';
import fs from 'fs';
import request from 'request';
import { minify } from 'html-minifier-terser';

const COMMON = {
  distDir: path.resolve(process.cwd(), './dist'),
  baseUrl: `https://${process.env.Tencent_COS_Bucket}.file.myqcloud.com`,
};


/**
 * 
 * @param url remote url address
 * @returns Promise<unknown>
 * 
 * 'curl' a remote url, and resolved content out
 */
function getRemoteSourceContent(url: URL['href']) {
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
function getLocalSourceContent(relativeLocFromDist: string) {
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
 * @returns string
 * 
 * extract src/href attribute from a stringified dom node content
 * 
 * @samples 
 * extractTargetPath('<script src="http://www.gov.cn" />'); // 'http://www.gov.cn'
 */
function extractTargetPath(elementString: string) {
  return elementString
    .match(/(src|href)\=(\"|\').+(\"|\')/g)[0]
    .match(/\".+\"/g)[0]
    .replace(/\"/g, '')
    .replace(COMMON.baseUrl, '');
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
function extractTagName(elementString: string) {
  const result = elementString.substring(1, elementString.indexOf(' '));
  return result === 'link' ? 'style' : result;
}


/**
 * 
 * @param elementString a stringified dom node content
 * @returns Array<string>
 * 
 * extract attributes from a stringified dom node content
 * 
 * @samples
 * extractProperties('<div class="cols-4 bg-gray" data-winner="RUSSIA" />'); // ['class="cols-4"', 'data-winner="RUSSIA"']
 * 
 */
function extractProperties(elementString: string) {
  const segments = elementString.split('></')[0].split(' ');
  return segments.filter((sg) => sg !== `<${extractTagName(elementString)}` && sg !== '<link' && !sg.includes('src=') && !sg.includes('href=') && !sg.includes('/>'));
}


/**
 * 
 * @param htmlNodeString 
 * @param determiningUnmountProperties 
 * @returns 
 */
function checkShouldMount(htmlNodeString, determiningUnmountProperties = ['async', 'defer', { key: 'type', value: 'module' }, { key: 'rel', value: 'modulepreload' }]) {
  // 判断是否有src/href
  if (!/(src|href)\=(\"|\').+(\"|\')/g.test(htmlNodeString)) {
    return false;
  }
  // 如果有，则判断是否在dist文件中有或为链接
  const fileTarget = extractTargetPath(htmlNodeString);
  const absPath = path.join(COMMON.distDir, fileTarget);
  if (!fs.existsSync(absPath) && !/(http|https|):\/\//g.test(fileTarget) && fileTarget !== '//at.alicdn.com/t/font_2857489_imieufzfwmb.css') {
    return false;
  }

  // 根据属性进行最后筛选
  if (
    determiningUnmountProperties.some(function (prop) {
      if (typeof prop === 'string') {
        return new RegExp(`${prop}`, 'g').test(htmlNodeString);
      } else {
        const { key, value } = prop;
        return new RegExp(`${key}\=\"${value}\"`, 'g').test(htmlNodeString);
      }
    })
  ) {
    return false;
  }

  return true;
}

/**
 * Main
 */
const scanFiles = ['index.html'];
const terserOption = {
  removeComments: true,
  collapseWhitespace: true,
  removeEmptyAttributes: true,
};
//
const scannedFileContent = getLocalFileSourceContent(scanFiles[0]);
const scriptNodeStrings = scannedFileContent.match(/\<script.+\>\<\/script\>/g);
const linkNodeStrings = scannedFileContent.match(/\<link.+\/?>/g);
const needMountNodes = [...scriptNodeStrings, ...linkNodeStrings].filter(function (nodeContent) {
  return checkShouldMount(nodeContent, ['async', 'defer', { key: 'rel', value: 'modulepreload' }]);
});
let result = scannedFileContent;
console.log('----- COMMON.baseUrl is: ' + COMMON.baseUrl);
console.log('Mounting resources are: ');
console.table(needMountNodes);
needMountNodes.forEach(async (nodeString) => {
  const absPath = path.join(COMMON.distDir, extractTargetPath(nodeString));
  if (fs.existsSync(absPath) || fs.existsSync(absPath.replace(COMMON.baseUrl, ''))) {
    new RegExp(nodeString, 'g').test(result) && console.log('⛵ Located ' + nodeString, ', whoes resource at ' + absPath);
    // 在dist里
    result = result.replace(new RegExp(nodeString, 'g'), `<${extractTagName(nodeString)} ${extractProperties(nodeString).join(' ')}>${fs.readFileSync(absPath)}</${extractTagName(nodeString)}>`);
    console.log('🚗 Mounting ' + nodeString, ', to inline resource, with properties settled as: ' + extractProperties(nodeString).join(' and '));
  } else {
    // 是远程的
    new RegExp(nodeString, 'g').test(result) && console.log('⛵ Remote requested ' + nodeString, 'at URL: ' + extractTargetPath(nodeString));
    const requestedContent = await getRemoteSourceContent(extractTargetPath(nodeString));
    const content = await minify(requestedContent, terserOption);
    result = result.replace(new RegExp(nodeString, 'g'), `<${extractTagName(nodeString)} ${extractProperties(nodeString).join(' ')}>${content}</${extractTagName(nodeString)}>`);
    console.log('🚗 Mounting ' + nodeString, ', to inline resource, with properties settled as: ' + extractProperties(nodeString).join(' and '));
  }
});