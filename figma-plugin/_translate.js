// One-shot translator: applies the unique-string map to every node ID in texts.json
const fs = require('fs');
const path = require('path');

const MAP = {
  "레이블": "Label",
  "숏 풋 스프레드": "Short Put Spread",
  "나": "i",
  "수량": "Qty",
  "타이틀": "Title",
  "서브텍스트": "Subtext",
  "지금 많이 검색하고 있어요": "Trending Searches",
  "개": "ct",
  "만료": "Expiration",
  "프리미엄": "Premium",
  "만기일 주가": "Price at Expiration",
  "호가보기": "View Quote",
  "오른다": "Up",
  "내린다": "Down",
  "프리미엄 받기": "Receive Premium",
  "베가 −0.42": "Vega −0.42",
  "내 평균": "My Avg",
  "홈": "Home",
  "00가기": "Go to 00",
  "참여불가(19세 미만)": "Restricted (Under 19)",
  "롱 스트래들": "Long Straddle",
  "이상": "or above",
  "미국주식 옵션거래로 돈 벌기": "Make Money Trading US Stock Options",
  "$5,060이상이면 수익": "Profit if above $5,060",
  "탭의 배경 컬러가 grey(Surface - secondary) 컬러인 경우, 인디케이터는 white 컬러로 변경해야 합니다. 하지만 다크 모드에서는 기존 grey컬러를 유지해야 합니다.": "When the tab background is grey (Surface - secondary), the indicator must change to white. In dark mode, however, retain the original grey color.",
  "현재가": "Current Price",
  "손익분기점": "Breakeven",
  "구매 호가": "Bid",
  "판매 호가": "Ask",
  "진행중인 주문이 있어요": "You have active orders",
  "지금 모으고 있는": "Currently Buying",
  "이에요": "",
  "올랐어요.": "went up",
  "델타: 0.32": "Delta: 0.32",
  "세타: −0.42": "Theta: −0.42",
  "AAPL 롱콜": "AAPL Long Call",
  "NVDA 롱 스트랭글": "NVDA Long Strangle",
  "NFLX 롱 아이언 버터플라이": "NFLX Long Iron Butterfly",
  "커뮤니티": "Community",
  "더보기": "More",
  "오늘 만기 옵션만 보기": "Today's expirations only",
  "$5,060 ~ 5,100사이면 수익": "Profit if between $5,060 ~ 5,100",
  "내일 오를까 내릴까?": "Up or down tomorrow?",
  "투자 가이드 자세히 보기": "See Investing Guide",
  "버튼명": "Button Name",
  "관심": "Watchlist",
  "내 보유": "My Holdings",
  "마이페이지": "My Page",
  "최대 수익": "Max Profit",
  "SPX 주문": "SPX Order",
  "최대 손실": "Max Loss",
  "자산현황": "Portfolio",
  "주문가능금액": "Buying Power",
  "오늘 실현손익": "Today's Realized P&L",
  "평가손익": "Unrealized P&L",
  "금액 충전": "Top Up",
  "환전": "Exchange",
  "보유종목": "Positions",
  "거래량 많은": "High Volume",
  "인기 많은": "Popular",
  "아이템3": "Item 3",
  "아이템4": "Item 4",
  "아이템5": "Item 5",
  "아이템6": "Item 6",
  "아이템7": "Item 7",
  "1 x 구매 2025. 1.25.": "1 x Buy 2025. 1.25.",
  "보유 종목 모두보기": "See all positions",
  "2건": "2 items",
  "디스크립션": "Description",
  "TOP 옵션": "TOP Options",
  "컴포넌트를 이루는 주요 구성 요소를 간략히 설명합니다. (Icon, Container, Border ...)": "Briefly describes the main parts that make up the component. (Icon, Container, Border ...)",
  "프리미엄 내기": "Pay Premium",
  "옵션거래 가이드 자세히 보기": "See Options Trading Guide",
  "주문": "Order",
  "직접입력 선택시, 하단에 기간을 표기한 select box가 그려집니다.\n초기값은 조회 시점 연도의 1월 1일 부터 조회 시점의 날짜를 디폴트로 하여 노출합니다.\n26년 1월 1일에 조회시, 2026. 1. 1. ~ 2026. 1. 1. \n페이와 스펙이 다릅니다. (페이는 직접입력시 빈값을 보여줌)": "When 'Custom input' is selected, a select box for the period appears below.\nThe default range is from January 1 of the current year to the current date.\nWhen accessed on Jan 1, 2026: 2026. 1. 1. ~ 2026. 1. 1.\nDiffers from Pay's spec. (Pay shows an empty value on Custom input.)",
  "옵션거래, 그것이 알고 싶다": "Options Trading: What You Need to Know",
  "컨텐츠": "Content",
  "델타 0.32": "Delta 0.32",
  "세타 −0.42": "Theta −0.42",
  "1월 17일": "Jan 17",
  "1일 후 만료": "Expires in 1 day",
  "1월 24일": "Jan 24",
  "8일": "8 days",
  "1월 31일": "Jan 31",
  "15일": "15 days",
  "2월 7일": "Feb 7",
  "22일": "22 days",
  "2월 14일": "Feb 14",
  "29일": "29 days",
  "이상이라면 수익": "Profit if above",
  "풋": "Put",
  "지정가": "Limit",
  "지정가 가격": "Limit Price",
  "델타": "Delta",
  "감마": "Gamma",
  "세타": "Theta",
  "옵션가격": "Option Price",
  "수수료": "Fee",
  "예상비용": "Estimated Cost",
  "이전": "Previous",
  "다음": "Next",
  "gradient는 좌우에 모두 사용될 수 있는 요소입니다. \n탭의 개수가 많아 영역을 벗어난 경우에 gradient를 노출하여 숨겨진 탭의 존재를 사용자에게 인지시킬 때 사용됩니다.": "Gradient can be applied to either side.\nUsed to indicate hidden tabs to the user when there are too many tabs to fit in the view.",
  "호가 보기": "View Quote",
  "손익분기": "Breakeven",
  "이상이면 수익": "Profit if above",
  "추가 정보 텍스트 13 Semibold": "Additional info text 13 Semibold",
  "S&P500이 내려가지 않으면 수익": "Profit if S&P500 doesn't fall",
  "아이템": "Item",
  "노출영역은 가변적입니다. ❹ Trailing의 영향을 받습니다.": "Display area is flexible. Affected by ❹ Trailing.",
  "{종목명/추종지수명}이 내려가지 않으면 수익": "Profit if {ticker/index name} doesn't fall",
  "최대 1줄까지 노출되며, 넘어가면 말줄임 처리합니다.": "Up to 1 line. Truncated with ellipsis if exceeded.",
  "진행중인 주문": "Active Orders",
  "손절 6.00": "Stop Loss 6.00",
  "지정가 4.00": "Limit 4.00",
  "진행중인 주문 모두보기": "See all active orders",
  "매매내역": "Trade History",
  "매매내역 전체보기": "See all trades",
  "옵션 만기 일자와 원하는 행사가격을 선택해주세요": "Select an option expiration date and your desired strike price",
  "BKNG 현재가격: $ 5,040.40": "BKNG Current Price: $ 5,040.40",
  "글자 수에 따라 상대적인 너비 값을 가지며, 탭과 탭 사이 간격은 고정입니다. 더 많은 탭을 표시하기 위해 좌우 스크롤 가능합니다. ": "Width is relative to character count, while spacing between tabs is fixed. Horizontal scrolling is enabled to fit more tabs. ",
  "선택된 아이템의 X 위치로 이동": "Move to the selected item's X position",
  "선택된 아이템의 넓이로 변경": "Resize to the selected item's width",
  "S&P500\n내일 오를까 내릴까?": "S&P500\nUp or down tomorrow?",
  "전일종가 대비에 따라 ": "Based on change from previous close ",
  "리소스 제공(.json) light - dark대응 필요": "Resource provided (.json), light/dark support required",
  "Anatomy : 변경사항": "Anatomy: Changes",
  "컴포넌트의 라이트, 다크모드 스타일을 정의합니다.": "Defines the component styles for light and dark modes.",
  "보유중인 종목이 없어요": "You don't have any positions yet",
  "원하는 종목을으로 옵션거래 시작해보세요.": "Pick a ticker and start trading options.",
  "종목 검색하기": "Search Tickers",
  "투자 금액 가져오고 거래 바로 시작해볼까요?": "Bring in investment funds and start trading right away?",
  "원화 가져오고 달러로 환전하면 끝!": "Bring in KRW and exchange to USD — done!",
  "지금 가져오기": "Bring it now",
  "최초 1번 달러 환전 미진행": "First USD exchange not yet done",
  "달러 환전 1회 이상 진행": "USD exchange done at least once",
  "확인": "Confirm",
  "툴팁은 어로우의 끝을 축으로 등장합니다.": "The tooltip appears with the tip of the arrow as the anchor.",
  "인터력션 바로가기": "Go to interaction",
  "녹화 영상 보기": "Watch recording",
  "선택된 탭의 상태가 변경됩니다.": "The selected tab's state changes.",
  "SPX종목명이 길다면 더이상...": "If the SPX ticker name is long, no more...",
  "잘림이나 줄바꿈 없이 모두 노출됩니다.\n소수점 둘째자리까지 노출됩니다.": "Shown in full without truncation or line breaks.\nDisplayed to two decimal places.",
  "예상": "Expected",
  "노출 영역은 가변적입니다. 노출되는 디바이스와 썸네일 영역등에 영향을 받습니다.\n“{stock, option, index name}” 과 “{내일} 오를까 내릴까?” 는 줄바꿈으로 구별합니다.\n{stock, option, index name} : 최대 1줄까지 노출되며, 넘어가면 말줄임 처리합니다.\n{내일} 오를까 내릴까? : 말줄임 없이 모두 노출됩니다.": "Display area is flexible. Affected by the device and thumbnail area, etc.\n\"{stock, option, index name}\" and \"{Tomorrow} up or down?\" are separated by a line break.\n{stock, option, index name}: up to 1 line, truncated with ellipsis if exceeded.\n{Tomorrow} up or down?: shown in full without truncation.",
  "변경사항": "Changes",
  "진행중인 주문이 있을때 ": "When there are active orders ",
  "배너 하단 → 충전/환전 하단": "Below banner → Below Deposit/Exchange",
  "기준값이 하나인 경우": "When there is one threshold",
  "기준값이 두개인 경우 (between)": "When there are two thresholds (between)",
  "기준값이 두개인 경우 (not between)": "When there are two thresholds (not between)",
  "2 x 2 사이즈의 원형 dot이 5만큼의 좌우 간격을 두고 연속적으로 노출되는 형태의 divider입니다.\nwidth 100%로 노출됩니다.": "A divider with 2 x 2 round dots repeated at 5 px horizontal spacing.\nDisplayed at 100% width.",
  "ㅇㄹ": "asdf",
  "프리미엄 받기/내기 뱃지를 터치하여 구매/판매 호가를 노출합니다. \n초기 진입시, 구매/판매 호가는 보여지지 않습니다.\n사용자의 ‘프리미엄 받기/내기'를 선택하여 구매/판매 호가가 노출되고 있다면 그 값을 저장하고, 다른 종목페이지에 갔을때에도 기억합니다.  (앱 다시 설치시 리셋)": "Tap the Receive/Pay Premium badge to reveal the bid/ask. \nOn initial entry, the bid/ask is hidden.\nIf the user taps 'Receive/Pay Premium' to reveal the bid/ask, that state is saved and remembered when navigating to other ticker pages.  (Reset on app reinstall.)",
  "보유종목 없음, Dollor있음": "No positions, has USD",
  "보유종목 + Dollor : 모두 없음": "Positions + USD: all none",
  "보유종목 없음": "No positions",
  "보유종목 있음 + 진행중인 주문 있음": "Has positions + has active orders",
  "진행중인 주문 있음": "Has active orders",
  "보유종목 있음": "Has positions",
  "내 주문": "My Orders",
  "최대손실": "Max Loss",
  "무제한": "Unlimited",
  "보유종목 섹션 삭제": "Remove Positions section",
  "매매내역 섹션 삭제": "Remove Trade History section",
  "삭제": "Remove",
  "❺ Ranking card : Top 옵션": "❺ Ranking card: Top Options",
  "서브타이틀이 여기에 노출됩니다.": "Subtitle goes here.",
  "정규장이 아닌 시간에는 정규장 대비 거래량이 많이 않아 가격이 급격하게 변될 수 있어서 주의가 필요해요.": "Outside regular trading hours, lower volume can cause sharp price swings — please be careful.",
  "거래량은 오늘 하루(혹은 직전 영업일)에 얼마나 거래되었는지를 나타내는 실시간 지표예요. 높을수록 활발한 거래가 이뤄지고 있다는 거예요.\n인기는 지난 1시간 동안 얼마나 투자자들이 관심 있게 보았는지 알려주는 실시간 지표예요. 관심의 기준은 종목별 상세 화면의 조회수가 높은 순이예요.": "Volume is a real-time metric of how much trading has occurred today (or on the most recent business day). Higher means more active trading.\nPopularity is a real-time metric of how much investor interest each ticker has drawn over the past hour, ranked by detail-page view count.",
  "소수점 주문은 정규장 시작부터 종료 30분 전까지 가능해요.": "Fractional orders are available from regular market open until 30 minutes before close.",
  "* 실시간 소수점 주문은 정규장 개장 후부터 장 종료 30분 전까지 가능해요. 데이마켓, 프리마켓, 애프터마켓에는 실시간 소수점 주문이 어려워요. \n소수점 실시간 주문 : 정규장 개장 ~ 종료 30분전까지\n소수점 예약 주문 : 프리마켓, 애프터마켓, 장마감": "* Real-time fractional orders are available from regular market open until 30 minutes before close. Real-time fractional orders are not available during day market, pre-market, or after-hours. \nReal-time fractional orders: regular open ~ 30 minutes before close\nReserved fractional orders: pre-market, after-hours, market close",
  "서머타임 적용시간": "Daylight Saving Time hours",
  "데이마켓": "Day Market",
  "프리마켓": "Pre-market",
  "정규장": "Regular Hours",
  "23:30 ~ 06:00 (소수점은 05:30 까지)": "23:30 ~ 06:00 (fractional until 05:30)",
  "애프터마켓": "After-hours",
  "자세히보기": "See more",
  "탭의 개수가 많아 영역을 벗어난 경우에 gradient를 노출하여 숨겨진 탭의 존재를 사용자에게 인지시킬 때 사용됩니다.": "Used to show a gradient indicating hidden tabs when there are too many tabs to fit in the view.",
  "Gradient는 탭 그룹의 좌측과 우측에 배치됩니다.\n탭의 개수가 많아 영역을 벗어난 경우에 우측에 나타나며 마지막 탭 노출 시, 사라집니다. 또한, 우측으로 스크롤이 될 시, 좌측에 Gradient가 노출됩니다.": "Gradients are placed on the left and right of the tab group.\nWhen there are too many tabs to fit, the right gradient appears and disappears once the last tab is reached. When scrolled right, the left gradient appears.",
  "좌 ON": "Left ON",
  "우 ON": "Right ON",
  "탭을 누르면 이펙트 효과가 발생합니다.": "A press effect plays when a tab is tapped.",
  "누른 탭을 떼면 이펙트 효과가 사라집니다.": "When the tab is released, the press effect disappears.",
  "선택시, 당일 만기일인 종목만 보여집니다.": "When selected, only same-day expirations are shown.",
  "고정 width 값을 가집니다. (정렬 고려)": "Has a fixed width. (Aligned accordingly.)",
  "썸네일에는 로고 혹은 추종하는 지수와 함께 서브로는 전략의 방향을 노출하여 종목의 인지성을 높입니다.": "The thumbnail shows the logo or tracked index along with the strategy direction as a sub-element to improve ticker recognition.",
  "최대 2줄까지 노출되며, 넘어가면 말줄임 처리합니다.\n{stock/option name}, {strategy} 각각 최대 1줄\n{stock/option name}과 {strategy}는 서로 구분됩니다.\n{stock/option name} : 18 bold\n{strategy} : 16 regular": "Up to 2 lines. Truncated with ellipsis if exceeded.\n{stock/option name} and {strategy} each up to 1 line\n{stock/option name} and {strategy} are visually separated.\n{stock/option name}: 18 bold\n{strategy}: 16 regular",
  "SPX종목명이 길다면": "If the SPX ticker name is long",
  "숏 풋 스프레드이상의 전략이 있...": "Strategies of Short Put Spread or higher exist...",
  "숏 풋 스...": "Short Put S...",
  "dim, scale down 2가지가 있습니다. \ndim : 딤드 마스크(#000000 opacity 4%) 레이어로 로우의 면적을 덮습니다. 로우 dim R 값은 16입니다. (안드로이드는 안드로이드 최소 opacity를 적용)\nscale down : 로우의 contents 사이즈를 97% 스케일로 축소합니다. 로우의 center 기준으로 축소되어야 합니다.": "Two effects: dim and scale-down.\ndim: covers the row area with a dimmed mask (#000000 opacity 4%) layer. Row dim radius is 16. (Android applies its minimum opacity.)\nscale-down: scales the row contents to 97%. Must scale around the row's center.",
  "영역내 고정된 패딩값을 갖습니다.": "Has a fixed padding within the area.",
  "카드 강조를 위해 gradient border + motion 효과를 적용합니다.\n모션 효과는 border에 적용된 gradient 그라디언트 컬러가 이동하는 것으로 하며, 상황에 따라 적용 여부가 달라집니다.": "Applies a gradient border + motion effect to emphasize the card.\nThe motion is the border's gradient color shifting; whether it is applied depends on context.",
  "하루 1회, 최초 진입 시에만 노출한다.\n최초 노출 이후에는 동일 날짜 내 재 진입시, 기본상태로 노출": "Shown once per day on the first entry only.\nOn re-entries within the same day, the default state is shown.",
  "모션 효과는 border에 적용된 gradient 그라디언트 컬러가 이동하는 것으로 하며, 상황에 따라 적용 여부가 달라집니다.": "The motion is the border's gradient color shifting; whether it is applied depends on context.",
  "3가지 컬러 조합으로 만들어 집니다.": "Composed of three color combinations.",
  "❶ Title : {stock, index name}  / {내일} 오를까 내릴까?": "❶ Title: {stock, index name}  / {Tomorrow} up or down?",
  "고정 크기를 가지고 있는 이미지를 노출합니다.": "Displays an image with a fixed size.",
  "버튼 은 상시 노출되": "Button is always shown",
  "dim, scale down 2가지가 있습니다. \ndim effect : 딤드 마스크(#000000 opacity 6%)  레이어로 버튼의 면적을 덮습니다.\nscale-down : 버튼의 사이즈를 95% 스케일로 축소합니다. (버튼의 center 기준으로 축소되어야 합니다.) ": "Two effects: dim and scale-down.\ndim effect: covers the button area with a dimmed mask (#000000 opacity 6%)  layer.\nscale-down: scales the button to 95%. (Must scale around the button's center.) ",
  "버튼 탭 후 in progress 상태를 의미합니다.\ndim effect는 유지한 채 스케일은 원래의 크기(100%)대로 복원되며, dot loading이 재생됩니다.\n🌗 button > in progress 상태의 dot loading은 light / dark theme에 관계없이 white / black 버전으로 노출합니다.": "Indicates the in-progress state after the button is tapped.\nThe dim effect is kept while the scale returns to 100%, and dot loading plays.\n🌗 button > in-progress dot loading uses the white / black version regardless of light / dark theme.",
  "❹ Quiz card : 오를까? 내릴까?": "❹ Quiz card: Up? Down?",
  "❶ 커뮤니티 진입점": "❶ Community entry point",
  "크기 : 24x24\n확장자 : .svg, .png, .json(lottie)": "Size: 24x24\nFormat: .svg, .png, .json (lottie)",
  "2가지 컬러 조합으로 만들어 집니다.": "Composed of two color combinations.",
  "❷ 진행중인 주문": "❷ Active Orders",
  "❶ UI변경": "❶ UI change",
  "진행중인 주문이 ": "Active orders ",
  "보유 종목 하단 → 최상위\n진행중인 주문이 있을때만 노출": "Below positions → Top\nShown only when there are active orders",
  "❸ Title : 진행중인 주문이 있어요": "❸ Title: You have active orders",
  "❹ trailing : {진행중인주문수}건": "❹ trailing: {activeOrderCount} orders",
  "❸ 보유종목": "❸ Positions",
  "❶ Layout : title 위치": "❶ Layout: title position",
  "카드 밖 → 카드 안": "Outside card → Inside card",
  "❸ empty state 노출 안함": "❸ Hide empty state",
  "사용자가 해야할 액션을 설명하던 고정 문구에서 옵션 전략에 대한 안내로 변경합니다.\n추종 지수/종목 + 전략에 따라 내용이 다릅니다.": "Changed from a fixed action prompt to guidance on the option strategy.\nContent varies by tracked index/ticker + strategy.",
  "전략별 노출 문구": "Strategy-specific copy",
  "❶,❷는 ❹의 영향을 받습니다.\n모든 정보는 말줄임 없이 보여집니다.": "❶ and ❷ are affected by ❹.\nAll information is displayed without truncation.",
  "❶ 행사가 : 텍스트 컬러 강도 조정": "❶ Strike: text color intensity adjusted",
  "텍스트 컬러 강도를 한단계 낮춥니다.": "Lowers text color intensity by one step.",
  "❷ Greeks Metrics : 표기법 및 노출 greeks변경, 텍스트 사이즈 조정": "❷ Greeks Metrics: notation and shown greeks updated, text size adjusted",
  "노출되는 기본 greeks값을 IV와 베가로 변경합니다.\n“:” 삭제 합니다.\n텍스트 사이즈 14 → 13로 변경합니다.\n텍스트 컬러 강도를 한단계 낮춥니다.": "Default shown greeks changed to IV and Vega.\nRemove the \":\".\nText size changed from 14 → 13.\nText color intensity lowered by one step.",
  "❸ 손익분기 type : 추가": "❸ Breakeven type: added",
  "“만기일 주가 {손익분기점값}이상이면 수익”": "\"Profit if price at expiration is above {breakevenValue}\"",
  "“만기일 주가 {손익분기점 최소값}” ~ “{손익분기점 최대값}사이면 수익”\n손익분기점 최대값에는 “$”를 붙이지 않습니다.": "\"Profit if price at expiration is between {breakevenMin} ~ {breakevenMax}\"\nDo not prefix breakevenMax with \"$\".",
  "$5,060 ~ 5,100범위 밖이면 수익": "Profit if outside $5,060 ~ 5,100",
  "“만기일 주가 {not 손익분기점 최소값}” ~ “{not 손익분기점 최대값}사이가 아니면 수익”\n손익분기점 최대값에는 “$”를 붙이지 않습니다.": "\"Profit if price at expiration is not between {notBreakevenMin} ~ {notBreakevenMax}\"\nDo not prefix notBreakevenMax with \"$\".",
  "❹ 프리미엄 : 크기 조정 및 정보 추가": "❹ Premium: size adjusted and info added",
  "프리미엄 박스 width layout : flexible → fixed, right padding 12 → 8, top-down padding 4→2\n하단 ‘프리미엄' 표기 추가": "Premium box width layout: flexible → fixed, right padding 12 → 8, top-bottom padding 4 → 2\nAdded 'Premium' label at the bottom",
  "❷ 현재가 : 현재가 {current price} {change %}": "❷ Current Price: Current Price {current price} {change %}",
  "container width는 노출 정보에 따라 달라집니다. ": "Container width varies based on the displayed information. ",
  "SPX 종목명이 길어지면 이렇": "If the SPX ticker name gets long like this",
  "❶ {stock name} + ‘주문’": "❶ {stock name} + 'Order'",
  "Premium badge : fold-unfold : 구매/판매 호가 노출": "Premium badge: fold-unfold: shows bid/ask",
  "손익분기 type": "Breakeven type",
  "만기일주가  ?": "Price at expiration  ?",
  "사이": "Between",
  "(손익분기점)": "(Breakeven)",
  "제외": "Exclude",
  "수익": "Profit",
  "{손익 기준 가격}”이상이라면 수익\"": "\"Profit if above {profitThresholdPrice}\"",
  "“{손익분기 최소 금액}” ~ “{손익분기 최대 금액} “사이\"": "\"between {breakevenMin} ~ {breakevenMax}\"",
  "“{손익분기 최소 금액}” ~ “{손익분기 최대 금액} “제외\"": "\"outside {breakevenMin} ~ {breakevenMax}\"",
  "손익분기 설명 \n진행 필요": "Breakeven description \nNeeds work"
};

