import { useCallback, useRef } from 'react';
import { App, ConfigProvider } from 'antd';
import './pixel-base.css';
import { PLATFORM_FONT } from '../space/identity';
import '../space/space.css';

const theme = {
  token: {
    colorPrimary: '#087F78', colorInfo: '#087F78', colorSuccess: '#286C49', colorWarning: '#96620D', colorError: '#A43C31',
    colorText: '#102D40', colorTextSecondary: '#526974', colorBgLayout: '#F0E4C6', colorBgContainer: '#FFF9E9', colorBgElevated: '#FFF9E9',
    colorBorder: '#B6AE95', colorBorderSecondary: '#E2D5B4', borderRadius: 2, borderRadiusLG: 2, borderRadiusSM: 0,
    fontFamily: PLATFORM_FONT, fontSize: 16, lineHeight: 1.65,
    controlHeight: 40, controlHeightLG: 48, controlHeightSM: 32, motionDurationMid: '0.12s', motionDurationSlow: '0.16s',
  },
  components: {
    Button: { primaryShadow: '0 3px 0 #102D40', defaultShadow: '0 2px 0 #E2D5B4', fontWeight: 600 },
    Card: { headerFontSize: 18, headerBg: '#FFF9E9' },
    Drawer: { footerPaddingBlock: 16 },
    Tooltip: { colorBgSpotlight: '#102D40' },
  },
};

export default function StudentTheme({ children, variant = 'campus' }) {
  const scope = useRef(null);
  const popupContainer = useCallback(() => scope.current || document.body, []);
  return <ConfigProvider theme={theme} getPopupContainer={popupContainer}>
    <App className="student-pixel">
      <div ref={scope} className="student-pixel-root" data-space-theme={variant}>{children}</div>
    </App>
  </ConfigProvider>;
}
