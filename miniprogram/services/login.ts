import {
  Cookie, GetCookieFailedResult, GetCookieSuccessResult, NameSuccessResult,
  NameFailedResult, LoginResult,
} from '../utils/types';
import { parseCookiesFromWx, toCookieString } from '../utils/util';
import crypto from 'crypto-js';

export const getCookie = (
  username: string,
  password: string,
): Promise<GetCookieSuccessResult | GetCookieFailedResult> => {
  const wordArray = crypto.enc.Utf8.parse('u2oh6Vu^HWe40fj');
  const encryptedPassword = crypto.DES.encrypt(password, wordArray, {
    mode: crypto.mode.ECB,
    padding: crypto.pad.Pkcs7,
  });
  const encryptedPasswordString = encryptedPassword.ciphertext.toString();

  return new Promise((resolve, reject) => wx.request({
    method: 'POST',
    header: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-Requested-With': 'XMLHttpRequest',
    },
    url: 'https://passport2.chaoxing.com/fanyalogin',
    data: `uname=${username}&password=${encryptedPasswordString}&fid=-1&t=true&refer=https%253A%252F%252Fi.chaoxing.com&forbidotherlogin=0&validate=`,
    success: ({ data, cookies }) => {
      const rawData = data as any;

      if (typeof rawData.status === 'boolean' && rawData.status) {
        try {
          resolve({
            status: true,
            data: rawData,
            message: '',
            cookie: parseCookiesFromWx(cookies),
          });
        } catch (e) {
          resolve({
            status: false,
            data,
            message: e instanceof TypeError
              ? `failed to parse cookie: ${e.message}`
              : `unknown error: ${JSON.stringify(e)}`,
            cookie: {},
          });
        }
      } else {
        resolve({
          status: false,
          data,
          message: 'Chaoxing returned false of status',
          cookie: {},
        });
      }
    },
    fail: (e) => reject(e),
  }));
}

export const getName = (
  cookie: Cookie,
): Promise<NameSuccessResult | NameFailedResult> => 
  new Promise((resolve, reject) => wx.request({
    url: 'https://passport2.chaoxing.com/mooc/accountManage',
    header: {
      Cookie: toCookieString({
        uf: cookie.uf,
        _d: cookie._d,
        UID: cookie.id,
        vc3: cookie.vc3,
      }),
    },
    success: ({ data }) => {
      if (typeof data !== 'string') {
        resolve({
          status: false,
          data,
          message: 'cannot resolve data: data is not a string',
          cookie,
          name: '',
        });
        return;
      }

      // TODO: possible different data from server?
      const nameEndIndex = data.indexOf('姓名');
      if (nameEndIndex < 0) {
        resolve({
          status: false,
          data,
          message: 'cannot find the name in data',
          cookie,
          name: '',
        });
        return;
      }
      
      const endTagBeginingIndex = data.lastIndexOf('<', nameEndIndex);
      const startTagEndingIndex = data.lastIndexOf('>', endTagBeginingIndex);
      const name = data.slice(startTagEndingIndex + 1, endTagBeginingIndex);
      // https://stackoverflow.com/a/16369725
      const trimedName = name.replace(/^\s*$(?:\r\n?|\n)/gm, '').trim();

      resolve({
        status: true,
        data,
        message: '',
        cookie,
        name: trimedName,
      });
    },
    fail: (e) => reject(e),
  }));

export const login = (
  username: string,
  password: string,
): Promise<LoginResult | GetCookieFailedResult | NameFailedResult> =>
  new Promise((resolve, reject) =>
    getCookie(username, password).then((result) => result.status
        ? getName(result.cookie)
            .then((result) => resolve(!result.status ? result : {
              ...result,
              user: { ...result.cookie, name: result.name },
            }))
        : resolve(result)
    ).catch((error) => reject(error))
  );
