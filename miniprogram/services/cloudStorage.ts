import { CloudStorageTokenResult, Cookie, UploadFileResult } from "../utils/types";
import { isString, toCookieString } from "../utils/util";
// No @types/zlyboy__wx-formdata for @zlyboy/wx-formdata
const FormData = require('@zlyboy/wx-formdata');

export const getCloudStorageToken = (
  cookie: Cookie,
): Promise<CloudStorageTokenResult> => new Promise((resolve, reject) =>
  wx.request({
    url: `https://pan-yz.chaoxing.com/api/token/uservalid`,
    header: {
      Cookie: toCookieString({
        uf: cookie.uf,
        _d: cookie._d,
        UID: cookie.id,
        vc3: cookie.vc3,
      }),
    },
    success: ({ data }) => {
      const rawData = data as any;

      if (!isString(rawData._token)) {
        resolve({
          status: false,
          data,
          message: 'failed to parse token from data',
          cookie,
          token: '',
        });
        return;
      }
    
      resolve({
        status: true,
        data,
        message: '',
        cookie,
        token: rawData._token,
      });
    },
    fail: (e) => reject(e),
  }));

export const uploadFile = (
  cookie: Cookie,
  token: string,
  filePath: string,
): Promise<UploadFileResult> => {
  const form = new FormData();
  const filename = filePath.slice(filePath.lastIndexOf('/') + 1);
  form.appendFile('file', filePath, filename);
  form.append('puid', cookie.id);
  
  const data = form.getData();
  return new Promise((resolve, reject) => wx.request({
    method: 'POST',
    url: `https://pan-yz.chaoxing.com/upload?_from=mobilelearn&_token=${token}`,
    header: {
      Cookie: toCookieString({
        uf: cookie.uf,
        _d: cookie._d,
        UID: cookie.id,
        vc3: cookie.vc3,
      }),
      'Content-Type': data.contentType,
    },
    data: data.buffer,
    success: (data) => {
      const rawData = data as any;

      if (
        !rawData.data || !isString(rawData.data.objectId)
          || !(rawData.data.objectId.length > 0)
      ) {
        resolve({
          status: false,
          data,
          message: '',
          cookie,
          token: '',
          filePath: '',
          fileId: '',
        });
      }

      resolve({
        status: true,
        data,
        message: '',
        cookie,
        token,
        filePath,
        fileId: rawData.data.objectId,
      });
    },
    fail: (e) => reject(e),
  }));
};
