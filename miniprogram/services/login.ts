import {
  Cookie, GetCookieFailedResult, GetCookieSuccessResult, NameSuccessResult,
  NameFailedResult, LoginResult,
} from '../utils/types';
import { parseCookiesFromWx, toCookieString } from '../utils/util';
import crypto from 'crypto-js';

const toCookieResult = (
  data: any, cookies: string[],
): GetCookieSuccessResult | GetCookieFailedResult => {
  const rawData = data as any;

  if (typeof rawData.status === 'boolean' && rawData.status) {
    try {
      return {
        status: true,
        data: rawData,
        message: '',
        cookie: parseCookiesFromWx(cookies),
      };
    } catch (e) {
      return {
        status: false,
        data,
        message: e instanceof TypeError
          ? `failed to parse cookie: ${e.message}`
          : `unknown error: ${JSON.stringify(e)}`,
        cookie: {},
      };
    }
  } else {
    return {
      status: false,
      data,
      message: 'Chaoxing returned false of status',
      cookie: {},
    };
  }
}

export const getCookieByFanya = (
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
    success: ({ data, cookies }) => resolve(toCookieResult(data, cookies)),
    fail: (e) => reject(e),
  }));
}

// https://www.myitmx.com/123.html
export const getCookieByV11 = (
  username: string,
  password: string,
): Promise<GetCookieSuccessResult | GetCookieFailedResult> => (
  new Promise((resolve, reject) => wx.request({
    url: `https://passport2-api.chaoxing.com/v11/loginregister?code=${password}&cx_xxt_passport=json&uname=${username}&loginType=1&roleSelect=true`,
    success: ({ data, cookies }) => resolve(toCookieResult(data, cookies)),
    fail: (e) => reject(e),
  }))
)

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

export const toLoginResult = (
  result: GetCookieSuccessResult | GetCookieFailedResult
): Promise<LoginResult | GetCookieFailedResult | NameFailedResult> =>
  new Promise((resolve) => {
    if (!result.status) {
      resolve(result);
      return;
    }

    getName(result.cookie).then((result) => resolve(
      result.status
        ? {
          ...result,
          user: { ...result.cookie, name: result.name },
        }
        : result,
    ))
  })

export const loginByFanya = (
  username: string,
  password: string,
): Promise<LoginResult | GetCookieFailedResult | NameFailedResult> =>
  new Promise((resolve, reject) =>
    getCookieByFanya(username, password).then((result) =>
      toLoginResult(result).then((r) => resolve(r))
    ).catch((error) => reject(error))
  );

export const loginByV11 = (
  username: string,
  password: string,
): Promise<LoginResult | GetCookieFailedResult | NameFailedResult> =>
  new Promise((resolve, reject) =>
    getCookieByV11(username, password).then((result) =>
      toLoginResult(result).then((r) => resolve(r))
    ).catch((error) => reject(error))
  );
