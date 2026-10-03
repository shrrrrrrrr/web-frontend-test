import { useCallback, useRef } from 'react';
import { App, ConfigProvider } from 'antd';
import './pixel-base.css';

const theme = {
  token: {
    colorPrimary: '#087F78', colorInfo: '#087F78', colorSuccess: '#286C49', colorWarning: '#96620D', colorError: '#A43C31',
    colorText: '#102D40', colorTextSecondary: '#526974', colorBgLayout: '#F0E4C6', colorBgContainer: '#FFF9E9', colorBgElevated: '#FFF9E9',
    colorBorder: '#B6AE95', colorBorderSecondary: '#E2D5B4', borderRadius: 2, borderRadiusLG: 2, borderRadiusSM: 0,
    fontFamily: "'PingFang SC', 'Microsoft YaHei', 'Noto Sans CJK SC', sans-serif", fontSize: 16, lineHeight: 1.65,
    controlHeight: 40, controlHeightLG: 48, controlHeightSM: 32, motionDurationMid: '0.12s', motionDurationSlow: '0.16s',
  },
  components: {
    Button: { primaryShadow: '0 3px 0 #102D40', defaultShadow: '0 2px 0 #E2D5B4', fontWeight: 600 },
    Card: { headerFontSize: 18, headerBg: '#FFF9E9' },
    Drawer: { footerPaddingBlock: 16 },
    Tooltip: { colorBgSpotlight: '#102D40' },
  },
};

export default function StudentTheme({ children }) {
  const scope = useRef(null);
  const popupContainer = useCallback(() => scope.current || document.body, []);
  return <ConfigProvider theme={theme} getPopupContainer={popupContainer}>
    <App className="student-pixel">
      <div ref={scope} className="student-pixel-root">{children}</div>
    </App>
  </ConfigProvider>;
}
