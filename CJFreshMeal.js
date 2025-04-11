function fetchCJFreshMealData() {
  // 타운
  const baseUrl = "https://front.cjfreshmeal.co.kr";
  const apiPath = "/meal/v1/today-all-meal";
  const storeIdx = "6029";
  
  try {
    const mainPageUrl = baseUrl;
    const mainPageOptions = {
      "method": "get",
      "followRedirects": true,
      "muteHttpExceptions": true,
      "headers": {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
      }
    };
    
    const mainPageResponse = UrlFetchApp.fetch(mainPageUrl, mainPageOptions);
    const mainPageHeaders = mainPageResponse.getAllHeaders();
    
    //Logger.log("Main page status code: " + mainPageResponse.getResponseCode());

    let cookies = [];
    if (mainPageHeaders && mainPageHeaders["Set-Cookie"]) {
      if (Array.isArray(mainPageHeaders["Set-Cookie"])) {
        mainPageHeaders["Set-Cookie"].forEach(function(cookie) {
          cookies.push(cookie.split(";")[0]);
        });
      } else {
        cookies.push(mainPageHeaders["Set-Cookie"].split(";")[0]);
      }
    }

    const apiUrl = baseUrl + apiPath + "?storeIdx=" + storeIdx;
    const apiOptions = {
      "method": "get",
      "followRedirects": true,
      "muteHttpExceptions": true,
      "headers": {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        "Accept": "application/json, text/plain, */*",
        "Referer": baseUrl,
        "Cookie": cookies.join("; "),
        "X-Requested-With": "XMLHttpRequest"
      }
    };
    
    const apiResponse = UrlFetchApp.fetch(apiUrl, apiOptions);
    
    if (apiResponse.getResponseCode() === 200) {
      try {
        const mealData = JSON.parse(apiResponse.getContentText());
        processMealData(mealData);
      } catch (parseError) {
        const mealDataAPI = apiResponse.getContentText();
      }
    } else {
    }
  } catch (error) {
  }
}