const exportsDir = path.join(__dirname, 'exports');
const translationsDir = path.join(__dirname, 'translations');
if (!fs.existsSync(translationsDir)) fs.mkdirSync(translationsDir, { recursive: true });

const files = fs.readdirSync(exportsDir).filter((f) => f.startsWith('texts-') && f.endsWith('.json'));
if (files.length === 0) {
  console.error('No texts-*.json found in exports/');
  process.exit(1);
}
files.sort();
const sourceFile = files[files.length - 1];
const sourcePath = path.join(exportsDir, sourceFile);
console.log('Source:', sourceFile);

const source = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));

// Normalize invisible Unicode quirks so map lookups match strings that contain
// thin spaces (U+2009), line separators (U+2028), NBSP, etc.
function normalize(s) {
  return s
    .replace(/[\u2028\u2029]/g, '\n')
    .replace(/[\u00A0\u2002\u2003\u2009\u200A\u200B\u202F\u205F\u3000]/g, ' ');
}
function loose(s) {
  return s.replace(/[\s\u00A0\u2028\u2029\u2002\u2003\u2009\u200A\u200B\u202F\u205F\u3000]+/g, ' ').trim();
}
const NORMALIZED_MAP = {};
const LOOSE_MAP = {};
for (const k of Object.keys(MAP)) {
  NORMALIZED_MAP[normalize(k)] = MAP[k];
  LOOSE_MAP[loose(k)] = MAP[k];
}

