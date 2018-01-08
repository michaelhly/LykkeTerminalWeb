import {ChartApi} from './api/index';

// tslint:disable:object-literal-sort-keys

const LINESTYLE_DOTTED = 1;
const LINESTYLE_DASHED = 2;
// const LINESTYLE_SOLID = 0;
// const LINESTYLE_LARGE_DASHED = 3;

const config = {
  exchanges: [],
  supported_resolutions: [
    '1',
    '5',
    '15',
    '30',
    '60',
    '240',
    '360',
    '720',
    '1D',
    '1W',
    '1M'
  ]
};

export default (session: any) => {
  return new (window as any).TradingView.widget({
    autosize: true,
    symbol: 'BTCUSD',
    interval: '5',
    container_id: 'tv_chart_container',
    datafeed: new ChartApi(session, config),
    library_path: 'charting_library/',
    disabled_features: ['use_localstorage_for_settings'],
    preset: 'mobile',
    overrides: {
      volumePaneSize: 'tiny',

      'paneProperties.background': '#333333',
      'paneProperties.vertGridProperties.color': 'rgba(140, 148, 160, 0.6)',
      'paneProperties.vertGridProperties.style': LINESTYLE_DOTTED,
      'paneProperties.horzGridProperties.color': 'rgba(140, 148, 160, 0.6)',
      'paneProperties.horzGridProperties.style': LINESTYLE_DASHED,
      'symbolWatermarkProperties.color': 'rgba(0, 0, 0, 0)',

      'scalesProperties.textColor': 'rgb(140, 148, 160)',

      'mainSeriesProperties.candleStyle.upColor': 'rgb(19, 183, 42)',
      'mainSeriesProperties.candleStyle.downColor': 'rgb(255, 62, 46)',
      'mainSeriesProperties.candleStyle.drawWick': true,
      'mainSeriesProperties.candleStyle.drawBorder': false,
      'mainSeriesProperties.candleStyle.wickUpColor':
        'rgba(140, 148, 160, 0.4)',
      'mainSeriesProperties.candleStyle.wickDownColor':
        'rgba(140, 148, 160, 0.4)',
      'mainSeriesProperties.candleStyle.barColorsOnPrevClose': false
    },
    custom_css_url: process.env.PUBLIC_URL + '/chart.css'
  });
};