function processMealData(mealData) {
  if (mealData && mealData.data) {
    /* 오늘 날짜를 yyyy년 MM월 dd일 형식으로 저장합니다. */
    const today = new Date();
    const dateString = Utilities.formatDate(today, "Asia/Seoul", "yyyy년 MM월 dd일");
    
    // Create a spreadsheet to store the meal data or use an existing one
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = spreadsheet.getSheetByName(dateString);
    
    if (!sheet) {
      sheet = spreadsheet.insertSheet(dateString, 0);
    }
    
    Logger.log("시트 기록 시작함.")
    sheet.clear();
    sheet.appendRow(["Time", "메인 메뉴", "사이드", "kcal"]);
    var timeType = "";
    for (let i = 1; i <= 3; i++) {
      if (i === 1) {
        timeType = "조식";
      } else if (i === 2) {
        timeType = "중식";
      } else if (i === 3) {
        timeType = "석식";
      } else {
        timeType = "Error occured."
      }
      for (let j = 0; j <= 1; j++) {
        if (i === 3 & j=== 1) {
          continue;
        }
        sheet.appendRow([timeType + " - " + mealData.data[i][j].corner, mealData.data[i][j].name.replaceAll(", ", ",").replaceAll(",", ", "), mealData.data[i][j].side.replaceAll(", ", ",").replaceAll(",", ", "), mealData.data[i][j].kcal]);
      }
    }
    spreadsheet.getActiveSheet().autoResizeColumns(1, 1);
    spreadsheet.getActiveSheet().autoResizeColumns(2, 1);
    spreadsheet.getActiveSheet().autoResizeColumns(3, 1);
    spreadsheet.getActiveSheet().autoResizeColumns(4, 1);
    Logger.log("시트 기록 완료됨.")

        var morningMenu = [];
        for(i=0; i<2; i++){
              var menu1 = mealData.data[1][i].name.replaceAll(",", ", ").split(", ").concat(mealData.data[1][i].side.split(", "));
              morningMenu.push(menu1);
        }

        var lunchMenu = [];
        for(i=0; i<2; i++){
              var menu1 = mealData.data[2][i].name.replaceAll(",", ", ").split(", ").concat(mealData.data[2][i].side.split(", "));
              lunchMenu.push(menu1);
        }

        var eveningMenu = [];
        eveningMenu.push(mealData.data[3][0].name.replaceAll(",", ", ").split(", ").concat(mealData.data[3][0].side.split(", ")));

    const userEmail = Session.getActiveUser().getEmail();
    const subject = dateString + "의 타운 본관 식단";

    var morningMenuItem = "";
    var lunchMenuItem="";
    var eveningMenuItem="";
    try{

      for(i=0; i<2; i++){
        morningMenuItem+='<td style = "text-align: center; padding: 10px 0px; border: 2px solid white;">'
        morningMenu[i].forEach(function(menu){
          morningMenuItem += "<div>" + menu + "</div>";
        });
        morningMenuItem+='</td>'
      }
      for(i=0; i<2; i++){
        lunchMenuItem+='<td style = "text-align: center; padding: 10px 0px; border: 2px solid white;">'
        lunchMenu[i].forEach(function(menu){
          lunchMenuItem += "<div>" + menu.replaceAll(",", "/") + "</div>";
        });
        lunchMenuItem+='</td>'
      }

      eveningMenu[0].forEach(function(menu){
          eveningMenuItem += "<div>" + menu + "</div>";
      });
      
    } catch(e){
      Logger.log(e.message);
    }
  Logger.log("메일 내용 작성 시작함.")
    const html = `
<html style="max-width: 1024px">
  <body style = "margin:0; padding:0; width: max-width: 1024px;">
    <div style = "text-align: center; min-width: 600px; max-width: 1024px; background-color: #fff; margin:30px; font-family: 'Noto Sans KR', '맑은 고딕', 'Malgun Gothic', Arial, Dotum, sans-serif; font-size: 20px; font-weight: 600;">
      🤤 ${dateString}의 식단 🍴
    </div>
    <table style = "min-width: 600px; max-width: 1024px;  background-color: #fff; margin:0 auto; border: 0; border-collapse: collapse; border-spacing: 0 !important;">
      <tr style="max-width: 1024px; background-color: #418F7E; border: 1px solid white; color: white; font-size: 14px;">
        <th style = "text-align: center; padding: 10px 0px; border: 2px solid white; width: 50%; border-radius: 10px; background: #f9e740 !important; color: brown;" >조식 - 한식 🍚 (${mealData.data[1][0].kcal} kcal)</th>
        <th style = "text-align: center; border: 2px solid white; width: 50%; border-radius: 10px;">조식 - 스낵픽 🥐</th>
      </tr>
      <tr style = " margin-bottom:30px;">
        ${morningMenuItem}
      </tr>
      <tr style="background-color: #418F7E; border: 1px solid white; color: white; font-size: 14px;">
      <th style = "text-align: center; border: 2px solid white;  padding: 10px 0px; border: 2px solid white; border-radius: 10px; background: #2E2E7C; background: linear-gradient(18deg,rgba(46, 46, 124, 1) 15%, rgba(254, 194, 60, 1) 35%, rgba(196, 11, 64, 1) 100%);">중식 - 색동 🍚 (${mealData.data[2][0].kcal} kcal)</th>
      <th style = "text-align: center; border: 2px solid white; border-radius: 10px; background: #C40B40;">중식 - 아시아나 🛫 (${mealData.data[2][1].kcal} kcal)</th>
      </tr>
      <tr style = " ">
        ${lunchMenuItem}
      </tr>
      <tr style="background-color: #418F7E; border: 1px solid white; color: white; font-size: 14px;">    
        <th colspan="2" style = "text-align: center; border: 2px solid white;  padding: 10px 0px; border: 2px solid white; border-radius: 10px; background: #011645;">석식 🌙 (${mealData.data[3][0].kcal} kcal)</th>
      </tr>
      <tr style = " ">   
        <td colspan="2" id = "evening1" style = "text-align: center; padding: 10px 0px; border: 2px solid white; ">
        ${eveningMenuItem}
        </td>
      </tr>
    </table>
  </body>
</html>
`
    const weekday = today.getDay();
    // 코드를 수정할 때는 아래 MailApp.sendEmail 함수를 주석 처리합니다.
    try{
      if (weekday >= 1 && weekday <= 5) {
        MailApp.sendEmail({to: userEmail, subject: subject, htmlBody: html});
        Logger.log("메일 전송 완료함.")
      }
    }catch(e){
      Logger.log(e.message);
    }
  }
}