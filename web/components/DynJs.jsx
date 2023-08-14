import dynamic from 'next/dynamic'
//import JSMpeg from './JSMpeg.js'
const DynamicComponentWithNoSSR = dynamic(() => import('./JSMpeg.js'), {
  ssr: false
})

export default () => <DynamicComponentWithNoSSR />