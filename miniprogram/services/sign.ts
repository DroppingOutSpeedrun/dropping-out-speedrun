import {
  Cookie, CookieStringResult, IsPhotoSignResult, LocationSignResult,
  PhotoSignResult, PreSignResult, QrCodeSignResult, SignResult, User
} from '../utils/types';
import { cookieForSign, parametersToString, toCookieString } from '../utils/util';

export const preSign = (
  cookie: Cookie, activityId: number, courseId: number, classId: number,
): Promise<PreSignResult> => new Promise(
  (resolve, reject) => wx.request({
    url: `https://mobilelearn.chaoxing.com/newsign/preSign?courseId=${courseId}&classId=${classId}&activePrimaryId=${activityId}&general=1&sys=1&ls=1&appType=15&&tid=&uid=${cookie.id}&ut=s`,
    header: {
      Cookie: toCookieString({
        uf: cookie.uf,
        _d: cookie._d,
        UID: cookie.id,
        vc3: cookie.vc3,
      })
    },
    // we don't care about the returned data actually
    success: (data) => resolve({
      status: true,
      data,
      message: '',
      cookie,
      activityId,
      courseId,
      classId,
    }),
    fail: (e) => reject(e),
  })
);

export const isPhotoSign = (
  activityId: number,
  cookie: Cookie
): Promise<IsPhotoSignResult> => new Promise((resolve, reject) =>
  wx.request({
    url: `https://mobilelearn.chaoxing.com/v2/apis/active/getPPTActiveInfo?activeId=${activityId}`,
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

      if (!rawData.data || typeof rawData.data.ifphoto !== 'number') {
        resolve({
          status: false,
          message: 'failed to parse ifphoto from data',
          data,
          cookie,
          activityId,
          isPhoto: false,
        });
        return;
      }

      resolve({
        status: true,
        message: '',
        data,
        cookie,
        activityId,
        isPhoto: rawData.data.ifphoto === 1,
      });
    },
    fail: (e) => reject(e),
  }));

const sign = (
  parameters: { [key: string]: any },
  cookie: { [key: string]: any },
): Promise<CookieStringResult> => new Promise((resolve, reject) => wx.request({
  url: `https://mobilelearn.chaoxing.com/pptSign/stuSignajax${Object.keys(parameters).length > 0 ? `?${parametersToString(parameters)}` : ''}`,
  header: { Cookie: toCookieString(cookie) },
  success: ({ data }) => resolve({
      status: data === 'success' || data === '您已签到过了',
      message: '',
      data,
      cookieString: toCookieString(cookie),
    }),
  fail: (e) => reject(e),
}));

export const generalSign = (
  user: User,
  activityId: number,
): Promise<SignResult> => sign(
  {
    activeId: activityId.toString(),
    uid: user.id,
    clientip: '',
    latitude: '-1',
    longitude: '-1',
    appType: '15',
    fid: user.fid,
    name: encodeURI(user.name),
  },
  cookieForSign(user),
).then((result) => ({ ...result, cookie: user, user, activityId }));

export const qrCodeSign = (
  user: User,
  activityId: number,
  enc: string,
  longitude: number,
  latitude: number,
  altitude: number,
  address: string,
): Promise<QrCodeSignResult> => sign(
  {
    enc,
    name: encodeURI(user.name),
    activeId: activityId.toString(),
    uid: user.id,
    clientip: '',
    ...(
      !Number.isNaN(latitude) && !Number.isNaN(longitude)
        ? {
          location: encodeURI(`{"result":"1","address":"${address}","latitude":${latitude},"longitude":${longitude},"altitude":${altitude}}`),
        }
        : {}
    ),
    useragent: '',
    latitude: '-1',
    longitude: '-1',
    fid: user.fid,
    appType: '15',
  },
  cookieForSign(user),
).then((result) => ({ ...result, cookie: user, user, activityId, enc }));

export const locationSign = (
  user: User,
  activityId: number,
  longitude: number,
  latitude: number,
  address: string,
): Promise<LocationSignResult> => sign(
  {
    name: encodeURI(user.name),
    address,
    activeId: activityId.toString(),
    uid: user.id,
    clientip: '',
    latitude: latitude.toString(),
    longitude: longitude.toString(),
    fid: user.fid,
    appType: '15',
    ifTiJiao: '1',
  },
  cookieForSign(user),
).then((result) => ({
  ...result,
  cookie: user,
  user,
  activityId,
  longitude,
  latitude,
  address,
}));

export const photoSign = (
  user: User,
  activityId: number,
  fileId: string,
): Promise<PhotoSignResult> => sign(
  {
    activeId: activityId.toString(),
    uid: user.id,
    clientip: '',
    useragent: '',
    latitude: '-1',
    longitude: '-1',
    appType: '15',
    fid: user.fid,
    objectId: fileId,
    name: encodeURI(user.name),
  },
  cookieForSign(user),
).then((result) => ({ ...result, cookie: user, user, activityId, fileId }));
