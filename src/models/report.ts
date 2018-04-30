import Knex = require('knex');
import * as moment from 'moment';

export default class ReportModel {
  
  comma(num) {
    var number = +num
    num = number.toFixed(2);
    let deci = num.substr(num.length - 2, num.length);
    num = num.substr(0, num.length - 3);

    var l = num.toString().length
    var num2 = '';
    var c = 0;
    for (var i = l - 1; i >= 0; i--) {
      c++;
      if (c == 3 && num[i - 1] != null) { c = 0; num2 = ',' + num[i] + num2 }
      else num2 = num[i] + num2
    }
    return num2 + '.' + deci;
  }

  commaQty(num) {
    num = '' + num;
    var l = num.toString().length
    var num2 = '';
    var c = 0;
    for (var i = l - 1; i >= 0; i--) {
      c++;
      if (c == 3 && num[i - 1] != null) { c = 0; num2 = ',' + num[i] + num2 }
      else num2 = num[i] + num2
    }
    return num2;
  }

  bahtText(num) {
    var number = +num
    num = '' + number.toFixed(2);
    let deci = num.substr(num.length - 2, 2);
    num = num.substr(0, num.length - 3);
    console.log(num)
    console.log(deci)
    //สร้างอะเรย์เก็บค่าที่ต้องการใช้เอาไว้
    var TxtNumArr = new Array("ศูนย์", "หนึ่ง", "สอง", "สาม", "สี่", "ห้า", "หก", "เจ็ด", "แปด", "เก้า", "สิบ");
    var TxtDigitArr = new Array("", "สิบ", "ร้อย", "พัน", "หมื่น", "แสน", "ล้าน");
    var BahtText = "";
    //ตรวจสอบดูซะหน่อยว่าใช่ตัวเลขที่ถูกต้องหรือเปล่า ด้วย isNaN == true ถ้าเป็นข้อความ == false ถ้าเป็นตัวเลข
    // num='5671';
    var num2 = num;
    var lnum = num.length;
    var cm = 0;
    num = "";
    for (var i = lnum - 1; i >= 0; i--) {
      num += num2[i];
    }
    if (lnum > 7) {
      for (var i = lnum - 1; i >= 0; i--) {

        if (i < 6) { i = -1; BahtText += TxtDigitArr[6]; cm = 1 }
        else if (num[i] == 0) {
          if (num[i + 1] == 1 && num[i] == 0 && i == 6) { BahtText += TxtDigitArr[6]; }
        }
        else if (num[8] == 1 && num[7] == 0 && num[6] == 1 && i == 6) {
          BahtText += TxtNumArr[1] + TxtDigitArr[6];
          cm = 1;
        }
        else if (i == 7 && num[i] == 2) {
          BahtText += 'ยี่' + TxtDigitArr[i - 6]
        }
        else if (i == 6 && num[i] == 1) {
          BahtText += 'เอ็ด'
        }
        else if (i == 7 && num[i] == 1) {
          BahtText += TxtDigitArr[i - 6];
          cm = 1;
        }
        else
          BahtText += TxtNumArr[num[i]] + TxtDigitArr[i - 6]
      }
    }
    var c = 1;
    for (var i = lnum - 1; i >= 0; i--) {
      if (lnum > 7 && c == 1) { i = 6; c = 0; }
      if (lnum > 7 && cm == 1) { i = 5; cm = 0 }
      if (num[i] == 0) { }
      else if (i == 1 && num[i] == 1) {
        BahtText += TxtDigitArr[i];
      }
      else if (i == 1 && num[i] == 2) {
        BahtText += 'ยี่' + TxtDigitArr[i]
      }
      else if (lnum == 1 && num[0] == 1) {
        BahtText += TxtNumArr[num[i]] + TxtDigitArr[i]
      }
      else if (i == 0 && num[i] == 1 && num[1] != 0) {
        BahtText += 'เอ็ด'
      }
      else
        BahtText += TxtNumArr[num[i]] + TxtDigitArr[i]
    }
    if (num == 0) BahtText += 'ศูนย์';
    if (deci == '0' || deci == '00') {
      BahtText += 'บาทถ้วน';
    } else {
      var deci2 = deci;
      lnum = deci.length;
      deci = '';
      for (var i = lnum - 1; i >= 0; i--) {
        deci += deci2[i];
      }
      BahtText += 'บาท';
      for (var i = lnum - 1; i >= 0; i--) {
        if (deci[i] == 0) { }
        else if (i == 1 && deci[i] == 1) {
          BahtText += TxtDigitArr[i];
        }
        else if (i == 1 && deci[i] == 2) {
          BahtText += 'ยี่' + TxtDigitArr[i]
        }
        // else if(1==1&&deci[0]==1){
        //     BahtText+=TxtNumArr[deci[i]]+TxtDigitArr[i]
        // }
        else if (i == 0 && deci[i] == 1 && deci[1] != 0) {
          BahtText += 'เอ็ด'
        }
        else
          BahtText += TxtNumArr[deci[i]] + TxtDigitArr[i]

      }
      BahtText += 'สตางค์';
    }
    return BahtText;
  }

  async hospital(knex: Knex) {
    let array = [];
    let result = await this.hospname(knex);
    result = JSON.parse(result[0].value);
    array.push(result);
    return array;
  }

  hospname(knex: Knex) {
    return knex.select('value').from('sys_settings').where('action_name', 'SYS_HOSPITAL');
  }

}  