const translations = {};
const missing = new Set();
let mapped = 0;
let mappedViaNormalize = 0;
let mappedViaLoose = 0;
for (const t of source.texts) {
  if (Object.prototype.hasOwnProperty.call(MAP, t.text)) {
    translations[t.id] = MAP[t.text];
    mapped++;
  } else {
    const norm = normalize(t.text);
    if (Object.prototype.hasOwnProperty.call(NORMALIZED_MAP, norm)) {
      translations[t.id] = NORMALIZED_MAP[norm];
      mapped++;
      mappedViaNormalize++;
    } else {
      const lo = loose(t.text);
      if (Object.prototype.hasOwnProperty.call(LOOSE_MAP, lo)) {
        translations[t.id] = LOOSE_MAP[lo];
        mapped++;
        mappedViaLoose++;
      } else {
        missing.add(t.text);
      }
    }
  }
}

const out = {
  version: 1,
  sourceFile,
  translatedAt: new Date().toISOString(),
  stats: {
    totalSourceTexts: source.texts.length,
    mapped,
    mappedViaNormalize,
    mappedViaLoose,
    missingUnique: missing.size,
  },
  translations,
};
if (missing.size > 0) out.missingExamples = [...missing].slice(0, 50);

const outName = sourceFile.replace(/^texts-/, 'translations-');
const outPath = path.join(translationsDir, outName);
fs.writeFileSync(outPath, JSON.stringify(out, null, 2), 'utf8');
console.log(`Wrote ${outPath}`);
console.log(`Mapped ${mapped}/${source.texts.length} (${missing.size} unique strings missing from map)`);
if (missing.size > 0) {
  console.log('First 20 missing:');
  [...missing].slice(0, 20).forEach((m) => console.log('  -', JSON.stringify(m).slice(0, 100)));
}
