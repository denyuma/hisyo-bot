'use strict';	
const kuromoji = require('kuromoji');	

const builder = kuromoji.builder({	
  dicPath: 'node_modules/kuromoji/dict'	
});	

function find575(targets) {	
  return new Promise((resolve, reject) => {	
    let haikuResults = [] //結果を入れる配列	

    builder.build((err, tokenizer) => {	
      if (err) {	
        return reject(err);	
      }	

      targets.forEach(target => {	
        const result = tokenizer.tokenize(target.text);	

        let haiku = '';	
        let kanaHaiku = '';	
        let hasFirst5 = false;	
        let hasSecond7 = false;	
        let hasThird5 = false;	

        for (let key = 0; key < result.length; key++) {	
          let wordInfo = result[key];	
          if (wordInfo.length < 9) {	
            // 単語の情報が不足していた	
            haikuResults.push(false);	
            return;	
          }	

          let original = wordInfo['surface_form'];	
          let type = wordInfo['pos'];	
          let kana = wordInfo['reading'];	
          if (kana) {	
            kana = kana.replace(/[ァィゥェォャュョ]/g, '');	
          }	
          hasThird5 = false;	

          if (type === '記号') {	
            continue;	
          } // 記号は全て無視する。	

          kanaHaiku += kana;	
          haiku += original;	

          if (!hasFirst5) {	
            if (kanaHaiku.length > 5) {	
              // 上句が 5 文字よりも多い	
              haikuResults.push(false);	
              return;	
            }	
            if (kanaHaiku.length === 5) {	
              haiku += ' ';	
              hasFirst5 = true;	
              continue;	
            }	
          }	

          // 助詞はじまりはダメ	
          if (kanaHaiku.length === 5 && type === '助詞') {	
            // 上句を助詞から始めることはできない	
            haikuResults.push(false);	
            return;	
          }	

          if (!hasSecond7) {	
            if (kanaHaiku.length > 12) {	
              // 上句・中句の合計が 12 文字よりも多い	
              haikuResults.push(false);	
              return;	
            }	
            if (kanaHaiku.length === 12) {	
              haiku += ' ';	
              hasSecond7 = true;	
              continue;	
            }	
          }	

          // 助詞はじまりはダメ	
          if (kanaHaiku.length === 12 && type === '助詞') {	
            // 中句を助詞から始めることはできない	
            haikuResults.push(false);	
            return;	
          }	

          if (!hasThird5) {	
            if (kanaHaiku.length > 17) {	
              // 全体が 17 文字よりも多い	
              haikuResults.push(false);	
              return;	
            }	

            if (kanaHaiku.length === 17) {	
              hasThird5 = true;	
            }	
          }	

          if (hasFirst5 && hasSecond7 && hasThird5) {	
            haikuResults.push({	
              haiku: haiku,	
              text: target.text,	
              id_str: target.id_str,	
              user_name: target.user_name	
            });	
            return;	
          }	

          // 俳句ではなかった	
          haikuResults.push(false);	

        }	

      })	
      resolve(haikuResults);	
    });	
  });	
}	

module.exports = { find575 }; 