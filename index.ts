import Vinyl from 'vinyl'
import utils from '@rollup/pluginutils'

interface IPluginProps {
  // 配置那些资源需要内联
  inlineSource: string | RegExp
  // 是否压缩
  compress?: boolean;
  // 项目根目录
  root?: string;
  // 是否允许从远程获取资源？
  // 比如http://cdn.t.com/xxx.js就会去发送请求来获取资源
  download?: boolean;
  // 没有找到资源的解决策略
  // 2代表error；1代表warn；0代表none
  nonMatched: 2 | 1 | 0 | 'error' | 'warn' | 'none'
}

export default function (options: IPluginProps) {
  return {
    name: 'rollup-plugin-inline-source',
    
  }
}